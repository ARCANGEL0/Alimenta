import { createServerClient } from '@/src/lib/postgres/server';
import type {
  Categoria,
  CategoriaParaCriar,
  Produto,
  ProdutoParaCriar,
} from './types';

export async function listarCategorias(): Promise<Categoria[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error('Não foi possível listar as categorias.');
  }

  return (data ?? []) as Categoria[];
}

export async function listarProdutos(): Promise<Produto[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('products')
    .select(`
      *,
      categories (name)
    `)
    .order('name', { ascending: true });

  if (error) {
    throw new Error('Não foi possível listar os produtos.');
  }

  return (
    data?.map((item) => ({
      ...item,
      category_name: item.categories?.name ?? null,
      categories: undefined,
    })) ?? []
  ) as Produto[];
}

export async function criarCategoria(
  payload: CategoriaParaCriar,
): Promise<Categoria> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('categories')
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Não foi possível criar a categoria.');
  }

  return data as Categoria;
}

export async function criarProduto(
  payload: ProdutoParaCriar,
): Promise<Produto> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('products')
    .insert(payload)
    .select(`
      *,
      categories (name)
    `)
    .single();

  if (error || !data) {
    throw new Error('Não foi possível criar o produto.');
  }

  return {
    ...data,
    category_name: data.categories?.name ?? null,
    categories: undefined,
  } as Produto;
}
