'use server';

import { hasRole } from '@/src/lib/permissions';
import type { Role } from '@/src/lib/permissions';
import {
  categoriaAtualizarSchema,
  categoriaSchema,
  produtoAtualizarSchema,
  produtoSchema,
  type CategoriaAtualizarInput,
  type CategoriaInput,
  type ProdutoAtualizarInput,
  type ProdutoInput,
} from './schemas';
import {
  criarCategoria,
  criarProduto,
  listarCategorias,
  listarProdutos,
} from './queries';
import { revalidatePath } from 'next/cache';

const ROLE_ADMIN: Role = 'admin';

export async function actionListarCategorias(): Promise<{
  categorias: Awaited<ReturnType<typeof listarCategorias>>;
  erro?: string;
}> {
  try {
    const categorias = await listarCategorias();
    return { categorias };
  } catch (erro) {
    return { categorias: [], erro: 'Erro ao listar categorias.' };
  }
}

export async function actionListarProdutos(): Promise<{
  produtos: Awaited<ReturnType<typeof listarProdutos>>;
  erro?: string;
}> {
  try {
    const produtos = await listarProdutos();
    return { produtos };
  } catch (erro) {
    return { produtos: [], erro: 'Erro ao listar produtos.' };
  }
}

export async function actionCriarCategoria(
  input: CategoriaInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para criar categorias.' };
  }

  const resultado = categoriaSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await criarCategoria(resultado.data);
    revalidatePath('/categorias');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível guardar a categoria.',
    };
  }
}

export async function actionCriarProduto(
  input: ProdutoInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para criar produtos.' };
  }

  const resultado = produtoSchema.safeParse(input);
  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    await criarProduto(resultado.data);
    revalidatePath('/produtos');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível guardar o produto.',
    };
  }
}

export async function actionAtualizarCategoria(
  id: string,
  input: CategoriaAtualizarInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para editar categorias.' };
  }

  const resultado = categoriaAtualizarSchema.safeParse(input);
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
      .from('categories')
      .update(resultado.data)
      .eq('id', id);

    if (error) {
      return {
        sucesso: false,
        erro: 'Não foi possível atualizar a categoria.',
      };
    }

    revalidatePath('/categorias');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível atualizar a categoria.',
    };
  }
}

export async function actionAtualizarProduto(
  id: string,
  input: ProdutoAtualizarInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  const permitido = await hasRole([ROLE_ADMIN]);
  if (!permitido) {
    return { sucesso: false, erro: 'Sem permissão para editar produtos.' };
  }

  const resultado = produtoAtualizarSchema.safeParse(input);
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
      .from('products')
      .update(resultado.data)
      .eq('id', id);

    if (error) {
      return {
        sucesso: false,
        erro: 'Não foi possível atualizar o produto.',
      };
    }

    revalidatePath('/produtos');
    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: 'Não foi possível atualizar o produto.',
    };
  }
}

export async function actionDesativarCategoria(
  id: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  return actionAtualizarCategoria(id, { is_active: false });
}

export async function actionDesativarProduto(
  id: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  return actionAtualizarProduto(id, { is_active: false });
}
