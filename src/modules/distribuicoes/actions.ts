'use server';

import { hasRole } from '@/src/lib/permissions';
import type { Role } from '@/src/lib/permissions';
import {
  distribuicaoAtualizarSchema,
  distribuicaoSchema,
  itemDistribuicaoSchema,
  reservarStockSchema,
  type DistribuicaoAtualizarInput,
  type DistribuicaoInput,
  type ItemDistribuicaoInput,
  type ReservarStockInput,
} from './schemas';
import {
  criarDistribuicao,
  criarItemDistribuicao,
  listarDistribuicoes,
  listarItensDaDistribuicao,
  listarReservasDoItem,
} from './queries';
import { revalidatePath } from 'next/cache';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';

export async function actionListarDistribuicoes(): Promise<{
  distribuicoes: Awaited<ReturnType<typeof listarDistribuicoes>>;
  erro?: string;
}> {
  try {
    const distribuicoes = await listarDistribuicoes();
    return { distribuicoes };
  } catch (erro) {
    return { distribuicoes: [], erro: 'Erro ao listar distribuições.' };
  }
}

export async function actionListarItensDaDistribuicao(
  distributionId: string,
): Promise<{
  itens: Awaited<ReturnType<typeof listarItensDaDistribuicao>>;
  erro?: string;
}> {
  try {
    const itens = await listarItensDaDistribuicao(distributionId);
    return { itens };
  } catch (erro) {
    return { itens: [], erro: 'Erro ao listar itens da distribuição.' };
  }
}

export async function actionListarReservasDoItem(
  distributionItemId: string,
): Promise<{
  reservas: Awaited<ReturnType<typeof listarReservasDoItem>>;
  erro?: string;
}> {
  try {
    const reservas = await listarReservasDoItem(distributionItemId);
    return { reservas };
  } catch (erro) {
    return { reservas: [], erro: 'Erro ao listar reservas.' };
  }
}

export async function actionCriarDistribuicao(
  input: DistribuicaoInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_OPERADOR]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para criar distribuições.' };
  }

  const resultado = distribuicaoSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await criarDistribuicao(resultado.data);
    revalidatePath('/distribuicoes');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível criar a distribuição.',
    };
  }
}

export async function actionCriarItemDistribuicao(
  input: ItemDistribuicaoInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_OPERADOR]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para adicionar itens.' };
  }

  const resultado = itemDistribuicaoSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await criarItemDistribuicao(resultado.data);
    revalidatePath('/distribuicoes');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível criar o item.',
    };
  }
}

export async function actionReservarStock(
  input: ReservarStockInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_OPERADOR]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para reservar stock.' };
  }

  const resultado = reservarStockSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    const postgres = (await import('@/src/lib/postgres/server'))
      .createServerClient();

    // Bloqueia o lote para evitar concorrência.
    const { data: lote, error: erroLote } = await postgres
      .from('batches')
      .select('available_quantity, reserved_quantity, on_hand_quantity')
      .eq('id', input.batch_id)
      .single();

    if (erroLote || !lote) {
      return { sucesso: false, erro: 'Lote não encontrado.' };
    }

    if (lote.available_quantity < input.quantity) {
      return {
        sucesso: false,
        erro: 'Quantidade disponível insuficiente no lote.',
      };
    }

    // Cria a reserva.
    const { error: erroReserva } = await postgres
      .from('stock_reservations')
      .insert({
        distribution_item_id: input.distribution_item_id,
        batch_id: input.batch_id,
        quantity: input.quantity,
        status: 'active',
      });

    if (erroReserva) {
      return {
        sucesso: false,
        erro: 'Não foi possível criar a reserva.',
      };
    }

    // Atualiza o saldo reservado e disponível do lote.
    const { error: erroUpdate } = await postgres
      .from('batches')
      .update({
        reserved_quantity: lote.reserved_quantity + input.quantity,
        available_quantity: lote.available_quantity - input.quantity,
        status: 'reserved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.batch_id);

    if (erroUpdate) {
      return {
        sucesso: false,
        erro: 'Não foi possível atualizar o saldo do lote.',
      };
    }

    revalidatePath('/distribuicoes');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível reservar stock.',
    };
  }
}

export async function actionAtualizarDistribuicao(
  id: string,
  input: DistribuicaoAtualizarInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para editar distribuições.' };
  }

  const resultado = distribuicaoAtualizarSchema.safeParse(input);
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
      .from('distributions')
      .update(resultado.data)
      .eq('id', id);

    if (error) {
      return {
        sucesso: false,
        erro: 'Não foi possível atualizar a distribuição.',
      };
    }

    revalidatePath('/distribuicoes');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível atualizar a distribuição.',
    };
  }
}
