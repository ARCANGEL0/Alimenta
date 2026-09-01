import { createServerClient } from '@/src/lib/postgres/server';
import type { LoteValidade, LimiaresValidade } from './types';

export async function listarLotesValidade(): Promise<LoteValidade[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('batches')
    .select(`
      *,
      products (name)
    `)
    .order('expiry_date', { ascending: true, nullsLast: true })
    .order('received_at', { ascending: true });

  if (error) {
    throw new Error('Não foi possível listar os lotes por validade.');
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return (
    data?.map((item) => {
      const expiryDate = item.expiry_date
        ? new Date(item.expiry_date)
        : null;
      const diasParaVencimento = expiryDate
        ? Math.ceil(
            (expiryDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
          )
        : null;

      let estadoAlerta: LoteValidade['estado_alerta'] = 'normal';
      if (diasParaVencimento === null) {
        estadoAlerta = 'normal';
      } else if (diasParaVencimento < 0) {
        estadoAlerta = 'vencido';
      } else if (diasParaVencimento <= 3) {
        estadoAlerta = 'critico';
      } else if (diasParaVencimento <= 7) {
        estadoAlerta = 'atencao';
      }

      return {
        id: item.id,
        internal_code: item.internal_code,
        product_name: item.products?.name ?? null,
        expiry_date: item.expiry_date,
        expiry_type: item.expiry_type,
        on_hand_quantity: item.on_hand_quantity,
        available_quantity: item.available_quantity,
        unit_code: item.unit_code,
        status: item.status,
        dias_para_vencimento: diasParaVencimento,
        estado_alerta: estadoAlerta,
      } as LoteValidade;
    }) ?? []
  ) as LoteValidade[];
}

export async function obterLimiaresValidade(): Promise<LimiaresValidade> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('settings')
    .select('value')
    .eq('key', 'expiry_thresholds')
    .single();

  if (error || !data) {
    return { expired_days: 0, critical_days: 3, attention_days: 7 };
  }

  const value = data.value as LimiaresValidade;
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
  const postgres = createServerClient();

  const { error } = await postgres
    .from('batches')
    .update({ status: 'blocked' })
    .eq('id', batchId);

  if (error) {
    throw new Error('Não foi possível bloquear o lote.');
  }

  const { error: erroAuditoria } = await postgres.from('audit_logs').insert({
    action: 'bloquear_lote',
    entity_type: 'batch',
    entity_id: batchId,
    metadata: { motivo },
  });

  if (erroAuditoria) {
    throw new Error('Não foi possível registar a auditoria do bloqueio.');
  }
}

export async function avaliarLote(
  batchId: string,
  avaliacao: 'apto' | 'imapto',
  notas: string | null,
): Promise<void> {
  const postgres = createServerClient();

  const decision = avaliacao === 'apto' ? 'approved' : 'rejected';

  const { error } = await postgres.from('batch_inspections').insert({
    batch_id: batchId,
    decision: decision,
    notes: notas,
    inspected_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error('Não foi possível registar a avaliação do lote.');
  }

  const novoStatus = avaliacao === 'apto' ? 'available' : 'blocked';

  const { error: erroUpdate } = await postgres
    .from('batches')
    .update({ status: novoStatus })
    .eq('id', batchId);

  if (erroUpdate) {
    throw new Error('Não foi possível atualizar o estado do lote.');
  }
}
