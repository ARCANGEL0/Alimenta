import { connection } from 'next/server';
import { Card } from '@/components/ui/card';
import Tabela from '@/components/ui/tabela';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, ArrowDownRight, AlertTriangle } from 'lucide-react';
import {
  obterIndicadoresDashboard,
  obterLotesProximosVencimento,
  obterMovimentosPorDia,
} from '@/modules/dashboard/queries';
import { formatNumber, formatDate } from '@/lib/formatting';

export const instant = false;


export default async function DashboardPage() {
  await connection();
  const ind = await obterIndicadoresDashboard();
  const lotes = await obterLotesProximosVencimento();
  const movimentos = await obterMovimentosPorDia(7);

  const porDia = new Map<string, { entradas: number; saidas: number }>();
  for (const m of movimentos) {
    const dia = String(m.data).slice(0, 10);
    const atual = porDia.get(dia) ?? { entradas: 0, saidas: 0 };
    const q = Number(m.total);
    if (m.movement_type === 'receipt' || m.movement_type === 'adjustment_in') atual.entradas += q;
    else atual.saidas += q;
    porDia.set(dia, atual);
  }
  const dias = Array.from(porDia.entries()).slice(-7);
  const maxBar = Math.max(1, ...dias.map(([, v]) => Math.max(v.entradas, v.saidas)));

  const stats = [
    { label: 'Stock disponível', value: formatNumber(ind.stockDisponivel), icon: Package },
    { label: 'Entradas (30 dias)', value: formatNumber(ind.entradasPeriodo), icon: TrendingUp },
    { label: 'Saídas (30 dias)', value: formatNumber(ind.saidasPeriodo), icon: ArrowDownRight },
    { label: 'Lotes a vencer / vencidos', value: `${ind.lotesCriticos} / ${ind.lotesVencidos}`, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Visão geral</h1>
        <p className="mt-1 text-muted">Indicadores reais de stock, entradas e saídas.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={s.label} className={`p-5 animate-fade-up stagger-${i + 1}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{s.label}</p>
              <s.icon className="h-5 w-5 text-forest/60" />
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-ink">Entradas vs saídas (últimos 7 dias)</h2>
          {dias.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Sem movimentos nos últimos 7 dias.</p>
          ) : (
            <div className="flex h-44 items-end gap-3">
              {dias.map(([dia, v]) => (
                <div key={dia} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-36 w-full items-end justify-center gap-1">
                    <div
                      className="w-4 rounded-t bg-forest"
                      style={{ height: `${(v.entradas / maxBar) * 100}%` }}
                      title={`Entradas: ${formatNumber(v.entradas)}`}
                    />
                    <div
                      className="w-4 rounded-t bg-danger/70"
                      style={{ height: `${(v.saidas / maxBar) * 100}%` }}
                      title={`Saídas: ${formatNumber(v.saidas)}`}
                    />
                  </div>
                  <span className="text-[11px] text-muted">{formatDate(dia).slice(0, 5)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-forest" /> Entradas</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-danger/70" /> Saídas</span>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink">Validades próximas</h2>
          <Tabela
            cabecalhos={['Lote', 'Produto', 'Dias']}
            vazio="Nenhum lote próximo do fim da validade."
            linhas={lotes.map((l) => [
              l.lote,
              l.produto ?? '—',
              <Badge key={l.lote} variant={l.dias < 0 ? 'danger' : l.dias <= 3 ? 'warning' : 'secondary'}>
                {l.dias < 0 ? `vencido há ${-l.dias}d` : `${l.dias}d`}
              </Badge>,
            ])}
          />
        </Card>
      </div>
    </div>
  );
}
