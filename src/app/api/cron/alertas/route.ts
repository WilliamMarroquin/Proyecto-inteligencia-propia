import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const config = await prisma.configuracion.findFirst();
    if (!config || !config.alertaEmailUser || !config.alertaEmailPassword) {
      return NextResponse.json({ error: "Configuración de correo de alertas no encontrada (Ve a Ajustes -> Apartado 2)" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // Asumiremos Gmail/Google Workspace por defecto
      port: 465,
      secure: true,
      auth: {
        user: config.alertaEmailUser,
        pass: config.alertaEmailPassword
      }
    });

    // Calcular mora
    const clientes = await prisma.cliente.findMany({
      include: { convenios: true, pagos: true }
    });

    const morosos = [];

    for (const cliente of clientes) {
      const convenio = cliente.convenios[0];
      if (!convenio) continue;

      const pagosTotales = cliente.pagos.reduce((acc, pago) => acc + pago.monto, 0);
      const mesesTranscurridos = Math.max(1, Math.floor((new Date().getTime() - new Date(convenio.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)));
      const mesesEfectivos = mesesTranscurridos < 2 ? 6 : mesesTranscurridos; // Lógica de prototipo
      const deudaTotal = mesesEfectivos * convenio.montoCuota;
      const saldoPendiente = deudaTotal - pagosTotales;
      
      if (saldoPendiente > 0) {
        const mesesAtraso = Math.floor(saldoPendiente / convenio.montoCuota);
        if (mesesAtraso > 0) {
          morosos.push({
            nombre: cliente.nombre,
            mesesAtraso,
            saldoPendiente,
            email: cliente.email
          });
        }
      }
    }

    if (morosos.length === 0) {
      return NextResponse.json({ message: "No hay clientes en mora actualmente." });
    }

    // Generar correo dinámico para cada moroso y enviarlo
    let enviados = 0;
    for (const m of morosos) {
      // Plantilla inteligente dinámica (Recordatorio Automático)
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Aviso Importante: Atraso en su Convenio</h2>
          <p>Estimado/a <strong>${m.nombre}</strong>,</p>
          <p>Le escribimos de parte de UDEVIPO para recordarle amablemente que su convenio de pagos presenta un atraso de <strong>${m.mesesAtraso} meses</strong>.</p>
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">Saldo vencido a la fecha:</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #ef4444;">Q${m.saldoPendiente.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <p>Le invitamos a regularizar su situación lo antes posible para evitar recargos o penalizaciones sobre su convenio.</p>
          <p>Si ya realizó el pago, por favor ignore este mensaje.</p>
          <br/>
          <p>Atentamente,<br/><strong>Departamento de Cartera - UDEVIPO</strong></p>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: `"Cartera UDEVIPO" <${config.alertaEmailUser}>`,
          to: m.email,
          subject: `Aviso de Atraso en Convenio - UDEVIPO`,
          html: emailHtml
        });
        enviados++;
      } catch (err) {
        console.error(`Error enviando a ${m.email}:`, err);
      }
    }

    return NextResponse.json({ success: true, message: `Se enviaron recordatorios automáticos a ${enviados} clientes morosos.` });
  } catch (error: any) {
    console.error('Error enviando alertas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
