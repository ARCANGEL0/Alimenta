import { createServerClient } from '@/src/lib/postgres/server';
import type { Descarte, DescarteParaCriar } from './types';

export async function listarDescartes(): Promise<Descarte[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('disposals')
    .select(`
      *,
      batches (internal_code),
      products (name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Não foi possível listar os descartes.');
  }

  return (
    data?.map((item) => ({
      ...item,
      batch_internal_code: item.batches?.internal_code ?? null,
      product_name: item.products?.name ?? null,
      batches: undefined,
      products: undefined,
    })) ?? []
  ) as Descarte[];
}

export async function criarDescarte(payload: DescarteParaCriar): Promise<Descarte> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('disposals')
    .insert(payload)
    .select(`
      *,
      batches (internal_code),
      products (name)
    `)
    .single();

  if (error || !data) {
    throw new Error('Não foi possível criar o descarte.');
  }

  return {
    ...data,
    batch_internal_code: data.batches?.internal_code ?? null,
    product_name: data.products?.name ?? null,
    batches: undefined,
    products: undefined,
  } as Descarte;
}
