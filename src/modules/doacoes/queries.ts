import { query } from '@/lib/db/pool';
import type {
  Doacao,
  DoacaoItem,
  DoacaoItemParaCriar,
  DoacaoParaCriar,
  Doador,
  DoadorParaCriar,
} from './types';

export async function listarDoadores(): Promise<Doador[]> {
  const result = await query(
    'select * from donors order by created_at desc, name asc',
  );
  return result.rows as Doador[];
}

export async function listarDoadoresAtivos(): Promise<Doador[]> {
  const result = await query(
    'select * from donors where is_active = true order by created_at desc, name asc',
  );
  return result.rows as Doador[];
}

export async function listarDoadoresPorTipo(
  donorType: string,
): Promise<Doador[]> {
  const result = await query(
    `select * from donors where donor_type = $1 order by name asc`,
    [donorType],
  );
  return result.rows as Doador[];
}

export async function listarDoacoes(): Promise<Doacao[]> {
  const result = await query(
    `select d.*, dn.name as donor_name
     from donations d
     left join donors dn on dn.id = d.donor_id
     order by d.received_at desc`,
  );
  return result.rows as Doacao[];
}

export async function listarDoacoesPorStatus(
  status: string,
): Promise<Doacao[]> {
  const result = await query(
    `select d.*, dn.name as donor_name
     from donations d
     left join donors dn on dn.id = d.donor_id
     where d.status = $1
     order by d.received_at desc`,
    [status],
  );
  return result.rows as Doacao[];
}

export async function listarItensDaDoacao(
  donationId: string,
): Promise<DoacaoItem[]> {
  const result = await query(
    `select di.*, p.name as product_name
     from donation_items di
     left join products p on p.id = di.product_id
     where di.donation_id = $1
     order by di.created_at asc`,
    [donationId],
  );
  return result.rows as DoacaoItem[];
}

export async function criarDoador(
  payload: DoadorParaCriar,
): Promise<Doador> {
  const result = await query(
    `insert into donors (code, name, donor_type, email, phone, address, notes)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [
      payload.code,
      payload.name,
      payload.donor_type ?? null,
      payload.email ?? null,
      payload.phone ?? null,
      payload.address ?? null,
      payload.notes ?? null,
    ],
  );
  return result.rows[0] as Doador;
}

export async function criarDoacao(
  payload: DoacaoParaCriar,
): Promise<Doacao> {
  const result = await query(
    `insert into donations (reference, donor_id, received_at, notes)
     values ($1, $2, $3, $4)
     returning *`,
    [
      'DO-' + crypto.randomUUID().slice(0, 8),
      payload.donor_id,
      payload.received_at,
      payload.notes ?? null,
    ],
  );
  return result.rows[0] as Doacao;
}

export async function criarItemDaDoacao(
  payload: DoacaoItemParaCriar,
): Promise<DoacaoItem> {
  const result = await query(
    `insert into donation_items (donation_id, product_id, quantity_received, unit_code, supplier_batch_code, expiry_date, expiry_type)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [
      payload.donation_id,
      payload.product_id ?? null,
      payload.quantity_received ?? null,
      payload.unit_code ?? null,
      payload.supplier_batch_code ?? null,
      payload.expiry_date ?? null,
      payload.expiry_type ?? null,
    ],
  );
  return result.rows[0] as DoacaoItem;
}

export async function listarDoacoesPorDoador(
  donorId: string,
): Promise<Doacao[]> {
  const result = await query(
    `select d.*, dn.name as donor_name
     from donations d
     left join donors dn on dn.id = d.donor_id
     where d.donor_id = $1
     order by d.received_at desc`,
    [donorId],
  );
  return result.rows as Doacao[];
}

export async function listarDoacoesPorData(
  startDate: string,
  endDate: string,
): Promise<Doacao[]> {
  const result = await query(
    `select d.*, dn.name as donor_name
     from donations d
     left join donors dn on dn.id = d.donor_id
     where d.received_at >= $1 and d.received_at <= $2
     order by d.received_at desc`,
    [startDate, endDate],
  );
  return result.rows as Doacao[];
}

export async function listarDoacoesPorPeriodo(startDate: string, endDate: string): Promise<Doacao[]> {
  const result = await query(`select d.*, dn.name as donor_name from donations d left join donors dn on dn.id = d.donor_id where d.received_at >= $1 and d.received_at <= $2 order by d.received_at desc`, [startDate, endDate]);
  return result.rows as Doacao[];
}


export async function buscarDoadorPorCodigo(code: string): Promise<Doador | null> {
  const result = await query(`select * from donors where code = $1`, [code]);
  return result.rows[0] ?? null;
}


export async function obterTotalDoacoesPorEstado(): Promise<Array<{ status: string; total: number }>> {
  const result = await query(`select status, count(*) as total from donations group by status order by total desc`);
  return result.rows;
}


export async function obterTotalItensPorDoacao(donationId: string): Promise<number> {
  const result = await query(`select count(*) as total from donation_items where donation_id = $1`, [donationId]);
  return Number(result.rows[0]?.total ?? 0);
}
