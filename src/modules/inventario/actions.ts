'use server';

import { z } from 'zod';

import { hasRole } from '@/src/lib/permissions';
import type { Role } from '@/src/lib/permissions';
import {
  ajusteStockSchema,
  loteAtualizarSchema,
  loteSchema,
} from './schemas';
import {
  criarLote,
  listarLotes,
  listarMovimentosDoLote,
} from './queries';
import { revalidatePath } from 'next/cache';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';

export async function actionListarLotes(): Promise<{
  lotes: Awaited<ReturnType<typeof listarLotes>>;
  erro?: string;
}> {
  try {
    const lotes = await listarLotes();
    return { lotes };
  } catch (erro) {
    return { lotes: [], erro: 'Erro ao listar lotes.' };
  }
}

export async function actionListarMovimentosDoLote(
  batchId: string,
): Promise<{
  movimentos: Awaited<ReturnType<typeof listarMovimentosDoLote>>;
  erro?: string;
}> {
  try {
    const movimentos = await listarMovimentosDoLote(batchId);
    return { movimentos };
  } catch (erro) {
    return { movimentos: [], erro: 'Erro ao listar movimentos do lote.' };
  }
}

export async function actionCriarLote(
  input: z.infer<typeof loteSchema>,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_OPERADOR]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para criar lotes.' };
  }

  const resultado = loteSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await criarLote(resultado.data);
    revalidatePath('/inventario');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível criar o lote.',
    };
  }
}

export async function actionAtualizarLote(
  id: string,
  input: z.infer<typeof loteAtualizarSchema>,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para editar lotes.' };
  }

  const resultado = loteAtualizarSchema.safeParse(input);
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
      .from('batches')
      .update(resultado.data)
      .eq('id', id);

    if (error) {
      return {
        sucesso: false,
        erro: 'Não foi possível atualizar o lote.',
      };
    }

    revalidatePath('/inventario');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível atualizar o lote.',
    };
  }
}

export async function actionRegistarAjusteStock(
  input: z.infer<typeof ajusteStockSchema> & { created_by: string },
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_OPERADOR]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para ajustar stock.' };
  }

  const resultado = ajusteStockSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    const postgres = (await import('@/src/lib/postgres/server'))
      .createServerClient();

    // Busca o lote para saber a unidade e o saldo atual.
    const { data: lote, error: erroLote } = await postgres
      .from('batches')
      .select('unit_code, on_hand_quantity, reserved_quantity')
      .eq('id', input.batch_id)
      .single();

    if (erroLote || !lote) {
      return {
        sucesso: false,
        erro: 'Lote não encontrado.',
      };
    }

    const quantidade = Math.abs(input.quantity);
    const entrada =
      input.movement_type === 'adjustment_in';

    const novoOnHand =
      lote.on_hand_quantity + (entrada ? quantidade : -quantidade);

    if (novoOnHand < 0) {
      return {
        sucesso: false,
        erro: 'Ajuste resultaria em saldo físico negativo.',
      };
    }

    const novoAvailable = novoOnHand - lote.reserved_quantity;

    // Registra o movimento de stock.
    const { error: erroMovimento } = await postgres
      .from('stock_movements')
      .insert({
        batch_id: input.batch_id,
        movement_type: input.movement_type,
        quantity: quantidade,
        unit_code: lote.unit_code,
        source_type: 'manual',
        source_id: null,
        reason: input.reason,
        created_by: input.created_by,
      });

    if (erroMovimento) {
      return {
        sucesso: false,
        erro: 'Não foi possível registar o movimento de ajuste.',
      };
    }

    // Atualiza o saldo do lote.
    const { error: erroUpdate } = await postgres
      .from('batches')
      .update({
        on_hand_quantity: novoOnHand,
        available_quantity: novoAvailable,
        status:
          novoOnHand === 0 ? 'depleted' : lote.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.batch_id);

    if (erroUpdate) {
      return {
        sucesso: false,
        erro: 'Não foi possível atualizar o saldo do lote.',
      };
    }

    revalidatePath('/inventario');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível registar o ajuste de stock.',
    };
  }
}
