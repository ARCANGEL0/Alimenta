import { query } from '@/lib/db/pool';
import type {
  Distribuicao,
  DistribuicaoParaCriar,
  ItemDistribuicao,
  ItemDistribuicaoParaCriar,
} from './types';

export async function listarDistribuicoes(): Promise<Distribuicao[]> {
  const result = await query(
    `select d.*, h.code as household_code
     from distributions d
     left join households h on h.id = d.household_id
     order by d.created_at desc`,
  );
  return result.rows as Distribuicao[];
}

export async function listarDistribuicoesPorStatus(
  status: string,
): Promise<Distribuicao[]> {
  const result = await query(
    `select d.*, h.code as household_code
     from distributions d
     left join households h on h.id = d.household_id
     where d.status = $1
     order by d.created_at desc`,
    [status],
  );
  return result.rows as Distribuicao[];
}

export async function listarDistribuicoesPorCasa(
  householdId: string,
): Promise<Distribuicao[]> {
  const result = await query(
    `select d.*, h.code as household_code
     from distributions d
     left join households h on h.id = d.household_id
     where d.household_id = $1
     order by d.created_at desc`,
    [householdId],
  );
  return result.rows as Distribuicao[];
}

export async function criarDistribuicao(
  payload: DistribuicaoParaCriar,
): Promise<Distribuicao> {
  const result = await query(
    `insert into distributions (reference, household_id, scheduled_at, notes, status)
     values ($1, $2, $3, $4, 'draft')
     returning *`,
    [
      'DIST-' + Date.now().toString(36).toUpperCase(),
      payload.household_id,
      payload.scheduled_at ?? null,
      payload.notes ?? null,
    ],
  );
  return result.rows[0] as Distribuicao;
}

export async function criarItemDistribuicao(
  payload: ItemDistribuicaoParaCriar,
): Promise<ItemDistribuicao> {
  const result = await query(
    `insert into distribution_items (distribution_id, product_id, quantity_requested, unit_code)
     values ($1, $2, $3, $4)
     returning *`,
    [
      payload.distribution_id,
      payload.product_id ?? null,
      payload.quantity_requested,
      payload.unit_code ?? null,
    ],
  );
  return result.rows[0] as ItemDistribuicao;
}

export async function listarItensDaDistribuicao(
  distributionId: string,
): Promise<ItemDistribuicao[]> {
  const result = await query(
    `select di.*, p.name as product_name
     from distribution_items di
     left join products p on p.id = di.product_id
     where di.distribution_id = $1
     order by di.created_at asc`,
    [distributionId],
  );
  return result.rows as ItemDistribuicao[];
}

export async function listarDistribuicoesRecentes(
  limite: number = 10,
): Promise<Distribuicao[]> {
  const result = await query(
    `select d.*, h.code as household_code
     from distributions d
     left join households h on h.id = d.household_id
     order by d.created_at desc
     limit $1`,
    [limite],
  );
  return result.rows as Distribuicao[];
}

export async function listarDistribuicoesPorTipo(
  tipo: string,
): Promise<Distribuicao[]> {
  const result = await query(
    `select d.*, h.code as household_code
     from distributions d
     left join households h on h.id = d.household_id
     where d.status = $1
     order by d.created_at desc`,
    [tipo],
  );
  return result.rows as Distribuicao[];
}

export async function listarDistribuicoesPorPeriodo(startDate: string, endDate: string): Promise<Distribuicao[]> {
  const result = await query(`select d.*, h.code as household_code from distributions d left join households h on h.id = d.household_id where d.created_at >= $1 and d.created_at <= $2 order by d.created_at desc`, [startDate, endDate]);
  return result.rows as Distribuicao[];
}


export async function buscarDistribuicaoPorReferencia(reference: string): Promise<Distribuicao | null> {
  const result = await query(`select d.*, h.code as household_code from distributions d left join households h on h.id = d.household_id where d.reference = $1`, [reference]);
  return result.rows[0] ?? null;
}


export async function obterTotalDistribuicoesPorEstado(): Promise<Array<{ status: string; total: number }>> {
  const result = await query(`select status, count(*) as total from distributions group by status order by total desc`);
  return result.rows;
}


export async function listarDistribuicoesAtivas(): Promise<Distribuicao[]> {
  const result = await query(`select d.*, h.code as household_code from distributions d left join households h on h.id = d.household_id where d.status in ('draft','preparing','reserved') order by d.created_at desc`);
  return result.rows as Distribuicao[];
}
