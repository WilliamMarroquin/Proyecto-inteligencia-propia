import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const { convenioId, nuevaCuota } = await req.json();
    if (!convenioId || !nuevaCuota) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    const convenioActual = await prisma.convenio.findUnique({ where: { id: convenioId }});
    if (!convenioActual) return NextResponse.json({ error: "Convenio no encontrado" }, { status: 404 });

    const updated = await prisma.convenio.update({
      where: { id: convenioId },
      data: {
        cuotaAnterior: convenioActual.montoCuota, // Guardar historial de lo que pagaba antes
        montoCuota: parseFloat(nuevaCuota),
        fechaRecalculo: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
