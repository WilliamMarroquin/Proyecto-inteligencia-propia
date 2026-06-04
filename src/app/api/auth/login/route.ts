import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, otp } = body;

    // STEP 1: Validar Email y Password, y enviar OTP
    if (email && password && !otp) {
      const usuario = await prisma.usuario.findUnique({ where: { email } });
      
      if (!usuario || usuario.estado !== 'activo') {
        return NextResponse.json({ error: "Credenciales inválidas o cuenta inactiva" }, { status: 401 });
      }

      const isMatch = await bcrypt.compare(password, usuario.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
      }

      // Generar OTP de 6 dígitos
      const codigoOTP = Math.floor(100000 + Math.random() * 900000).toString();
      const expiraEn = new Date();
      expiraEn.setMinutes(expiraEn.getMinutes() + 10); // Expira en 10 minutos

      // Guardar OTP en DB
      await prisma.oTP.create({
        data: {
          usuarioId: usuario.id,
          codigo: codigoOTP,
          expiraEn
        }
      });

      // Enviar OTP por correo
      const config = await prisma.configuracion.findFirst();
      if (config && config.tokenEmailUser && config.tokenEmailPassword) {
        // Enviar usando el correo configurado para el sistema
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com', // Asumiremos Gmail o equivalente para el prototipo
          port: 465,
          secure: true,
          auth: { user: config.tokenEmailUser, pass: config.tokenEmailPassword }
        });

        await transporter.sendMail({
          from: `"Finasist Seguridad" <${config.tokenEmailUser}>`,
          to: usuario.email,
          subject: "🔐 Tu Código de Acceso - Finasist AI",
          html: `
            <h2>Código de Verificación</h2>
            <p>Hola ${usuario.nombre},</p>
            <p>Alguien intentó iniciar sesión en tu cuenta. Usa este código para acceder:</p>
            <h1 style="letter-spacing: 5px; color: #3b82f6;">${codigoOTP}</h1>
            <p>Este código expira en 10 minutos.</p>
            ${config.tokenFirmaUrl ? `<br><img src="${config.tokenFirmaUrl}" alt="Firma" style="max-height: 80px;" />` : ''}
          `
        }).catch(err => console.error("Error enviando OTP:", err));
      } else {
        // Si no hay configuración SMTP, lo imprimimos en consola para desarrollo
        console.log(`[DESARROLLO] OTP para ${usuario.email} es: ${codigoOTP}`);
      }

      return NextResponse.json({ step: "2fa", message: "Código OTP enviado a tu correo" });
    }

    // STEP 2: Validar OTP e Iniciar Sesión (Generar JWT)
    if (email && otp) {
      const usuario = await prisma.usuario.findUnique({ where: { email } });
      if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

      // Buscar el OTP válido más reciente
      const validOtp = await prisma.oTP.findFirst({
        where: {
          usuarioId: usuario.id,
          codigo: otp,
          usado: false,
          expiraEn: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!validOtp) {
        return NextResponse.json({ error: "Código inválido o expirado" }, { status: 401 });
      }

      // Marcar como usado
      await prisma.oTP.update({
        where: { id: validOtp.id },
        data: { usado: true }
      });

      // Generar JWT usando 'jose'
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'finasist-secret-key-super-secure');
      const token = await new SignJWT({ 
        id: usuario.id, 
        email: usuario.email, 
        rol: usuario.rol,
        permisos: usuario.permisos
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30m') // Caduca en 30 minutos EXACTOS
        .sign(secret);

      // Registrar en Auditoría
      await prisma.auditoria.create({
        data: {
          usuarioId: usuario.id,
          accion: "LOGIN",
          detalles: "Inicio de sesión exitoso con 2FA."
        }
      });

      const response = NextResponse.json({ success: true, rol: usuario.rol });
      response.cookies.set({
        name: 'finasist_auth',
        value: token,
        httpOnly: true,
        path: '/',
        maxAge: 30 * 60 // 30 minutos en segundos
      });

      return response;
    }

    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
