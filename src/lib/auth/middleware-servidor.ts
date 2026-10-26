import { getSessionCookie } from './session';
import { query } from '@/lib/db/pool';
import type { Role } from '@/lib/auth/roles';

export interface Sessao {
  userId: string;
  email: string;
  fullName: string | null;
  roles: Role[];
  exp?: number;
}

export async function verificarSessao(permitidos?: Role[]): Promise<Sessao> {
  const sessionCookie = await getSessionCookie();

  if (!sessionCookie) {
    throw new Error('Não autenticado');
  }

  let payload: Sessao;
  try {
    payload = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
  } catch {
    throw new Error('Sessão inválida');
  }

  if (payload.exp && Date.now() > payload.exp) {
    throw new Error('Sessão expirada');
  }

  const result = await query(
    'select is_active from profiles where id = $1',
    [payload.userId],
  );

  if (result.rows.length === 0) {
    throw new Error('Utilizador não encontrado');
  }
  if (!result.rows[0].is_active) {
    throw new Error('Utilizador inativo');
  }

  if (permitidos && !permitidos.some((p) => payload.roles.includes(p))) {
    throw new Error('Sem permissão');
  }

  return payload;
}
