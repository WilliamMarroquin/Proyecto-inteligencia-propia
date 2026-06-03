import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const config = await prisma.configuracion.findFirst();
    if (!config || !config.emailUser || !config.emailPassword) {
      return NextResponse.json({ error: "Configuración de correo no encontrada" }, { status: 400 });
    }

    // Usaremos el mismo host IMAP pero asumiendo que es cPanel/estándar donde IMAP/SMTP comparten host.
    let smtpHost: string = config.emailHost || '';
    if (smtpHost.includes('imap.gmail.com')) smtpHost = 'smtp.gmail.com';
    if (smtpHost.includes('outlook.office365.com')) smtpHost = 'smtp.office365.com';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpHost.includes('gmail') ? 465 : 587,
      secure: smtpHost.includes('gmail') ? true : false,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword
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

    // Generar correo
    let emailHtml = `
      <h2>Alerta de Morosidad - Cartera UDEVIPO</h2>
      <p>El sistema ha detectado <strong>${morosos.length}</strong> clientes con atrasos en sus convenios de pago al día de hoy.</p>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <tr style="background-color: #f3f4f6;">
          <th>Cliente</th>
          <th>Meses de Atraso</th>
          <th>Saldo Vencido (GTQ)</th>
        </tr>
    `;

    for (const m of morosos) {
      emailHtml += `
        <tr>
          <td>${m.nombre}</td>
          <td style="color: red; font-weight: bold; text-align: center;">${m.mesesAtraso} meses</td>
          <td style="text-align: right;">Q${m.saldoPendiente.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    }
    emailHtml += `</table><p>Por favor, inicie las gestiones de cobro correspondientes.</p><p><em>Este es un correo generado automáticamente por Finasist AI.</em></p>`;

    // Enviar alerta al mismo correo configurado (o a los asesores en el futuro)
    await transporter.sendMail({
      from: `"Finasist AI - Alertas" <${config.emailUser}>`,
      to: config.emailUser, // Enviar al administrador
      subject: `🚨 Alerta de Mora: ${morosos.length} clientes con atraso`,
      html: emailHtml
    });

    return NextResponse.json({ success: true, message: `Alerta enviada para ${morosos.length} morosos.` });
  } catch (error: any) {
    console.error('Error enviando alertas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
