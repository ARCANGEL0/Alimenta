'use server';

import { query } from '@/lib/db/pool';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';
import {
  limiaresSchema,
  loteAvaliarSchema,
  loteBloquearSchema,
  type LimiaresInput,
  type LoteAvaliarInput,
  type LoteBloquearInput,
} from './schemas';
import {
  avaliarLote,
  bloquearLote,
  listarLotesValidade,
  obterLimiaresValidade,
} from './queries';
import { revalidatePath } from 'next/cache';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';
const ROLE_SOCIAL_WORKER: Role = 'social_worker';

export async function actionListarLotesValidade(): Promise<{
  lotes: Awaited<ReturnType<typeof listarLotesValidade>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR, ROLE_SOCIAL_WORKER]);
    const lotes = await listarLotesValidade();
    return { lotes };
  } catch (erro) {
    return { lotes: [], erro: 'Erro ao listar lotes por validade.' };
  }
}

export async function actionObterLimiaresValidade(): Promise<{
  limiares: Awaited<ReturnType<typeof obterLimiaresValidade>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR, ROLE_SOCIAL_WORKER]);
    const limiares = await obterLimiaresValidade();
    return { limiares };
  } catch (erro) {
    return {
      limiares: { expired_days: 0, critical_days: 3, attention_days: 7 },
      erro: 'Erro ao obter limiares de validade.',
    };
  }
}

export async function actionAtualizarLimiaresValidade(
  input: LimiaresInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN]);
  } catch (erro) {
    return { sucesso: false, erro: 'Sem permissão para alterar limiares.' };
  }

  const resultado = limiaresSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await query(
      `insert into settings (key, value, updated_at)
       values ('expiry_thresholds', $1, now())
       on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`,
      [JSON.stringify(resultado.data)],
    );
    revalidatePath('/validade');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível guardar os limiares.',
    };
  }
}

export async function actionBloquearLote(
  input: LoteBloquearInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch (erro) {
    return { sucesso: false, erro: 'Sem permissão para bloquear lotes.' };
  }

  const resultado = loteBloquearSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await bloquearLote(resultado.data.batch_id, resultado.data.motivo);
    revalidatePath('/validade');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível bloquear o lote.',
    };
  }
}

export async function actionAvaliarLote(
  input: LoteAvaliarInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR, ROLE_SOCIAL_WORKER]);
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Sem permissão para avaliar lotes.',
    };
  }

  const resultado = loteAvaliarSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await avaliarLote(
      resultado.data.batch_id,
      resultado.data.avaliacao,
      resultado.data.notas ?? null,
    );
    revalidatePath('/validade');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível registar a avaliação do lote.',
    };
  }
}
