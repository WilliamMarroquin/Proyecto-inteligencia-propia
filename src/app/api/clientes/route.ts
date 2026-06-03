import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        convenios: true,
        pagos: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const datosCalculados = clientes.map(cliente => {
      const convenio = cliente.convenios[0]; // Tomamos el primer convenio activo (prototipo)
      const pagosTotales = cliente.pagos.reduce((acc, pago) => acc + pago.monto, 0);
      
      let mesesAtraso = 0;
      let deudaTotal = 0;
      let cuota = 0;

      if (convenio) {
        cuota = convenio.montoCuota;
        // Lógica de prototipo para meses transcurridos: 
        // Asumimos que el convenio inició hace N meses basado en su createdAt.
        // Para que se vea en el prototipo, forzaremos algunos meses pasados si la fecha es muy reciente.
        const mesesTranscurridos = Math.max(1, Math.floor((new Date().getTime() - new Date(convenio.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)));
        
        // Simulación visual para el prototipo (asume 5 meses si acaba de crearse para poder mostrar mora si no pagó lo suficiente)
        const mesesEfectivos = mesesTranscurridos < 2 ? 6 : mesesTranscurridos; 

        deudaTotal = mesesEfectivos * cuota;
        const saldoPendiente = deudaTotal - pagosTotales;
        
        if (saldoPendiente > 0) {
          mesesAtraso = Math.floor(saldoPendiente / cuota);
        }
      }

      return {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        convenio: convenio ? {
          id: convenio.id,
          montoCuota: cuota,
          diaCorte: convenio.diaCorte,
          cuotaAnterior: convenio.cuotaAnterior
        } : null,
        estadisticas: {
          pagosRealizados: cliente.pagos.length,
          totalPagado: pagosTotales,
          mesesAtraso: mesesAtraso,
          estadoMorosidad: mesesAtraso > 0 ? 'moroso' : 'al dia'
        }
      };
    });

    return NextResponse.json(datosCalculados);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
