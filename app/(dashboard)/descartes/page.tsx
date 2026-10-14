import { connection } from 'next/server';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import Formulario from '@/components/form/Formulario';
import { listarDescartes } from '@/modules/desperdicio/queries';
import { actionCriarDescarte } from '@/modules/desperdicio/actions';
import { MOTIVOS_DESCARTE, type DescarteInput } from '@/modules/desperdicio/schemas';
import { listarLotes } from '@/modules/inventario/queries';
import { formatDateTime, formatNumber } from '@/lib/formatting';

export const instant = false;


export default async function DescartesPage() {
  await connection();
  const [descartes, lotes] = await Promise.all([
    listarDescartes(),
    listarLotes(),
  ]);
  const lotesComStock = lotes.filter((l) => Number(l.available_quantity) > 0);

  return (
    <div className="space-y-6">
      <PageHeader titulo="Descartes" descricao="Saídas por validade, dano ou recolha." />
      <Tabela
        cabecalhos={['Data', 'Lote', 'Produto', 'Quantidade', 'Motivo', 'Destino', 'Por']}
        vazio="Ainda não há descartes."
        linhas={descartes.map((d) => [
          formatDateTime(d.created_at),
          d.batch_internal_code ?? '—',
          d.product_name ?? '—',
          `${formatNumber(Number(d.quantity))} ${d.unit_code}`,
          (() => { const m = MOTIVOS_DESCARTE.find((x) => x.code === d.reason_code)?.label ?? d.reason_code; return d.reason_notes ? `${m} — ${d.reason_notes}` : m; })(),
          d.destination ?? '—',
          d.created_by_name ?? '—',
        ])}
      />
      <Formulario
        titulo="Registar descarte"
        acao={actionCriarDescarte}
        botao="Registar descarte"
        campos={[
          {
            name: 'batch_id',
            label: 'Lote',
            type: 'select',
            required: true,
            options: lotesComStock.map((l) => ({
              value: l.id,
              label: `${l.internal_code} (${l.product_name ?? '—'}) — disp. ${formatNumber(Number(l.available_quantity))} ${l.unit_code}`,
            })),
          },
          { name: 'quantity', label: 'Quantidade', type: 'number', required: true, min: 0.001, step: '0.001' },
          {
            name: 'reason_code',
            label: 'Motivo',
            type: 'select',
            required: true,
            options: MOTIVOS_DESCARTE.map((m) => ({ value: m.code, label: m.label })),
          },
          { name: 'reason_notes', label: 'Descrição (se motivo "outro")', placeholder: 'opcional' },
          { name: 'destination', label: 'Destino', placeholder: 'Ex.: compostagem' },
        ]}
      />
    </div>
  );
}
