'use server';

import { z } from 'zod';

import { hasRole } from '@/src/lib/permissions';
import type { Role } from '@/src/lib/permissions';
import { descarteSchema } from './schemas';
import { criarDescarte, listarDescartes } from './queries';
import { revalidatePath } from 'next/cache';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';

export async function actionListarDescartes(): Promise<{
  descartes: Awaited<ReturnType<typeof listarDescartes>>;
  erro?: string;
}> {
  try {
    const descartes = await listarDescartes();
    return { descartes };
  } catch (erro) {
    return { descartes: [], erro: 'Erro ao listar descartes.' };
  }
}

export async function actionCriarDescarte(
  input: z.infer<typeof descarteSchema>,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN, ROLE_OPERADOR]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para registar descartes.' };
  }

  const resultado = descarteSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  // Se o motivo for "outro", a descricao e obrigatoria.
  if (
    resultado.data.reason_code === 'other' &&
    (!resultado.data.reason_notes ||
      resultado.data.reason_notes.trim() === '')
  ) {
    return {
      sucesso: false,
      erro: 'Para o motivo "outro" e obrigatorio preencher a descricao.',
    };
  }

  try {
    const postgres = (await import('@/src/lib/postgres/server'))
      .createServerClient();

    // Bloqueia o lote para evitar concorrencia.
    const { data: lote, error: erroLote } = await postgres
      .from('batches')
      .select('available_quantity, reserved_quantity, on_hand_quantity')
      .eq('id', resultado.data.batch_id)
      .single();

    if (erroLote || !lote) {
      return { sucesso: false, erro: 'Lote nao encontrado.' };
    }

    if (lote.available_quantity < resultado.data.quantity) {
      return {
        sucesso: false,
        erro: 'Quantidade disponivel insuficiente para o descarte.',
      };
    }

    // Cria o descarte.
    const { data: descarte, error: erroDescarte } = await postgres
      .from('disposals')
      .insert({
        batch_id: resultado.data.batch_id,
        quantity: resultado.data.quantity,
        reason_code: resultado.data.reason_code,
        reason_notes: resultado.data.reason_notes,
        destination: resultado.data.destination,
        created_by: resultado.data.created_by,
      })
      .select()
      .single();

    if (erroDescarte || !descarte) {
      return { sucesso: false, erro: 'Nao foi possível registar o descarte.' };
    }

    // Cria o movimento de stock.
    const { error: erroMovimento } = await postgres
      .from('stock_movements')
      .insert({
        batch_id: resultado.data.batch_id,
        movement_type: 'disposal',
        quantity: resultado.data.quantity,
        unit_code: lote.unit_code,
        source_type: 'disposal',
        source_id: descarte.id,
        reason: `Descarte: ${resultado.data.reason_code}`,
        created_by: resultado.data.created_by,
      });

    if (erroMovimento) {
      return { sucesso: false, erro: 'Nao foi possível registar o movimento.' };
    }

    // Atualiza o saldo do lote.
    const novoOnHand = lote.on_hand_quantity - resultado.data.quantity;
    const novoAvailable = novoOnHand - lote.reserved_quantity;

    const { error: erroUpdate } = await postgres
      .from('batches')
      .update({
        on_hand_quantity: novoOnHand,
        available_quantity: novoAvailable,
        status:
          novoOnHand === 0 ? 'disposed' : lote.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resultado.data.batch_id);

    if (erroUpdate) {
      return { sucesso: false, erro: 'Nao foi possível atualizar o saldo do lote.' };
    }

    revalidatePath('/descartes');
    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false, erro: 'Nao foi possível registar o descarte.' };
  }
}
