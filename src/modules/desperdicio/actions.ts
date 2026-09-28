'use server';

import { chamarRpc } from '@/lib/db/pool';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';
import { descarteSchema, type DescarteInput } from './schemas';
import { criarDescarte, listarDescartes } from './queries';
import { revalidatePath } from 'next/cache';
import { gerarNotificacoesValidade } from '@/modules/notificacoes/queries';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';

export async function actionListarDescartes(): Promise<{
  descartes: Awaited<ReturnType<typeof listarDescartes>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
    const descartes = await listarDescartes();
    return { descartes };
  } catch (erro) {
    return { descartes: [], erro: 'Erro ao listar descartes.' };
  }
}

export async function actionCriarDescarte(
  input: DescarteInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  let sessao;
  try {
    sessao = await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);
  } catch {
    return { sucesso: false, erro: 'Sem permissão para registar descartes.' };
  }

  const resultado = descarteSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }
  const d = resultado.data;

  try {
    const r = await chamarRpc(
      `select register_disposal($1::uuid, $2, $3, $4, $5, $6::uuid) as resultado`,
      [d.batch_id, d.quantity, d.reason_code, d.reason_notes ?? null, d.destination ?? null, sessao.userId],
    );

    await gerarNotificacoesValidade();

    revalidatePath('/descartes');
    return r;
  } catch {
    return { sucesso: false, erro: 'Não foi possível registar o descarte.' };
  }
}
