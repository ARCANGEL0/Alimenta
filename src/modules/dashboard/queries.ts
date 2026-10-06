import { query } from '@/lib/db/pool';
import type { IndicadoresDashboard } from './types';
import { obterLimiaresValidade } from '@/modules/validade/queries';

export async function obterIndicadoresDashboard(): Promise<IndicadoresDashboard> {
  const limiares = await obterLimiaresValidade();
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

  const lotes = await query(
    `select b.*, p.name as product_name from batches b
     left join products p on p.id = b.product_id
     where b.status not in ('depleted', 'disposed')`,
  );
  const movimentos = await query(
    `select * from stock_movements where created_at >= $1`,
    [trintaDiasAtras.toISOString()],
  );
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const stockDisponivel = (lotes.rows ?? []).reduce(
    (acc, l) => acc + Number(l.available_quantity),
    0,
  );

  const entradasPeriodo = (movimentos.rows ?? []).reduce(
    (acc, m) =>
      m.movement_type === 'receipt' || m.movement_type === 'adjustment_in'
        ? acc + Number(m.quantity)
        : acc,
    0,
  );

  const saidasPeriodo = (movimentos.rows ?? []).reduce(
    (acc, m) =>
      m.movement_type === 'distribution' ||
      m.movement_type === 'disposal' ||
      m.movement_type === 'adjustment_out'
        ? acc + Number(m.quantity)
        : acc,
    0,
  );

  const descartesPeriodo = (movimentos.rows ?? []).reduce(
    (acc, m) => (m.movement_type === 'disposal' ? acc + Number(m.quantity) : acc),
    0,
  );

  const lotesVencidos = (lotes.rows ?? []).filter((l) => {
    if (!l.expiry_date) return false;
    return new Date(l.expiry_date) < hoje;
  }).length;

  const lotesCriticos = (lotes.rows ?? []).filter((l) => {
    if (!l.expiry_date) return false;
    const dias = Math.ceil(
      (new Date(l.expiry_date).getTime() - hoje.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return dias >= 0 && dias <= limiares.critical_days;
  }).length;

  const stockPorUnidadeMap = new Map<string, number>();
  (lotes.rows ?? []).forEach((l) => {
    const atual = stockPorUnidadeMap.get(l.unit_code) ?? 0;
    stockPorUnidadeMap.set(l.unit_code, atual + Number(l.available_quantity));
  });
  const stockPorUnidade = Array.from(stockPorUnidadeMap.entries()).map(
    ([unidade, quantidade]) => ({ unidade, quantidade }),
  );

  const entradasVsSaidas = [];
  for (let i = 6; i >= 0; i--) {
    const dia = new Date();
    dia.setDate(dia.getDate() - i);
    dia.setHours(0, 0, 0, 0);
    const diaStr = dia.toISOString().split('T')[0];

    const entradasDia = (movimentos.rows ?? []).reduce((acc, m) => {
      if (
        (m.movement_type === 'receipt' || m.movement_type === 'adjustment_in') &&
        new Date(m.created_at).toISOString().startsWith(diaStr)
      ) {
        return acc + Number(m.quantity);
      }
      return acc;
    }, 0);

    const saidasDia = (movimentos.rows ?? []).reduce((acc, m) => {
      if (
        (m.movement_type === 'distribution' ||
          m.movement_type === 'disposal' ||
          m.movement_type === 'adjustment_out') &&
        new Date(m.created_at).toISOString().startsWith(diaStr)
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

  const alertasValidade: IndicadoresDashboard['alertasValidade'] = [];
  (lotes.rows ?? []).forEach((l) => {
    if (!l.expiry_date) return;
    const dias = Math.ceil(
      (new Date(l.expiry_date).getTime() - hoje.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    let estado: 'vencido' | 'critico' | 'atencao' | null = null;
    if (dias < 0) estado = 'vencido';
    else if (dias <= limiares.critical_days) estado = 'critico';
    else if (dias <= limiares.attention_days) estado = 'atencao';

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

export async function obterIndicadoresPorCategoria(): Promise<
  Array<{ categoria: string; quantidade: number }>
> {
  const result = await query(
    `select c.name as categoria, count(b.id) as quantidade
     from batches b
     left join products p on p.id = b.product_id
     left join categories c on c.id = p.category_id
     group by c.name
     order by quantidade desc`,
  );
  return result.rows;
}

export async function obterLotesProximosVencimento(): Promise<
  Array<{
    lote: string;
    produto: string | null;
    dias: number;
  }>
> {
  const trintaDias = new Date();
  trintaDias.setDate(trintaDias.getDate() + 30);

  const result = await query(
    `select b.internal_code as lote, p.name as produto, b.expiry_date
     from batches b
     left join products p on p.id = b.product_id
     where b.expiry_date is not null
       and b.expiry_date <= $1
       and b.status = 'available'
     order by b.expiry_date asc`,
    [trintaDias.toISOString().split('T')[0]],
  );
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return result.rows.map((r) => {
    const dias = Math.ceil(
      (new Date(r.expiry_date).getTime() - hoje.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return {
      lote: r.lote,
      produto: r.produto,
      dias,
    };
  });
}

export async function obterIndicadoresPorPeriodo(startDate: string, endDate: string): Promise<IndicadoresDashboard> {
  const lotes = await query(`select * from batches where status <> 'depleted'`);
  const movimentos = await query(`select * from stock_movements where created_at >= $1 and created_at <= $2`, [startDate, endDate]);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const stockDisponivel = (lotes.rows ?? []).reduce((acc, l) => acc + Number(l.available_quantity), 0);
  return { stockDisponivel, entradasPeriodo: 0, saidasPeriodo: 0, descartesPeriodo: 0, lotesVencidos: 0, lotesCriticos: 0, stockPorUnidade: [], entradasVsSaidas: [], alertasValidade: [] };
}


export async function obterTotalDoacoesPorDoador(): Promise<Array<{ doador: string; total: number }>> {
  const result = await query(`select dn.name as doador, sum(di.quantity_accepted) as total from donation_items di join donations d on d.id = di.donation_id join donors dn on dn.id = d.donor_id group by dn.name order by total desc`);
  return result.rows;
}


export async function obterTotalStockPorArmazem(): Promise<Array<{ armazem: string; total: number }>> {
  const result = await query(`select w.name as armazem, sum(b.available_quantity) as total from batches b left join warehouses w on w.id = b.warehouse_id group by w.name order by total desc`);
  return result.rows;
}


export async function obterMovimentosPorDia(dias: number = 30): Promise<Array<{ data: string; movement_type: string; total: number }>> {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - dias);
  const result = await query(`select to_char(created_at, 'YYYY-MM-DD') as data, movement_type, sum(quantity) as total from stock_movements where created_at >= $1 group by 1, movement_type order by data asc`, [inicio.toISOString()]);
  return result.rows;
}
