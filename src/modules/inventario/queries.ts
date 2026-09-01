import { createServerClient } from '@/src/lib/postgres/server';
import type { Lote, LoteParaCriar, MovimentoStock } from './types';

export async function listarLotes(): Promise<Lote[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('batches')
    .select(`
      *,
      products (name),
      warehouses (name),
      storage_locations (code)
    `)
    .order('received_at', { ascending: false });

  if (error) {
    throw new Error('Não foi possível listar os lotes.');
  }

  return (
    data?.map((item) => ({
      ...item,
      product_name: item.products?.name ?? null,
      warehouse_name: item.warehouses?.name ?? null,
      storage_location_code: item.storage_locations?.code ?? null,
      products: undefined,
      warehouses: undefined,
      storage_locations: undefined,
    })) ?? []
  ) as Lote[];
}

export async function criarLote(payload: LoteParaCriar): Promise<Lote> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('batches')
    .insert({
      ...payload,
      on_hand_quantity: payload.initial_quantity,
      reserved_quantity: 0,
      available_quantity: payload.initial_quantity,
      status: 'available',
    })
    .select(`
      *,
      products (name),
      warehouses (name),
      storage_locations (code)
    `)
    .single();

  if (error || !data) {
    throw new Error('Não foi possível criar o lote.');
  }

  return {
    ...data,
    product_name: data.products?.name ?? null,
    warehouse_name: data.warehouses?.name ?? null,
    storage_location_code: data.storage_locations?.code ?? null,
    products: undefined,
    warehouses: undefined,
    storage_locations: undefined,
  } as Lote;
}

export async function listarMovimentosDoLote(
  batchId: string,
): Promise<MovimentoStock[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('stock_movements')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Não foi possível listar os movimentos do lote.');
  }

  return (data ?? []) as MovimentoStock[];
}

// O registo de ajustes de stock (adjustment_in / adjustment_out) é feito
// atraves de insercoes diretas em stock_movements, numa acao de servidor
// que valida sessao e permissao. A funcao RPC transacional para ajustes
// sera adicionada numa proxima migracao, seguindo o padrao de
// confirm_distribution (bloqueio FOR UPDATE + rollback integral).
