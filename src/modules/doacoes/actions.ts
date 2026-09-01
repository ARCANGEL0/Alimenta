'use server';

import { hasRole } from '@/src/lib/permissions';
import type { Role } from '@/src/lib/permissions';
import {
  doacaoItemSchema,
  doacaoSchema,
  doadorAtualizarSchema,
  doadorSchema,
  type DoacaoInput,
  type DoacaoItemInput,
  type DoadorAtualizarInput,
  type DoadorInput,
} from './schemas';
import {
  criarDoacao,
  criarDoador,
  criarItemDaDoacao,
  listarDoacoes,
  listarDoadores,
  listarItensDaDoacao,
} from './queries';
import { revalidatePath } from 'next/cache';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';

export async function actionListarDoadores(): Promise<{
  doadores: Awaited<ReturnType<typeof listarDoadores>>;
  erro?: string;
}> {
  try {
    const doadores = await listarDoadores();
    return { doadores };
  } catch (erro) {
    return { doadores: [], erro: 'Erro ao listar doadores.' };
  }
}

export async function actionListarDoacoes(): Promise<{
  doacoes: Awaited<ReturnType<typeof listarDoacoes>>;
  erro?: string;
}> {
  try {
    const doacoes = await listarDoacoes();
    return { doacoes };
  } catch (erro) {
    return { doacoes: [], erro: 'Erro ao listar doações.' };
  }
}

export async function actionListarItensDaDoacao(
  donationId: string,
): Promise<{
  itens: Awaited<ReturnType<typeof listarItensDaDoacao>>;
  erro?: string;
}> {
  try {
    const itens = await listarItensDaDoacao(donationId);
    return { itens };
  } catch (erro) {
    return { itens: [], erro: 'Erro ao listar itens da doação.' };
  }
}

export async function actionCriarDoador(
  input: DoadorInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_OPERADOR]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para criar doadores.' };
  }

  const resultado = doadorSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await criarDoador(resultado.data);
    revalidatePath('/doadores');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível guardar o doador.',
    };
  }
}

export async function actionCriarDoacao(
  input: DoacaoInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_OPERADOR]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para criar doações.' };
  }

  const resultado = doacaoSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await criarDoacao(resultado.data);
    revalidatePath('/doacoes');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível guardar a doação.',
    };
  }
}

export async function actionCriarItemDaDoacao(
  input: DoacaoItemInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_OPERADOR]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para adicionar itens.' };
  }

  const resultado = doacaoItemSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await criarItemDaDoacao(resultado.data);
    revalidatePath('/doacoes');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível guardar o item da doação.',
    };
  }
}

export async function actionAtualizarDoador(
  id: string,
  input: DoadorAtualizarInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para editar doadores.' };
  }

  const resultado = doadorAtualizarSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    const postgres = (await import('@/src/lib/postgres/server'))
      .createServerClient();
    const { error } = await postgres
      .from('donors')
      .update(resultado.data)
      .eq('id', id);

    if (error) {
      return {
        sucesso: false,
        erro: 'Não foi possível atualizar o doador.',
      };
    }

    revalidatePath('/doadores');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível atualizar o doador.',
    };
  }
}

export async function actionDesativarDoador(
  id: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  return actionAtualizarDoador(id, { is_active: false });
}

export async function actionAtualizarEstadoDaDoacao(
  id: string,
  status: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_OPERADOR]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para alterar doações.' };
  }

  try {
    const postgres = (await import('@/src/lib/postgres/server'))
      .createServerClient();
    const { error } = await postgres
      .from('donations')
      .update({ status })
      .eq('id', id);

    if (error) {
      return {
        sucesso: false,
        erro: 'Não foi possível atualizar o estado da doação.',
      };
    }

    revalidatePath('/doacoes');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível atualizar o estado da doação.',
    };
  }
}

export async function actionFecharInspecaoDaDoacao(
  donationId: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_OPERADOR]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para fechar inspeções.' };
  }

  try {
    const postgres = (await import('@/src/lib/postgres/admin'))
      .createAdminClient();
    const { data, error } = await postgres.rpc(
      'close_donation_inspection',
      { p_donation_id: donationId, p_actor_id: undefined },
    );

    if (error) {
      return {
        sucesso: false,
        erro: error.message ?? 'Não foi possível fechar a inspeção.',
      };
    }

    if (data && typeof data === 'object' && !(data as any).success) {
      return {
        sucesso: false,
        erro: (data as any)?.error ?? 'Não foi possível fechar a inspeção.',
      };
    }

    revalidatePath('/doacoes');
    revalidatePath(`/doacoes/${donationId}`);
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível fechar a inspeção.',
    };
  }
}
