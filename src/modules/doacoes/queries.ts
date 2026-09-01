import { createServerClient } from '@/src/lib/postgres/server';
import type {
  Doacao,
  DoacaoItem,
  DoacaoItemParaCriar,
  DoacaoParaCriar,
  Doador,
  DoadorParaCriar,
} from './types';

export async function listarDoadores(): Promise<Doador[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('donors')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error('Não foi possível listar os doadores.');
  }

  return (data ?? []) as Doador[];
}

export async function listarDoacoes(): Promise<Doacao[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('donations')
    .select(`
      *,
      donors (name)
    `)
    .order('received_at', { ascending: false });

  if (error) {
    throw new Error('Não foi possível listar as doações.');
  }

  return (
    data?.map((item) => ({
      ...item,
      donor_name: item.donors?.name ?? null,
      donors: undefined,
    })) ?? []
  ) as Doacao[];
}

export async function listarItensDaDoacao(
  donationId: string,
): Promise<DoacaoItem[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('donation_items')
    .select(`
      *,
      products (name)
    `)
    .eq('donation_id', donationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('Não foi possível listar os itens da doação.');
  }

  return (
    data?.map((item) => ({
      ...item,
      product_name: item.products?.name ?? null,
      products: undefined,
    })) ?? []
  ) as DoacaoItem[];
}

export async function criarDoador(payload: DoadorParaCriar): Promise<Doador> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('donors')
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Não foi possível criar o doador.');
  }

  return data as Doador;
}

export async function criarDoacao(payload: DoacaoParaCriar): Promise<Doacao> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('donations')
    .insert(payload)
    .select(`
      *,
      donors (name)
    `)
    .single();

  if (error || !data) {
    throw new Error('Não foi possível criar a doação.');
  }

  return {
    ...data,
    donor_name: data.donors?.name ?? null,
    donors: undefined,
  } as Doacao;
}

export async function criarItemDaDoacao(
  payload: DoacaoItemParaCriar,
): Promise<DoacaoItem> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('donation_items')
    .insert(payload)
    .select(`
      *,
      products (name)
    `)
    .single();

  if (error || !data) {
    throw new Error('Não foi possível criar o item da doação.');
  }

  return {
    ...data,
    product_name: data.products?.name ?? null,
    products: undefined,
  } as DoacaoItem;
}
