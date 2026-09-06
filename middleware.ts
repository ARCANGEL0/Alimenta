import { getSessionCookie } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROTAS_PUBLICAS = ['/', '/login', '/api/auth/login', '/api/auth/logout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSessionCookie();

  const ehRotaPublica = pathname === '/' || ROTAS_PUBLICAS.some((r) => r !== '/' && pathname.startsWith(r));

  if (ehRotaPublica) {
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
