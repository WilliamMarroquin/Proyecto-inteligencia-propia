import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.permisos.includes('auditoria')) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const logs = await prisma.auditoria.findMany({
      include: {
        usuario: { select: { nombre: true, apellidos: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200 // Limitar a los últimos 200 eventos
    });
    
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
