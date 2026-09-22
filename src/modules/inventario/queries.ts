import { query } from '@/lib/db/pool';
import type { Lote, LoteParaCriar, MovimentoStock } from './types';

export type Armazem = { id: string; name: string; code: string | null };
export type Localizacao = { id: string; code: string; warehouse_id: string | null };

export async function listarArmazens(): Promise<Armazem[]> {
  const result = await query(`select id, name, code from warehouses order by name`);
  return result.rows as Armazem[];
}

export async function listarLocalizacoes(): Promise<Localizacao[]> {
  const result = await query(`select id, code, warehouse_id from storage_locations order by code`);
  return result.rows as Localizacao[];
}

export async function listarLotes(): Promise<Lote[]> {
  const result = await query(
    `select b.*, p.name as product_name, w.name as warehouse_name, sl.code as storage_location_code
     from batches b
     left join products p on p.id = b.product_id
     left join warehouses w on w.id = b.warehouse_id
     left join storage_locations sl on sl.id = b.storage_location_id
     order by b.received_at desc`,
  );
  return result.rows as Lote[];
}

export async function criarLote(payload: LoteParaCriar): Promise<Lote> {
  const result = await query(
    `insert into batches (
      internal_code, product_id, warehouse_id, storage_location_id,
      received_at, expiry_date, expiry_type, initial_quantity,
      on_hand_quantity, reserved_quantity, available_quantity, unit_code, status
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $9, $10, 'available')
    returning *`,
    [
      payload.internal_code,
      payload.product_id,
      payload.warehouse_id,
      payload.storage_location_id ?? null,
      payload.received_at,
      payload.expiry_date ?? null,
      payload.expiry_type ?? null,
      payload.initial_quantity,
      payload.initial_quantity,
      payload.unit_code,
    ],
  );
  return result.rows[0] as Lote;
}

export async function listarMovimentosDoLote(
  batchId: string,
): Promise<MovimentoStock[]> {
  const result = await query(
    `select m.*, pr.full_name as created_by_name
     from stock_movements m
     left join profiles pr on pr.id = m.created_by
     where m.batch_id = $1
     order by m.created_at desc`,
    [batchId],
  );
  return result.rows as MovimentoStock[];
}


export async function listarLotesPorEstado(status: string): Promise<Lote[]> {
  const result = await query(`select b.*, p.name as product_name from batches b left join products p on p.id = b.product_id where b.status = $1 order by b.received_at desc`, [status]);
  return result.rows as Lote[];
}


export async function buscarLotePorCodigo(internalCode: string): Promise<Lote | null> {
  const result = await query(`select b.*, p.name as product_name from batches b left join products p on p.id = b.product_id where b.internal_code = $1`, [internalCode]);
  return result.rows[0] ?? null;
}


export async function listarLotesProximosValidade(dias: number): Promise<Lote[]> {
  const limite = new Date();
  limite.setDate(limite.getDate() + dias);
  const result = await query(`select b.*, p.name as product_name from batches b left join products p on p.id = b.product_id where b.expiry_date is not null and b.expiry_date <= $1 and b.status = 'available' order by b.expiry_date asc`, [limite.toISOString().split('T')[0]]);
  return result.rows as Lote[];
}


export async function obterTotalStockPorProduto(): Promise<Array<{ produto: string; total: number }>> {
  const result = await query(`select p.name as produto, sum(b.available_quantity) as total from batches b left join products p on p.id = b.product_id group by p.name order by total desc`);
  return result.rows;
}


export async function obterTotalMovimentosPorTipo(): Promise<Array<{ tipo: string; total: number }>> {
  const result = await query(`select movement_type as tipo, sum(quantity) as total from stock_movements group by movement_type order by total desc`);
  return result.rows;
}


export async function obterSaldoTotalPorLote(batchId: string): Promise<{ on_hand: number; reserved: number; available: number }> {
  const result = await query(`select on_hand_quantity as on_hand, reserved_quantity as reserved, available_quantity as available from batches where id = $1`, [batchId]);
  return result.rows[0] ?? { on_hand: 0, reserved: 0, available: 0 };
}


export async function listarLotesPorArmazem(warehouseId: string): Promise<Lote[]> {
  const result = await query(`select b.*, p.name as product_name from batches b left join products p on p.id = b.product_id where b.warehouse_id = $1 order by b.received_at desc`, [warehouseId]);
  return result.rows as Lote[];
}
