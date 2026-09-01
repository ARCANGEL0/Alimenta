import { createServerClient } from '@/src/lib/postgres/server';
import type {
  Agregado,
  AgregadoParaCriar,
  Beneficiario,
  BeneficiarioParaCriar,
  Necessidade,
  NecessidadeParaCriar,
} from './types';

export async function listarAgregados(): Promise<Agregado[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('households')
    .select('*')
    .order('code', { ascending: true });

  if (error) {
    throw new Error('Não foi possível listar os agregados.');
  }

  return (data ?? []) as Agregado[];
}

export async function listarBeneficiarios(): Promise<Beneficiario[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('beneficiaries')
    .select(`
      *,
      households (code)
    `)
    .order('code', { ascending: true });

  if (error) {
    throw new Error('Não foi possível listar os beneficiários.');
  }

  return (
    data?.map((item) => ({
      ...item,
      household_code: item.households?.code ?? null,
      households: undefined,
    })) ?? []
  ) as Beneficiario[];
}

export async function listarNecessidades(
  beneficiaryId: string,
): Promise<Necessidade[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('beneficiary_needs')
    .select('*')
    .eq('beneficiary_id', beneficiaryId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Não foi possível listar as necessidades.');
  }

  return (data ?? []) as Necessidade[];
}

export async function criarAgregado(
  payload: AgregadoParaCriar,
): Promise<Agregado> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('households')
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Não foi possível criar o agregado.');
  }

  return data as Agregado;
}

export async function criarBeneficiario(
  payload: BeneficiarioParaCriar,
): Promise<Beneficiario> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('beneficiaries')
    .insert(payload)
    .select(`
      *,
      households (code)
    `)
    .single();

  if (error || !data) {
    throw new Error('Não foi possível criar o beneficiário.');
  }

  return {
    ...data,
    household_code: data.households?.code ?? null,
    households: undefined,
  } as Beneficiario;
}

export async function criarNecessidade(
  payload: NecessidadeParaCriar,
): Promise<Necessidade> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('beneficiary_needs')
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Não foi possível criar a necessidade.');
  }

  return data as Necessidade;
}
