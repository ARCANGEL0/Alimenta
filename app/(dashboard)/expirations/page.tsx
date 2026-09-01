import PageHeader from '@/src/components/layout/PageHeader';
import Button from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card } from '@/src/components/ui/card';
import { createServerClient } from '@/src/lib/postgres/server';
import { useState } from 'react';

type LoteValidade = {
  id: string;
  internal_code: string;
  product_name: string | null;
  expiry_date: string | null;
  expiry_type: string | null;
  on_hand_quantity: number;
  available_quantity: number;
  unit_code: string;
  status: string;
  dias_para_vencimento: number | null;
  estado_alerta: 'vencido' | 'critico' | 'atencao' | 'normal';
};

type LoteSelecionado = {
  id: string;
  internal_code: string;
  status: string;
  expiry_type: string | null;
  available_quantity: number;
};

async function listarLotesValidade(): Promise<LoteValidade[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('batches')
    .select(`
      *,
      products (name)
    `)
    .order('expiry_date', { ascending: true, nullsLast: true });

  if (error) {
    return [];
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

export default function ExpirationsPage() {
  const [lotes, setLotes] = useState<LoteValidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  async function carregar() {
    const lista = await listarLotesValidade();
    setLotes(lista);
    setCarregando(false);
  }

  const lotesFiltrados = lotes.filter((lote) => {
    if (filtroEstado === 'todos') {
      return true;
    }
    return lote.estado_alerta === filtroEstado;
  });

  const conteoPorEstado = {
    vencido: lotes.filter((l) => l.estado_alerta === 'vencido').length,
    critico: lotes.filter((l) => l.estado_alerta === 'critico').length,
    atencao: lotes.filter((l) => l.estado_alerta === 'atencao').length,
    normal: lotes.filter((l) => l.estado_alerta === 'normal').length,
  };

  const [abrirDialog, setAbrirDialog] = useState(false);
  const [acao, setAcao] = useState<'bloquear' | 'avaliar' | null>(null);
  const [loteSelecionado, setLoteSelecionado] = useState<LoteSelecionado | null>(
    null,
  );
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');

  async function executarAcao() {
    if (!loteSelecionado || !acao) return;

    if (acao === 'bloquear') {
      const res = await fetch('/api/validade/bloquear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: loteSelecionado.id,
          motivo,
        }),
      });
      const json = await res.json();
      if (!json.sucesso) {
        alert(json.erro ?? 'Erro ao bloquear.');
        return;
      }
    } else if (acao === 'avaliar') {
      const res = await fetch('/api/validade/avaliar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: loteSelecionado.id,
          avaliacao: 'apto',
          notas: notas || null,
        }),
      });
      const json = await res.json();
      if (!json.sucesso) {
        alert(json.erro ?? 'Erro ao avaliar.');
        return;
      }
    }

    setAbrirDialog(false);
    setAcao(null);
    setLoteSelecionado(null);
    setMotivo('');
    setNotas('');
    carregar();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Validades (FEFO)"
        description="Lotes ordenados por proximidade de validade (First Expired, First Out)."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[['vencido', 'Vencido', 'text-danger-800', 'bg-danger-100'], ['critico', 'Crítico (0-3 dias)', 'text-red-800', 'bg-red-100'], ['atencao', 'Atenção (4-7 dias)', 'text-warning-800', 'bg-warning-100'], ['normal', 'Normal', 'text-muted', 'bg-gray-100']] as const}.map(
          ([chave, label, texto, fundo]) => (
            <Card
              key={chave}
              className={`p-4 ${fundo} ${texto} cursor-pointer`}
              onClick={() => setFiltroEstado(chave)}
            >
              <p className="text-xs font-semibold uppercase">{label}</p>
              <p className="text-2xl font-bold">
                {conteoPorEstado[chave as keyof typeof conteoPorEstado]}
              </p>
            </Card>
          )
        )}

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted">Filtrar por estado:</label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltroEstado('todos')}
          className={filtroEstado === 'todos' ? 'bg-forest text-white' : ''}
        >
          Todos
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltroEstado('vencido')}
          className={filtroEstado === 'vencido' ? 'bg-danger text-white' : ''}
        >
          Vencido
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltroEstado('critico')}
          className={filtroEstado === 'critico' ? 'bg-danger-600 text-white' : ''}
        >
          Crítico
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltroEstado('atencao')}
          className={filtroEstado === 'atencao' ? 'bg-warning text-white' : ''}
        >
          Atenção
        </Button>
      </div>

      {carregando ? (
        <div className="p-4 text-center text-muted">A carregar lotes…</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Lote
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Produto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Validade
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Tipo
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted">
                  Disponível
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Estado do lote
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Alerta
                </th>
              </tr>
            </thead>
            <tbody>
              {lotesFiltrados.map((lote) => {
                const classeAlerta: Record<
                  LoteValidade['estado_alerta'],
                  string
                > = {
                  vencido: 'bg-danger text-white',
                  critico: 'bg-red-600 text-white',
                  atencao: 'bg-warning text-white',
                  normal: 'bg-gray-100 text-gray-800',
                };

                return (
                  <tr
                    key={lote.id}
                    className={`border-b border-gray-100 ${lote.estado_alerta === 'vencido' ? 'bg-danger-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium">
                      {lote.internal_code}
                    </td>
                    <td className="px-4 py-3">{lote.product_name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted">
                      {lote.expiry_date ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {lote.expiry_type ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {lote.available_quantity} {lote.unit_code}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800">
                        {lote.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${classeAlerta[lote.estado_alerta]}`}
                      >
                        {lote.dias_para_vencimento === null
                          ? 'Sem validade'
                          : lote.dias_para_vencimento < 0
                            ? `Vencido há ${Math.abs(lote.dias_para_vencimento)} dias`
                            : lote.dias_para_vencimento === 0
                              ? 'Vence hoje'
                              : `Vence em ${lote.dias_para_vencimento} dias`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {lote.status !== 'blocked' && lote.available_quantity > 0 && (
                          <button
                            onClick={() => {
                              setLoteSelecionado(lote);
                              setAcao('bloquear');
                              setAbrirDialog(true);
                            }}
                            className="text-xs text-danger-600 hover:underline"
                          >
                            Bloquear
                          </button>
                        )}
                        {lote.expiry_type === 'best_before' && lote.available_quantity > 0 && (
                          <button
                            onClick={() => {
                              setLoteSelecionado(lote);
                              setAcao('avaliar');
                              setAbrirDialog(true);
                            }}
                            className="text-xs text-warning-600 hover:underline"
                          >
                            Avaliar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {lotesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    Nenhum lote encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {abrirDialog && loteSelecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-text mb-4">
              {acao === 'bloquear' ? 'Bloquear lote' : 'Avaliar lote'}
            </h2>
            <p className="text-sm text-muted mb-4">
              {loteSelecionado.internal_code}
            </p>
            {acao === 'bloquear' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Motivo
                  </label>
                  <Input
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Motivo do bloqueio"
                    required
                  />
                </div>
              </div>
            )}
            {acao === 'avaliar' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Notas da avaliação
                  </label>
                  <Input
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Observações (opcional)"
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setAbrirDialog(false);
                  setAcao(null);
                  setLoteSelecionado(null);
                  setMotivo('');
                  setNotas('');
                }}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={executarAcao}>
                {acao === 'bloquear' ? 'Confirmar bloqueio' : 'Confirmar avaliação'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
