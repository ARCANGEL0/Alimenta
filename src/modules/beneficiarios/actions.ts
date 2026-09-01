'use server';

import { hasRole } from '@/src/lib/permissions';
import type { Role } from '@/src/lib/permissions';
import {
  agregadoAtualizarSchema,
  agregadoSchema,
  beneficiarioAtualizarSchema,
  beneficiarioSchema,
  necessidadeSchema,
  type AgregadoAtualizarInput,
  type AgregadoInput,
  type BeneficiarioAtualizarInput,
  type BeneficiarioInput,
  type NecessidadeInput,
} from './schemas';
import {
  criarAgregado,
  criarBeneficiario,
  criarNecessidade,
  listarAgregados,
  listarBeneficiarios,
  listarNecessidades,
} from './queries';
import { revalidatePath } from 'next/cache';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';
const ROLE_SOCIAL_WORKER: Role = 'social_worker';

export async function actionListarAgregados(): Promise<{
  agregados: Awaited<ReturnType<typeof listarAgregados>>;
  erro?: string;
}> {
  try {
    const agregados = await listarAgregados();
    return { agregados };
  } catch (erro) {
    return { agregados: [], erro: 'Erro ao listar agregados.' };
  }
}

export async function actionListarBeneficiarios(): Promise<{
  beneficiarios: Awaited<ReturnType<typeof listarBeneficiarios>>;
  erro?: string;
}> {
  try {
    const beneficiarios = await listarBeneficiarios();
    return { beneficiarios };
  } catch (erro) {
    return { beneficiarios: [], erro: 'Erro ao listar beneficiários.' };
  }
}

export async function actionListarNecessidades(
  beneficiaryId: string,
): Promise<{
  necessidades: Awaited<ReturnType<typeof listarNecessidades>>;
  erro?: string;
}> {
  try {
    const necessidades = await listarNecessidades(beneficiaryId);
    return { necessidades };
  } catch (erro) {
    return { necessidades: [], erro: 'Erro ao listar necessidades.' };
  }
}

export async function actionCriarAgregado(
  input: AgregadoInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para criar agregados.' };
  }

  const resultado = agregadoSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await criarAgregado(resultado.data);
    revalidatePath('/beneficiarios');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível criar o agregado.',
    };
  }
}

export async function actionCriarBeneficiario(
  input: BeneficiarioInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_SOCIAL_WORKER]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para criar beneficiários.' };
  }

  const resultado = beneficiarioSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await criarBeneficiario(resultado.data);
    revalidatePath('/beneficiarios');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível criar o beneficiário.',
    };
  }
}

export async function actionCriarNecessidade(
  input: NecessidadeInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_SOCIAL_WORKER]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para criar necessidades.' };
  }

  const resultado = necessidadeSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await criarNecessidade(resultado.data);
    revalidatePath('/beneficiarios');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível criar a necessidade.',
    };
  }
}

export async function actionAtualizarAgregado(
  id: string,
  input: AgregadoAtualizarInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para editar agregados.' };
  }

  const resultado = agregadoAtualizarSchema.safeParse(input);
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
      .from('households')
      .update(resultado.data)
      .eq('id', id);

    if (error) {
      return {
        sucesso: false,
        erro: 'Não foi possível atualizar o agregado.',
      };
    }

    revalidatePath('/beneficiarios');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível atualizar o agregado.',
    };
  }
}

export async function actionAtualizarBeneficiario(
  id: string,
  input: BeneficiarioAtualizarInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_SOCIAL_WORKER]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para editar beneficiários.' };
  }

  const resultado = beneficiarioAtualizarSchema.safeParse(input);
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
      .from('beneficiaries')
      .update(resultado.data)
      .eq('id', id);

    if (error) {
      return {
        sucesso: false,
        erro: 'Não foi possível atualizar o beneficiário.',
      };
    }

    revalidatePath('/beneficiarios');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível atualizar o beneficiário.',
    };
  }
}

export async function actionDesativarAgregado(
  id: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  return actionAtualizarAgregado(id, { status: 'inativo' });
}
