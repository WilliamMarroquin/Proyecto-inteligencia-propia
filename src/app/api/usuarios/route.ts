import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true, nombre: true, apellidos: true, email: true, telefono: true,
        rol: true, permisos: true, estado: true, createdAt: true, fotografia: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(usuarios);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Check if email exists
    const existing = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.usuario.create({
      data: {
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        password: hashedPassword,
        telefono: data.telefono,
        fotografia: data.fotografia,
        rol: data.rol,
        permisos: data.permisos,
        estado: 'activo'
      }
    });

    // Auditoría
    const sessionCookie = req.headers.get('cookie');
    let superAdminId = null;
    // (En una implementación real idealmente leeríamos la sesión aquí, pero podemos dejarlo a nombre de "Sistema")
    await prisma.auditoria.create({
      data: {
        usuarioId: null, 
        accion: "CREATE_USER",
        detalles: `Se creó el usuario ${newUser.nombre} ${newUser.apellidos} (${newUser.email}) con rol ${newUser.rol}.`
      }
    });

    return NextResponse.json({ success: true, user: { id: newUser.id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
