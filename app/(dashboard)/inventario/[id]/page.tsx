import { connection } from 'next/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Formulario from '@/components/form/Formulario';
import {
  listarLotes,
  listarMovimentosDoLote,
} from '@/modules/inventario/queries';
import { actionAjusteStockUtilizador } from '@/modules/inventario/actions';
import type { AjusteStockInput } from '@/modules/inventario/schemas';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import { estadoLote, tipoMovimento } from '@/lib/estados';
import { formatDate, formatDateTime, formatNumber } from '@/lib/formatting';

export const instant = false;


export default async function DetalheLotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const sessao = await verificarSessao();
  const [lotes, movimentos] = await Promise.all([
    listarLotes(),
    listarMovimentosDoLote(id),
  ]);
  const lote = lotes.find((l) => l.id === id);
  if (!lote) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Lote ${lote.internal_code}`}
        descricao={`${lote.product_name ?? '—'} · ${lote.warehouse_name ?? '—'}${lote.storage_location_code ? ` · ${lote.storage_location_code}` : ''}`}
      />
      <Card className="flex flex-wrap items-center gap-4 p-5">
        <Badge variant={estadoLote(lote.status).variante}>
          {estadoLote(lote.status).label}
        </Badge>
        <span className="text-sm text-muted">Em stock: <strong className="text-ink">{formatNumber(Number(lote.on_hand_quantity))} {lote.unit_code}</strong></span>
        <span className="text-sm text-muted">Reservado: <strong className="text-ink">{formatNumber(Number(lote.reserved_quantity))}</strong></span>
        <span className="text-sm text-muted">Disponível: <strong className="text-ink">{formatNumber(Number(lote.available_quantity))}</strong></span>
        <span className="text-sm text-muted">Validade: {lote.expiry_date ? formatDate(lote.expiry_date) : '—'}</span>
        <Link href="/inventario" className="ml-auto text-sm font-medium text-forest hover:underline">
          ← inventário
        </Link>
      </Card>

      <h2 className="text-sm font-semibold text-ink">Movimentos de stock</h2>
      <Tabela
        cabecalhos={['Data', 'Tipo', 'Quantidade', 'Un.', 'Motivo', 'Por']}
        vazio="Sem movimentos neste lote."
        linhas={movimentos.map((m) => [
          formatDateTime(m.created_at),
          tipoMovimento(m.movement_type),
          formatNumber(Number(m.quantity)),
          m.unit_code,
          m.reason ?? '—',
          m.created_by_name ?? '—',
        ])}
      />

      {lote.status === 'available' && (
        <Formulario
          titulo="Ajuste de stock"
          acao={actionAjusteStockUtilizador.bind(null, sessao.userId, lote.id)}
          botao="Registar ajuste"
          campos={[
            {
              name: 'movement_type',
              label: 'Tipo',
              type: 'select',
              required: true,
              options: [
                { value: 'adjustment_in', label: 'Entrada (ajuste +)' },
                { value: 'adjustment_out', label: 'Saída (ajuste -)' },
              ],
            },
            { name: 'quantity', label: 'Quantidade', type: 'number', required: true, min: 0.001, step: '0.001' },
            { name: 'reason', label: 'Motivo', required: true, placeholder: 'Ex.: conferencia de inventario' },
          ]}
        />
      )}
    </div>
  );
}
