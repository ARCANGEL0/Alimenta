'use server';

import { query, transacao, chamarRpc } from '@/lib/db/pool';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';
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
} from './queries';
import { revalidatePath } from 'next/cache';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';

export async function actionListarDistribuicoes(): Promise<{
  distribuicoes: Awaited<ReturnType<typeof listarDistribuicoes>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
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
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
    const itens = await listarItensDaDistribuicao(distributionId);
    return { itens };
  } catch (erro) {
    return { itens: [], erro: 'Erro ao listar itens da distribuição.' };
  }
}

export async function actionCriarDistribuicao(
  input: DistribuicaoInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch (erro) {
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
    const agregadoExistente = await query(`select id from households where id = $1`, [resultado.data.household_id]);
    if (agregadoExistente.rows.length === 0) {
      return { sucesso: false, erro: 'Agregado não encontrado.' };
    }
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
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch (erro) {
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

export async function actionAtualizarDistribuicao(
  id: string,
  input: DistribuicaoAtualizarInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN]);
  } catch (erro) {
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
    await query(
      `update distributions set status = coalesce($2, status), notes = coalesce($3, notes), updated_at = now() where id = $1`,
      [id, resultado.data.status ?? null, resultado.data.notes ?? null],
    );
    revalidatePath('/distribuicoes');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível atualizar a distribuição.',
    };
  }
}

export async function actionConfirmarDistribuicao(
  distributionId: string,
): Promise<{ sucesso: boolean; mensagem?: string; erro?: string }> {
  let sessao;
  try {
    sessao = await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch {
    return { sucesso: false, erro: 'Sem permissão para confirmar distribuições.' };
  }

  try {
    const r = await chamarRpc(
      `select confirm_distribution($1::uuid, $2::uuid) as resultado`,
      [distributionId, sessao.userId],
    );
    revalidatePath('/distribuicoes');
    return r;
  } catch {
    return { sucesso: false, erro: 'Não foi possível confirmar a distribuição.' };
  }
}

export async function actionCancelarDistribuicao(
  id: string,
): Promise<{ sucesso: boolean; mensagem?: string; erro?: string }> {
  let sessao;
  try {
    sessao = await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch {
    return { sucesso: false, erro: 'Sem permissão para cancelar distribuições.' };
  }

  try {
    const r = await chamarRpc(
      `select cancel_distribution($1::uuid, $2::uuid) as resultado`,
      [id, sessao.userId],
    );
    revalidatePath('/distribuicoes');
    return r;
  } catch {
    return { sucesso: false, erro: 'Não foi possível cancelar a distribuição.' };
  }
}

export async function actionReservarStock(
  input: ReservarStockInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch {
    return { sucesso: false, erro: 'Sem permissão para reservar stock.' };
  }

  const resultado = reservarStockSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }
  const { batch_id, distribution_item_id, quantity } = resultado.data;

  try {
    return await transacao(async (client) => {
      const item = await client.query(
        `select di.distribution_id, d.status
         from distribution_items di join distributions d on d.id = di.distribution_id
         where di.id = $1 for update of d`,
        [distribution_item_id],
      );
      if (item.rows.length === 0) return { sucesso: false, erro: 'Item não encontrado.' };
      if (['delivered', 'cancelled'].includes(item.rows[0].status)) {
        return { sucesso: false, erro: 'Esta distribuição já está fechada.' };
      }

      const lote = await client.query(
        `select available_quantity, status from batches where id = $1 for update`,
        [batch_id],
      );
      if (lote.rows.length === 0) return { sucesso: false, erro: 'Lote não encontrado.' };
      if (lote.rows[0].status !== 'available') return { sucesso: false, erro: 'O lote não está disponível.' };
      if (Number(lote.rows[0].available_quantity) < quantity) {
        return { sucesso: false, erro: 'Stock insuficiente neste lote.' };
      }

      await client.query(
        `insert into stock_reservations (distribution_item_id, batch_id, quantity, status)
         values ($1, $2, $3, 'active')`,
        [distribution_item_id, batch_id, quantity],
      );
      await client.query(
        `update batches set reserved_quantity = reserved_quantity + $1,
         available_quantity = available_quantity - $1, updated_at = now()
         where id = $2`,
        [quantity, batch_id],
      );
      await client.query(
        `update distribution_items set quantity_reserved = quantity_reserved + $1 where id = $2`,
        [quantity, distribution_item_id],
      );
      await client.query(
        `update distributions set status = 'reserved', updated_at = now() where id = $1`,
        [item.rows[0].distribution_id],
      );
      revalidatePath('/distribuicoes');
      return { sucesso: true };
    });
  } catch {
    return { sucesso: false, erro: 'Não foi possível reservar stock.' };
  }
}

export async function actionAdicionarItemDistribuicao(
  distributionId: string,
  input: ItemDistribuicaoInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  return actionCriarItemDistribuicao({ ...input, distribution_id: distributionId });
}
