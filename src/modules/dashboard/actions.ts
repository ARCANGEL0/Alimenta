'use server';

import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';
import { obterIndicadoresDashboard } from './queries';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';
const ROLE_SOCIAL_WORKER: Role = 'social_worker';

export async function actionObterIndicadoresDashboard(): Promise<{
  indicadores?: Awaited<ReturnType<typeof obterIndicadoresDashboard>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR, ROLE_SOCIAL_WORKER]);
    const indicadores = await obterIndicadoresDashboard();
    return { indicadores };
  } catch (erro) {
    return { indicadores: undefined, erro: 'Erro ao obter indicadores.' };
  }
}
