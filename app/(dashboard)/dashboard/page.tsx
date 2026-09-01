import PageHeader from '@/src/components/layout/PageHeader';
import { Card } from '@/src/components/ui/card';
import { actionObterIndicadoresDashboard } from '@/src/modules/dashboard/actions';
import { formatNumber } from '@/src/lib/formatting';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';

type IndicadorCard = {
  titulo: string;
  valor: string;
  subtitulo: string;
  tipo: 'stock' | 'entradas' | 'saidas' | 'descartes' | 'alertas';
};

async function carregarIndicadores() {
  const res = await actionObterIndicadoresDashboard();
  if (res.erro) {
    throw new Error(res.erro);
  }
  return res.indicadores;
}

export default function DashboardPage() {
  const [indicadores, setIndicadores] = useState<
    Awaited<ReturnType<typeof carregarIndicadores>> | null
  >(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarIndicadores()
      .then((i) => {
        setIndicadores(i);
        setCarregando(false);
      })
      .catch((e) => {
        setErro(e.message);
        setCarregando(false);
      });
  }, []);

  const cards: IndicadorCard[] = indicadores
    ? [
        {
          titulo: 'Stock disponível',
          valor: formatNumber(indicadores.stockDisponivel),
          subtitulo: 'Quantidade total disponível',
          tipo: 'stock',
        },
        {
          titulo: 'Entradas (30 dias)',
          valor: formatNumber(indicadores.entradasPeriodo),
          subtitulo: 'Quantidade aceite no período',
          tipo: 'entradas',
        },
        {
          titulo: 'Saídas (30 dias)',
          valor: formatNumber(indicadores.saidasPeriodo),
          subtitulo: 'Distribuições e descartes',
          tipo: 'saidas',
        },
        {
          titulo: 'Descartes (30 dias)',
          valor: formatNumber(indicadores.descartesPeriodo),
          subtitulo: 'Quantidade descartada',
          tipo: 'descartes',
        },
        {
          titulo: 'Lotes vencidos',
          valor: String(indicadores.lotesVencidos),
          subtitulo: 'Bloqueados por validade',
          tipo: 'alertas',
        },
        {
          titulo: 'Lotes críticos',
          valor: String(indicadores.lotesCriticos),
          subtitulo: '0–3 dias para vencer',
          tipo: 'alertas',
        },
      ]
    : [];

  if (carregando) {
    return (
      <div className="p-4 text-center text-muted">A carregar indicadores…</div>
    );
  }

  if (erro) {
    return (
      <div className="p-4 text-danger-600 text-center">Erro: {erro}</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão geral"
        description="Indicadores de stock, entradas e saídas em tempo real."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.titulo} className="p-4">
            <p className="text-xs text-muted">{card.titulo}</p>
            <p className="text-2xl font-semibold text-text">{card.valor}</p>
            <p className="text-xs text-muted">{card.subtitulo}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-text mb-4">
            Entradas vs saídas (últimos 7 dias)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={indicadores?.entradasVsSaidas ?? []}>
                <XAxis dataKey="periodo" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="entradas" fill="#246b50" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="#c94c4c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-text mb-4">
            Alertas de validade
          </h3>
          <div className="space-y-2">
            {indicadores?.alertasValidade.map((alerta) => (
              <div
                key={alerta.lote}
                className="flex justify-between items-start px-3 py-2 border rounded-md"
              >
                <div>
                  <p className="text-sm font-medium text-text">
                    {alerta.lote} — {alerta.produto ?? '—'}
                  </p>
                  <p className="text-xs text-muted">
                    {alerta.dias === null
                      ? 'Sem validade'
                      : alerta.dias < 0
                        ? `Vencido há ${Math.abs(alerta.dias)} dias`
                        : alerta.dias === 0
                          ? 'Vence hoje'
                          : `Vence em ${alerta.dias} dias`}
                  </p>
                </div>
                <span className="text-xs font-semibold">
                  {alerta.estado === 'vencido' && 'text-danger-600'}
                  {alerta.estado === 'critico' && 'text-red-600'}
                  {alerta.estado === 'atencao' && 'text-warning-600'}
                </span>
              </div>
            ))}
            {indicadores?.alertasValidade.length === 0 && (
              <p className="text-xs text-muted">Sem alertas de validade.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-text mb-4">
          Stock por unidade
        </h3>
        <div className="space-y-2">
          {indicadores?.stockPorUnidade.map((item) => (
            <div key={item.unidade} className="flex justify-between px-3 py-2 border-b border-gray-100">
              <span className="text-sm text-text">{item.unidade}</span>
              <span className="text-sm font-medium text-text">
                {formatNumber(item.quantidade)}
              </span>
            </div>
          ))}
          {indicadores?.stockPorUnidade.length === 0 && (
            <p className="text-xs text-muted px-3 py-2">
              Sem stock por unidade.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
