'use server';

import { query, transacao } from '@/lib/db/pool';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';
import {
  ajusteStockSchema,
  loteAtualizarSchema,
  loteSchema,
  type AjusteStockInput,
  type LoteAtualizarInput,
  type LoteInput,
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
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
    const lotes = await listarLotes();
    return { lotes };
  } catch (erro) {
    return { lotes: [], erro: 'Erro ao listar lotes.' };
  }
}

export async function actionListarLotesPorStatus(
  status: string,
): Promise<{
  lotes: Awaited<ReturnType<typeof listarLotes>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
    const lotes = await listarLotes();
    return { lotes: lotes.filter((l) => l.status === status) };
  } catch (erro) {
    return { lotes: [], erro: 'Erro ao listar lotes por status.' };
  }
}

export async function actionListarMovimentosDoLote(
  batchId: string,
): Promise<{
  movimentos: Awaited<ReturnType<typeof listarMovimentosDoLote>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
    const movimentos = await listarMovimentosDoLote(batchId);
    return { movimentos };
  } catch (erro) {
    return { movimentos: [], erro: 'Erro ao listar movimentos do lote.' };
  }
}

export async function actionCriarLote(
  input: LoteInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  let sessao;
  try {
    sessao = await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch {
    return { sucesso: false, erro: 'Sem permissão para criar lotes.' };
  }

  const resultado = loteSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }
  const d = resultado.data;

  try {
    return await transacao(async (client) => {
      const existe = await client.query(`select 1 from batches where internal_code = $1`, [d.internal_code]);
      if (existe.rows.length > 0) {
        return { sucesso: false, erro: 'Código interno de lote já existe.' };
      }
      const lote = await client.query(
        `insert into batches (
           internal_code, product_id, warehouse_id, storage_location_id,
           received_at, expiry_date, expiry_type, initial_quantity,
           on_hand_quantity, reserved_quantity, available_quantity, unit_code, status
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $8, 0, $8, $9, 'available')
         returning id`,
        [
          d.internal_code, d.product_id, d.warehouse_id, d.storage_location_id ?? null,
          d.received_at, d.expiry_date ?? null, d.expiry_type ?? null,
          d.initial_quantity, d.unit_code,
        ],
      );
      await client.query(
        `insert into stock_movements (batch_id, movement_type, quantity, unit_code, source_type, reason, created_by)
         values ($1, 'receipt', $2, $3, 'manual', 'Entrada manual de lote', $4)`,
        [lote.rows[0].id, d.initial_quantity, d.unit_code, sessao.userId],
      );
      revalidatePath('/inventario');
      return { sucesso: true };
    });
  } catch {
    return { sucesso: false, erro: 'Não foi possível criar o lote.' };
  }
}

export async function actionAtualizarLote(
  id: string,
  input: LoteAtualizarInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN]);
  } catch (erro) {
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
    await query(
      `update batches set status = coalesce($2, status), warehouse_id = coalesce($3, warehouse_id),
       storage_location_id = coalesce($4, storage_location_id), updated_at = now() where id = $1`,
      [
        id,
        resultado.data.status ?? null,
        resultado.data.warehouse_id ?? null,
        resultado.data.storage_location_id ?? null,
      ],
    );
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
  input: AjusteStockInput & { created_by: string },
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch {
    return { sucesso: false, erro: 'Sem permissão para ajustar stock.' };
  }

  const resultado = ajusteStockSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }
  const d = resultado.data;
  const quantidade = Math.abs(d.quantity);
  const delta = d.movement_type === 'adjustment_in' ? quantidade : -quantidade;

  try {
    return await transacao(async (client) => {
      const r = await client.query(
        `select unit_code, on_hand_quantity, reserved_quantity from batches where id = $1 for update`,
        [d.batch_id],
      );
      const lote = r.rows[0];
      if (!lote) return { sucesso: false, erro: 'Lote não encontrado.' };

      const novoOnHand = Number(lote.on_hand_quantity) + delta;
      if (novoOnHand < Number(lote.reserved_quantity)) {
        return { sucesso: false, erro: 'Stock insuficiente: o ajuste deixaria o lote negativo ou abaixo do reservado.' };
      }

      await client.query(
        `insert into stock_movements (batch_id, movement_type, quantity, unit_code, source_type, reason, created_by)
         values ($1, $2, $3, $4, 'manual', $5, $6)`,
        [d.batch_id, d.movement_type, quantidade, lote.unit_code, d.reason, input.created_by],
      );
      await client.query(
        `update batches
         set on_hand_quantity = on_hand_quantity + $1,
             available_quantity = available_quantity + $1,
             status = case when on_hand_quantity + $1 = 0 then 'depleted' else status end,
             updated_at = now()
         where id = $2`,
        [delta, d.batch_id],
      );
      revalidatePath('/inventario');
      return { sucesso: true };
    });
  } catch {
    return { sucesso: false, erro: 'Não foi possível registar o ajuste de stock.' };
  }
}

export async function actionDesativarLote(
  id: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  return actionAtualizarLote(id, { status: 'depleted' });
}

export async function actionBloquearLote(
  id: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch (erro) {
    return { sucesso: false, erro: 'Sem permissão para bloquear lotes.' };
  }

  try {
    await query(
      `update batches set status = 'blocked', updated_at = now() where id = $1`,
      [id],
    );
    revalidatePath('/inventario');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível bloquear o lote.',
    };
  }
}
export async function actionAjusteStockUtilizador(
  userId: string,
  batchId: string,
  input: Omit<AjusteStockInput, 'batch_id'>,
): Promise<{ sucesso: boolean; erro?: string }> {
  return actionRegistarAjusteStock({ ...input, batch_id: batchId, created_by: userId });
}

