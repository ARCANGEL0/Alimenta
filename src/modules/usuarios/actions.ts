'use server';

import { hasRole } from '@/src/lib/permissions';
import type { Role } from '@/src/lib/permissions';
import {
  usuarioParaAtualizarSchema,
  usuarioParaCriarSchema,
  type UsuarioParaAtualizarInput,
  type UsuarioParaCriarInput,
} from './schemas';
import {
  criarUsuario,
  desativarUsuario,
  atualizarUsuario,
  listarUsuarios,
} from './queries';
import { revalidatePath } from 'next/cache';

const ROLE_ADMIN: Role = 'admin';

export async function actionListarUsuarios(): Promise<{
  usuarios: Awaited<ReturnType<typeof listarUsuarios>>;
  erro?: string;
}> {
  const permitido = await hasRole([ROLE_ADMIN]);
  if (!permitido) {
    return { usuarios: [], erro: 'Sem permissão para listar utilizadores.' };
  }

  try {
    const usuarios = await listarUsuarios();
    return { usuarios };
  } catch (erro) {
    return { usuarios: [], erro: 'Erro ao listar utilizadores.' };
  }
}

export async function actionCriarUsuario(
  input: UsuarioParaCriarInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN]);
  if (!permitido) {
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
    await criarUsuario(resultado.data);
    revalidatePath('/usuarios');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível criar o utilizador.',
    };
  }
}

export async function actionAtualizarUsuario(
  id: string,
  input: UsuarioParaAtualizarInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN]);
  if (!permitido) {
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
    return {
      sucesso: false,
      erro: 'Não foi possível atualizar o utilizador.',
    };
  }
}

export async function actionDesativarUsuario(
  id: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para desativar utilizadores.' };
  }

  try {
    await desativarUsuario(id);
    revalidatePath('/usuarios');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível desativar o utilizador.',
    };
  }
}
