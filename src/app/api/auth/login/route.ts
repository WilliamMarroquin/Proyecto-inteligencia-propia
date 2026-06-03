import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    // Prototipo: Contraseña dura. En producción, usar bcrypt y base de datos.
    if (password === "admin123") {
      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: 'finasist_auth',
        value: 'true',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 semana
      });
      return response;
    }
    
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
