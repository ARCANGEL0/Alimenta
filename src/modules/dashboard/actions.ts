'use server';

import { hasRole } from '@/src/lib/permissions';
import type { Role } from '@/src/lib/permissions';
import { obterIndicadoresDashboard } from './queries';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';
const ROLE_SOCIAL_WORKER: Role = 'social_worker';

export async function actionObterIndicadoresDashboard(): Promise<{
  indicadores: Awaited<ReturnType<typeof obterIndicadoresDashboard>>;
  erro?: string;
}> {
  const permitido = await hasRole([
    ROLE_ADMIN,
    ROLE_OPERADOR,
    ROLE_SOCIAL_WORKER,
  ]);
  if (!permitido) {
    return {
      indicadores: undefined,
      erro: 'Sem permissão para visualizar indicadores.',
    };
  }

  try {
    const indicadores = await obterIndicadoresDashboard();
    return { indicadores };
  } catch (erro) {
    return {
      indicadores: undefined,
      erro: 'Erro ao obter indicadores.',
    };
  }
}
