import { query } from '@/lib/db/pool';
import type { LoteValidade, LimiaresValidade } from './types';

export async function listarLotesValidade(): Promise<LoteValidade[]> {
  const limiares = await obterLimiaresValidade();
  const result = await query(
    `select b.*, p.name as product_name
     from batches b
     left join products p on p.id = b.product_id
     where b.status not in ('depleted', 'disposed')
     order by b.expiry_date asc nulls last, b.received_at asc`,
  );

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return result.rows.map((item) => {
    const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null;
    const diasParaVencimento = expiryDate
      ? Math.ceil((expiryDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let estadoAlerta: LoteValidade['estado_alerta'] = 'normal';
    if (diasParaVencimento === null) {
      estadoAlerta = 'normal';
    } else if (diasParaVencimento < -limiares.expired_days) {
      estadoAlerta = 'vencido';
    } else if (diasParaVencimento <= limiares.critical_days) {
      estadoAlerta = 'critico';
    } else if (diasParaVencimento <= limiares.attention_days) {
      estadoAlerta = 'atencao';
    }

    return {
      id: item.id,
      internal_code: item.internal_code,
      product_name: item.product_name ?? null,
      expiry_date: item.expiry_date,
      expiry_type: item.expiry_type,
      on_hand_quantity: item.on_hand_quantity,
      available_quantity: item.available_quantity,
      unit_code: item.unit_code,
      status: item.status,
      dias_para_vencimento: diasParaVencimento,
      estado_alerta: estadoAlerta,
    };
  }) as LoteValidade[];
}

export async function obterLimiaresValidade(): Promise<LimiaresValidade> {
  const result = await query(
    "select value from settings where key = 'expiry_thresholds'",
  );

  if (result.rows.length === 0) {
    return { expired_days: 0, critical_days: 3, attention_days: 7 };
  }

  const value = result.rows[0].value as LimiaresValidade;
  return {
    expired_days: value.expired_days ?? 0,
    critical_days: value.critical_days ?? 3,
    attention_days: value.attention_days ?? 7,
  };
}

export async function bloquearLote(
  batchId: string,
  motivo: string,
): Promise<void> {
  await query(
    `update batches set status = 'blocked', updated_at = now() where id = $1`,
    [batchId],
  );

  await query(
    `insert into audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
     values ($1, $2, $3, $4, $5, now())`,
    [null, 'bloquear_lote', 'batch', batchId, JSON.stringify({ motivo })],
  );
}

export async function avaliarLote(
  batchId: string,
  avaliacao: 'apto' | 'imapto',
  notas: string | null,
): Promise<void> {
  const decision = avaliacao === 'apto' ? 'approved' : 'rejected';

  await query(
    `insert into batch_inspections (batch_id, decision, notes, inspected_at)
     values ($1, $2, $3, now())`,
    [batchId, decision, notas ?? null],
  );

  const novoStatus = avaliacao === 'apto' ? 'available' : 'blocked';

  await query(
    `update batches set status = $1, updated_at = now() where id = $2`,
    [novoStatus, batchId],
  );
}


export async function listarLotesPorProduto(productId: string): Promise<LoteValidade[]> {
  const result = await query(`select b.*, p.name as product_name from batches b left join products p on p.id = b.product_id where b.product_id = $1 order by b.expiry_date asc nulls last`, [productId]);
  return result.rows.map((item) => ({ ...item, dias_para_vencimento: null, estado_alerta: 'normal' })) as LoteValidade[];
}


export async function obterContagemPorEstadoAlerta(): Promise<Array<{ estado: string; total: number }>> {
  const lotes = await listarLotesValidade();
  const contagem = lotes.reduce((acc, l) => { acc[l.estado_alerta] = (acc[l.estado_alerta] || 0) + 1; return acc; }, {} as Record<string, number>);
  return Object.entries(contagem).map(([estado, total]) => ({ estado, total }));
}


export async function listarLotesVencidos(): Promise<LoteValidade[]> {
  const lotes = await listarLotesValidade();
  return lotes.filter(l => l.estado_alerta === 'vencido');
}
