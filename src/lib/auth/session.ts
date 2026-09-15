import { cookies } from 'next/headers';
import type { Role } from '@/lib/auth/roles';

const SESSION_COOKIE = 'alimenta_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 dias

export interface Sessao {
  userId: string;
  email: string;
  fullName: string | null;
  roles: Role[];
  exp?: number;
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function setSessionCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export function gerarTokenSessao(payload: Sessao): string {
  const expiraEm = Date.now() + SESSION_MAX_AGE * 1000;
  return Buffer.from(JSON.stringify({ ...payload, exp: expiraEm })).toString('base64');
}

export function validarTokenSessao(token: string): Sessao | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function revogarSessao(): Promise<void> {
  await clearSessionCookie();
}
