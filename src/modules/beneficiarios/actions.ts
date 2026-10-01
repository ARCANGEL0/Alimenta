'use server';

import { query } from '@/lib/db/pool';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';
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
    await verificarSessao([ROLE_ADMIN]);
    const agregados = await listarAgregados();
    return { agregados };
  } catch (erro) {
    return { agregados: [], erro: 'Erro ao listar agregados.' };
  }
}

export async function actionListarAgregadosAtivos(): Promise<{
  agregados: Awaited<ReturnType<typeof listarAgregados>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
    const agregados = await listarAgregados();
    return { agregados: agregados.filter((a) => a.status !== 'inativo') };
  } catch (erro) {
    return { agregados: [], erro: 'Erro ao listar agregados.' };
  }
}

export async function actionListarBeneficiarios(): Promise<{
  beneficiarios: Awaited<ReturnType<typeof listarBeneficiarios>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR, ROLE_SOCIAL_WORKER]);
    const beneficiarios = await listarBeneficiarios();
    return { beneficiarios };
  } catch (erro) {
    return { beneficiarios: [], erro: 'Erro ao listar beneficiários.' };
  }
}

export async function actionListarBeneficiariosPorCasa(
  householdId: string,
): Promise<{
  beneficiarios: Awaited<ReturnType<typeof listarBeneficiarios>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR, ROLE_SOCIAL_WORKER]);
    const beneficiarios = await listarBeneficiarios();
    return { beneficiarios: beneficiarios.filter((b) => b.household_id === householdId) };
  } catch (erro) {
    return { beneficiarios: [], erro: 'Erro ao listar beneficiários.' };
  }
}

export async function actionCriarAgregado(
  input: AgregadoInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN]);
  } catch (erro) {
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
    const agregadoExistente = await query(`select id from households where code = $1`, [resultado.data.code]);
    if (agregadoExistente.rows.length > 0) {
      return { sucesso: false, erro: 'Código de agregado já existe.' };
    }
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
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_SOCIAL_WORKER]);
  } catch (erro) {
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
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_SOCIAL_WORKER]);
  } catch (erro) {
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
  try {
    await verificarSessao([ROLE_ADMIN]);
  } catch (erro) {
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
    await query(
      `update households set household_size = coalesce($2, household_size), parish = coalesce($3, parish), status = coalesce($4, status), updated_at = now() where id = $1`,
      [
        id,
        resultado.data.household_size ?? null,
        resultado.data.parish ?? null,
        resultado.data.status ?? null,
      ],
    );
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
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_SOCIAL_WORKER]);
  } catch (erro) {
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
    await query(
      `update beneficiaries set full_name = coalesce($2, full_name), phone = coalesce($3, phone), email = coalesce($4, email), is_primary_contact = coalesce($5, is_primary_contact), status = coalesce($6, status), updated_at = now() where id = $1`,
      [
        id,
        resultado.data.full_name ?? null,
        resultado.data.phone ?? null,
        resultado.data.email ?? null,
        resultado.data.is_primary_contact ?? null,
        resultado.data.status ?? null,
      ],
    );
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