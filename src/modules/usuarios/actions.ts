'use server';

import { query } from '@/lib/db/pool';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';
import {
  usuarioParaAtualizarSchema,
  usuarioParaCriarSchema,
  type UsuarioParaAtualizarInput,
  type UsuarioParaCriarInput,
} from './schemas';
import {
  atualizarUsuario,
  criarUsuario,
  desativarUsuario,
  listarUsuarios,
} from './queries';
import { revalidatePath } from 'next/cache';

const ROLE_ADMIN: Role = 'admin';

export async function actionListarUsuarios(): Promise<{
  usuarios: Awaited<ReturnType<typeof listarUsuarios>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN]);
    const usuarios = await listarUsuarios();
    return { usuarios };
  } catch (erro) {
    return { usuarios: [], erro: 'Erro ao listar utilizadores.' };
  }
}

export async function actionCriarUsuario(
  input: UsuarioParaCriarInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN]);
  } catch (erro) {
    return { sucesso: false, erro: 'Sem permissão para criar utilizadores.' };
  }

  const resultado = usuarioParaCriarSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    const usuarioExistente = await query(`select id from profiles where email = $1`, [resultado.data.email]);
    if (usuarioExistente.rows.length > 0) {
      return { sucesso: false, erro: 'E-mail já registado.' };
    }
    await criarUsuario(resultado.data);
    revalidatePath('/usuarios');
    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false, erro: 'Não foi possível criar o utilizador.' };
  }
}

export async function actionAtualizarUsuario(
  id: string,
  input: UsuarioParaAtualizarInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN]);
  } catch (erro) {
    return { sucesso: false, erro: 'Sem permissão para atualizar utilizadores.' };
  }

  const resultado = usuarioParaAtualizarSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await atualizarUsuario(id, resultado.data);
    revalidatePath('/usuarios');
    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false, erro: 'Não foi possível atualizar o utilizador.' };
  }
}

export async function actionDesativarUsuario(
  id: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN]);
  } catch (erro) {
    return { sucesso: false, erro: 'Sem permissão para desativar utilizadores.' };
  }

  try {
    await desativarUsuario(id);
    revalidatePath('/usuarios');
    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false, erro: 'Não foi possível desativar o utilizador.' };
  }
}

export async function actionCriarUsuarioSimples(input: {
  email: string;
  password: string;
  full_name: string;
  role: string;
}): Promise<{ sucesso: boolean; erro?: string }> {
  return actionCriarUsuario({
    email: input.email,
    password: input.password,
    full_name: input.full_name,
    roles: [input.role],
  });
}
