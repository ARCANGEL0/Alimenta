import { query } from '@/lib/db/pool';
import type { Descarte, DescarteParaCriar } from './types';

export async function listarDescartes(): Promise<Descarte[]> {
  const result = await query(
    `select d.*, b.internal_code as batch_internal_code, b.unit_code,
            p.name as product_name, pr.full_name as created_by_name
     from disposals d
     left join batches b on b.id = d.batch_id
     left join products p on p.id = b.product_id
     left join profiles pr on pr.id = d.created_by
     order by d.created_at desc`,
  );
  return result.rows as Descarte[];
}

export async function criarDescarte(
  payload: DescarteParaCriar,
): Promise<Descarte> {
  const result = await query(
    `insert into disposals (batch_id, quantity, reason_code, reason_notes, destination)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [
      payload.batch_id,
      payload.quantity,
      payload.reason_code,
      payload.reason_notes ?? null,
      payload.destination ?? null,
    ],
  );
  return result.rows[0] as Descarte;
}


export async function listarDescartesPorMotivo(reasonCode: string): Promise<Descarte[]> {
  const result = await query(`select d.*, b.internal_code as batch_internal_code from disposals d left join batches b on b.id = d.batch_id where d.reason_code = $1 order by d.created_at desc`, [reasonCode]);
  return result.rows as Descarte[];
}


export async function obterTotalDescartesPorMotivo(): Promise<Array<{ motivo: string; total: number }>> {
  const result = await query(`select reason_code as motivo, sum(quantity) as total from disposals group by reason_code order by total desc`);
  return result.rows;
}


export async function listarDescartesPorPeriodo(startDate: string, endDate: string): Promise<Descarte[]> {
  const result = await query(`select d.*, b.internal_code as batch_internal_code from disposals d left join batches b on b.id = d.batch_id where d.created_at >= $1 and d.created_at <= $2 order by d.created_at desc`, [startDate, endDate]);
  return result.rows as Descarte[];
}
