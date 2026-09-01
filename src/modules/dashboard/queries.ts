import { createServerClient } from '@/src/lib/postgres/server';
import type { IndicadoresDashboard } from './types';

export async function obterIndicadoresDashboard(): Promise<IndicadoresDashboard> {
  const postgres = createServerClient();

  // Stock disponível total (soma de available_quantity dos lotes disponíveis).
  const { data: lotes } = await postgres
    .from('batches')
    .select('available_quantity, unit_code, status');

  const stockDisponivel = (lotes ?? []).reduce(
    (acc, l) => acc + Number(l.available_quantity),
    0,
  );

  // Entradas e saídas do período (últimos 30 dias).
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

  const { data: movimentos } = await postgres
    .from('stock_movements')
    .select('movement_type, quantity, created_at')
    .gte('created_at', trintaDiasAtras.toISOString());

  const entradasPeriodo = (movimentos ?? []).reduce(
    (acc, m) =>
      m.movement_type === 'receipt' || m.movement_type === 'adjustment_in'
        ? acc + Number(m.quantity)
        : acc,
    0,
  );

  const saidasPeriodo = (movimentos ?? []).reduce(
    (acc, m) =>
      m.movement_type === 'distribution' ||
      m.movement_type === 'disposal' ||
      m.movement_type === 'adjustment_out'
        ? acc + Number(m.quantity)
        : acc,
    0,
  );

  const descartesPeriodo = (movimentos ?? []).reduce(
    (acc, m) =>
      m.movement_type === 'disposal' ? acc + Number(m.quantity) : acc,
    0,
  );

  // Lotes vencidos e críticos.
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const lotesValidade = (lotes ?? []).filter((l) => l.status !== 'depleted');
  const lotesVencidos = lotesValidade.filter((l) => {
    if (!l.expiry_date) return false;
    return new Date(l.expiry_date) < hoje;
  }).length;

  const lotesCriticos = lotesValidade.filter((l) => {
    if (!l.expiry_date) return false;
    const dias = Math.ceil(
      (new Date(l.expiry_date).getTime() - hoje.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return dias >= 0 && dias <= 3;
  }).length;

  // Stock por unidade.
  const stockPorUnidadeMap = new Map<string, number>();
  (lotes ?? []).forEach((l) => {
    const atual = stockPorUnidadeMap.get(l.unit_code) ?? 0;
    stockPorUnidadeMap.set(l.unit_code, atual + Number(l.available_quantity));
  });
  const stockPorUnidade = Array.from(stockPorUnidadeMap.entries()).map(
    ([unidade, quantidade]) => ({ unidade, quantidade }),
  );

  // Entradas vs saídas por dia (últimos 7 dias).
  const entradasVsSaidas = [];
  for (let i = 6; i >= 0; i--) {
    const dia = new Date();
    dia.setDate(dia.getDate() - i);
    dia.setHours(0, 0, 0, 0);
    const diaStr = dia.toISOString().split('T')[0];

    const entradasDia = (movimentos ?? []).reduce((acc, m) => {
      if (
        (m.movement_type === 'receipt' || m.movement_type === 'adjustment_in') &&
        m.created_at.startsWith(diaStr)
      ) {
        return acc + Number(m.quantity);
      }
      return acc;
    }, 0);

    const saidasDia = (movimentos ?? []).reduce((acc, m) => {
      if (
        (m.movement_type === 'distribution' ||
          m.movement_type === 'disposal' ||
          m.movement_type === 'adjustment_out') &&
        m.created_at.startsWith(diaStr)
      ) {
        return acc + Number(m.quantity);
      }
      return acc;
    }, 0);

    entradasVsSaidas.push({
      periodo: dia.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
      entradas: entradasDia,
      saidas: saidasDia,
    });
  }

  // Alertas de validade.
  const alertasValidade: IndicadoresDashboard['alertasValidade'] = [];
  lotesValidade.forEach((l) => {
    if (!l.expiry_date) return;
    const dias = Math.ceil(
      (new Date(l.expiry_date).getTime() - hoje.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    let estado: AlertaValidade['estado'] | null = null;
    if (dias < 0) estado = 'vencido';
    else if (dias <= 3) estado = 'critico';
    else if (dias <= 7) estado = 'atencao';

    if (estado) {
      alertasValidade.push({
        lote: l.internal_code,
        produto: l.product_name ?? null,
        estado,
        dias,
      });
    }
  });

  return {
    stockDisponivel,
    entradasPeriodo,
    saidasPeriodo,
    descartesPeriodo,
    lotesVencidos,
    lotesCriticos,
    stockPorUnidade,
    entradasVsSaidas,
    alertasValidade,
  };
}
