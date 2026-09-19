'use server';

import { query, chamarRpc } from '@/lib/db/pool';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';
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
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
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
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
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
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
    const itens = await listarItensDaDoacao(donationId);
    return { itens };
  } catch (erro) {
    return { itens: [], erro: 'Erro ao listar itens da doação.' };
  }
}

export async function actionCriarDoador(
  input: DoadorInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch (erro) {
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
    const doadorExistente = await query(`select id from donors where code = $1`, [resultado.data.code]);
    if (doadorExistente.rows.length > 0) {
      return { sucesso: false, erro: 'Código de doador já existe.' };
    }
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
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch (erro) {
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
    const doacaoExistente = await query(
      `select id from donations where reference = $1`,
      ['DO-' + crypto.randomUUID().slice(0, 8)],
    );

    if (doacaoExistente.rows.length > 0) {
      return { sucesso: false, erro: 'Referência de doação já existe.' };
    }

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
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch (erro) {
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
  try {
    await verificarSessao([ROLE_ADMIN]);
  } catch (erro) {
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
    await query(
      `update donors set name = coalesce($2, name), donor_type = coalesce($3, donor_type), email = coalesce($4, email), phone = coalesce($5, phone), address = coalesce($6, address), notes = coalesce($7, notes), is_active = coalesce($8, is_active), updated_at = now() where id = $1`,
      [
        id,
        resultado.data.name ?? null,
        resultado.data.donor_type ?? null,
        resultado.data.email ?? null,
        resultado.data.phone ?? null,
        resultado.data.address ?? null,
        resultado.data.notes ?? null,
        resultado.data.is_active ?? null,
      ],
    );
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
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch (erro) {
    return { sucesso: false, erro: 'Sem permissão para alterar doações.' };
  }

  try {
    await query(
      `update donations set status = $2, updated_at = now() where id = $1`,
      [id, status],
    );
    revalidatePath('/doacoes');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível atualizar o estado da doação.',
    };
  }
}
export async function actionAdicionarItemDoacao(
  donationId: string,
  input: DoacaoItemInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  return actionCriarItemDaDoacao({ ...input, donation_id: donationId });
}

export async function actionInspecionarItem(
  itemId: string,
  decisao: 'aceitar' | 'rejeitar',
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch {
    return { sucesso: false, erro: 'Sem permissão para inspecionar.' };
  }

  try {
    const r = await query(
      `update donation_items di
       set quantity_accepted = case when $2 = 'aceitar' then di.quantity_received else 0 end,
           quantity_rejected = case when $2 = 'rejeitar' then di.quantity_received else 0 end,
           inspection_status = case when $2 = 'aceitar' then 'accepted' else 'rejected' end
       from donations d
       where di.id = $1 and d.id = di.donation_id
         and d.status in ('pending', 'under_inspection')
       returning di.donation_id`,
      [itemId, decisao],
    );
    if (r.rows.length === 0) {
      return { sucesso: false, erro: 'Esta doação já foi fechada.' };
    }
    await query(
      `update donations set status = 'under_inspection', updated_at = now()
       where id = $1 and status = 'pending'`,
      [r.rows[0].donation_id],
    );
    revalidatePath('/doacoes');
    return { sucesso: true };
  } catch {
    return { sucesso: false, erro: 'Não foi possível guardar a inspeção.' };
  }
}

export async function actionFecharInspecao(
  donationId: string,
): Promise<{ sucesso: boolean; erro?: string; mensagem?: string }> {
  let sessao;
  try {
    sessao = await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch {
    return { sucesso: false, erro: 'Sem permissão para fechar inspeções.' };
  }

  try {
    const r = await chamarRpc(
      `select close_donation_inspection($1::uuid, $2::uuid) as resultado`,
      [donationId, sessao.userId],
    );
    revalidatePath('/doacoes');
    revalidatePath('/inventario');
    return r;
  } catch {
    return { sucesso: false, erro: 'Não foi possível fechar a inspeção.' };
  }
}
