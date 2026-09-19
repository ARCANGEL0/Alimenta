'use server';

import { query } from '@/lib/db/pool';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';
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
  listarCategoriasAtivas,
  listarProdutos,
  listarProdutosAtivos,
} from './queries';
import { revalidatePath } from 'next/cache';

const ROLE_ADMIN = 'admin';

export async function actionListarCategorias(): Promise<{
  categorias: Awaited<ReturnType<typeof listarCategorias>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN]);
    const categorias = await listarCategorias();
    return { categorias };
  } catch (erro) {
    return { categorias: [], erro: 'Erro ao listar categorias.' };
  }
}

export async function actionListarCategoriasAtivas(): Promise<{
  categorias: Awaited<ReturnType<typeof listarCategoriasAtivas>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN]);
    const categorias = await listarCategoriasAtivas();
    return { categorias };
  } catch (erro) {
    return { categorias: [], erro: 'Erro ao listar categorias ativas.' };
  }
}

export async function actionListarProdutos(): Promise<{
  produtos: Awaited<ReturnType<typeof listarProdutos>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN]);
    const produtos = await listarProdutos();
    return { produtos };
  } catch (erro) {
    return { produtos: [], erro: 'Erro ao listar produtos.' };
  }
}

export async function actionListarProdutosAtivos(): Promise<{
  produtos: Awaited<ReturnType<typeof listarProdutosAtivos>>;
  erro?: string;
}> {
  try {
    await verificarSessao([ROLE_ADMIN]);
    const produtos = await listarProdutosAtivos();
    return { produtos };
  } catch (erro) {
    return { produtos: [], erro: 'Erro ao listar produtos ativos.' };
  }
}

export async function actionCriarCategoria(
  input: CategoriaInput,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await verificarSessao([ROLE_ADMIN]);
  } catch (erro) {
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
    const categoriaExistente = await query(`select id from categories where name = $1`, [resultado.data.name]);
    if (categoriaExistente.rows.length > 0) {
      return { sucesso: false, erro: 'Nome de categoria já existe.' };
    }
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
  try {
    await verificarSessao([ROLE_ADMIN]);
  } catch (erro) {
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
    const produtoExistente = await query(`select id from products where sku = $1`, [resultado.data.sku]);
    if (produtoExistente.rows.length > 0) {
      return { sucesso: false, erro: 'SKU já existe.' };
    }
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
  try {
    await verificarSessao([ROLE_ADMIN]);
  } catch (erro) {
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
    await query(
      `update categories set name = coalesce($2, name), description = coalesce($3, description), is_active = coalesce($4, is_active), updated_at = now() where id = $1`,
      [
        id,
        resultado.data.name ?? null,
        resultado.data.description ?? null,
        resultado.data.is_active ?? null,
      ],
    );
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
  try {
    await verificarSessao([ROLE_ADMIN]);
  } catch (erro) {
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
    await query(
      `update products set name = coalesce($2, name), category_id = coalesce($3, category_id), default_unit = coalesce($4, default_unit), description = coalesce($5, description), is_active = coalesce($6, is_active), updated_at = now() where id = $1`,
      [
        id,
        resultado.data.name ?? null,
        resultado.data.category_id ?? null,
        resultado.data.default_unit ?? null,
        resultado.data.description ?? null,
        resultado.data.is_active ?? null,
      ],
    );
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
