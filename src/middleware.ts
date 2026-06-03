import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuth = request.cookies.has('finasist_auth');
  const isLoginPage = request.nextUrl.pathname === '/login';
  
  // Excluir APIs de ser bloqueadas en este middleware simple
  // (En producción real, se asegurarían con tokens)
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Proteger todas las rutas públicas excepto /login
  if (!isAuth && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuth && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
