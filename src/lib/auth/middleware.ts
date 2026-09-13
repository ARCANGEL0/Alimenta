import { getSessionCookie } from './session';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROTAS_PUBLICAS = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSessionCookie();

  const ehRotaPublica = ROTAS_PUBLICAS.includes(pathname);

  if (ehRotaPublica) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
