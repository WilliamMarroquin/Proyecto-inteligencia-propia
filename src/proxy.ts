import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export default async function proxy(request: NextRequest) {
  const token = request.cookies.get('finasist_auth')?.value;
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/login';
  
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'finasist-secret-key-super-secure');
      const { payload } = await jwtVerify(token, secret);
      
      // Si está en login y el token es válido, redirigir a inicio
      if (isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Proteger rutas de Super Admin
      const isSuperAdminRoute = pathname.startsWith('/configuracion') || pathname.startsWith('/usuarios') || pathname.startsWith('/auditoria');
      if (isSuperAdminRoute && payload.rol !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/', request.url)); // No autorizado
      }

      // TODO: Las protecciones más finas (Dashboard, Cartera) se manejarán en la UI o aquí
      // dependiendo de los 'permisos' en el payload.

      return NextResponse.next();
    } catch (error) {
      // Token inválido o expirado
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('finasist_auth');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
