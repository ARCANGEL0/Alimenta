import { createServerClient } from '@/src/lib/postgres/server';
import type {
  Distribuicao,
  DistribuicaoParaCriar,
  ItemDistribuicao,
  ItemDistribuicaoParaCriar,
  ReservarStockInput,
} from './types';

export async function listarDistribuicoes(): Promise<Distribuicao[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('distributions')
    .select(`
      *,
      households (code)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Não foi possível listar as distribuições.');
  }

  return (
    data?.map((item) => ({
      ...item,
      household_code: item.households?.code ?? null,
      households: undefined,
    })) ?? []
  ) as Distribuicao[];
}

export async function criarDistribuicao(
  payload: DistribuicaoParaCriar,
): Promise<Distribuicao> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('distributions')
    .insert(payload)
    .select(`
      *,
      households (code)
    `)
    .single();

  if (error || !data) {
    throw new Error('Não foi possível criar a distribuição.');
  }

  return {
    ...data,
    household_code: data.households?.code ?? null,
    households: undefined,
  } as Distribuicao;
}

export async function criarItemDistribuicao(
  payload: ItemDistribuicaoParaCriar,
): Promise<ItemDistribuicao> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('distribution_items')
    .insert(payload)
    .select(`
      *,
      products (name)
    `)
    .single();

  if (error || !data) {
    throw new Error('Não foi possível criar o item da distribuição.');
  }

  return {
    ...data,
    product_name: data.products?.name ?? null,
    products: undefined,
  } as ItemDistribuicao;
}

export async function listarItensDaDistribuicao(
  distributionId: string,
): Promise<ItemDistribuicao[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('distribution_items')
    .select(`
      *,
      products (name)
    `)
    .eq('distribution_id', distributionId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('Não foi possível listar os itens da distribuição.');
  }

  return (
    data?.map((item) => ({
      ...item,
      product_name: item.products?.name ?? null,
      products: undefined,
    })) ?? []
  ) as ItemDistribuicao[];
}

export async function listarReservasDoItem(
  distributionItemId: string,
): Promise<ReservaStock[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('stock_reservations')
    .select(`
      *,
      batches (internal_code)
    `)
    .eq('distribution_item_id', distributionItemId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('Não foi possível listar as reservas do item.');
  }

  return (
    data?.map((item) => ({
      ...item,
      batch_internal_code: item.batches?.internal_code ?? null,
      batches: undefined,
    })) ?? []
  ) as ReservaStock[];
}
