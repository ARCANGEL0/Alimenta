import { connection } from 'next/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Formulario from '@/components/form/Formulario';
import BotaoAcao from '@/components/form/BotaoAcao';
import {
  listarDistribuicoes,
  listarItensDaDistribuicao,
} from '@/modules/distribuicoes/queries';
import {
  actionAdicionarItemDistribuicao,
  actionReservarStock,
  actionConfirmarDistribuicao,
  actionCancelarDistribuicao,
} from '@/modules/distribuicoes/actions';
import { listarProdutosAtivos } from '@/modules/catalogo/queries';
import { listarLotes } from '@/modules/inventario/queries';
import type {
  ItemDistribuicaoInput,
  ReservarStockInput,
} from '@/modules/distribuicoes/schemas';
import { estadoDistribuicao } from '@/lib/estados';
import { formatDate, formatDateTime, formatNumber } from '@/lib/formatting';

export const instant = false;


export default async function DetalheDistribuicaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const [distribuicoes, itens, produtos, lotes] = await Promise.all([
    listarDistribuicoes(),
    listarItensDaDistribuicao(id),
    listarProdutosAtivos(),
    listarLotes(),
  ]);
  const dist = distribuicoes.find((d) => d.id === id);
  if (!dist) notFound();

  const lotesDisponiveis = lotes.filter((l) => Number(l.available_quantity) > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Distribuição ${dist.reference}`}
        descricao={`Agregado ${dist.household_code ?? '—'}${dist.scheduled_at ? ` · agendada para ${formatDate(dist.scheduled_at)}` : ''}`}
      />
      <Card className="flex flex-wrap items-center gap-3 p-5">
        <Badge variant={estadoDistribuicao(dist.status).variante}>
          {estadoDistribuicao(dist.status).label}
        </Badge>
        <span className="text-sm text-muted">Criada em {formatDateTime(dist.created_at)}</span>
        {dist.notes && <span className="text-sm text-muted">· {dist.notes}</span>}
        <span className="ml-auto flex gap-3">
          {dist.status === 'reserved' && (
            <BotaoAcao
              acao={actionConfirmarDistribuicao.bind(null, dist.id)}
              className="text-sm font-medium text-forest hover:underline"
            >
              confirmar entrega
            </BotaoAcao>
          )}
          {!['delivered', 'cancelled'].includes(dist.status) && (
            <BotaoAcao
              acao={actionCancelarDistribuicao.bind(null, dist.id)}
              className="text-sm font-medium text-danger hover:underline"
            >
              cancelar
            </BotaoAcao>
          )}
          <Link href="/distribuicoes" className="text-sm font-medium text-muted hover:underline">
            ← distribuições
          </Link>
        </span>
      </Card>

      <h2 className="text-sm font-semibold text-ink">Itens do cabaz</h2>
      <Tabela
        cabecalhos={['Produto', 'Qtd. pedida', 'Qtd. reservada', 'Un.']}
        vazio="Cabaz vazio. Adiciona itens em baixo."
        linhas={itens.map((it) => [
          it.product_name ?? '—',
          it.quantity_requested != null ? formatNumber(Number(it.quantity_requested)) : '—',
          formatNumber(Number(it.quantity_reserved)),
          it.unit_code ?? '—',
        ])}
      />

      {dist.status !== 'delivered' && dist.status !== 'cancelled' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Formulario
            titulo="Adicionar item ao cabaz"
            acao={actionAdicionarItemDistribuicao.bind(null, id)}
            botao="Adicionar item"
            campos={[
              {
                name: 'product_id',
                label: 'Produto',
                type: 'select',
                options: produtos.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })),
              },
              { name: 'quantity_requested', label: 'Quantidade pedida', type: 'number', required: true, min: 0, step: '0.001' },
              {
                name: 'unit_code',
                label: 'Unidade',
                type: 'select',
                options: [
                  { value: 'kg', label: 'kg' },
                  { value: 'un', label: 'un' },
                  { value: 'l', label: 'l' },
                ],
              },
            ]}
          />
          <Formulario
            titulo="Reservar stock num lote"
            acao={actionReservarStock}
            botao="Reservar"
            campos={[
              {
                name: 'distribution_item_id',
                label: 'Item do cabaz',
                type: 'select',
                required: true,
                options: itens.map((it) => ({
                  value: it.id,
                  label: `${it.product_name ?? '—'} (pedido ${it.quantity_requested ?? 0})`,
                })),
              },
              {
                name: 'batch_id',
                label: 'Lote',
                type: 'select',
                required: true,
                options: lotesDisponiveis.map((l) => ({
                  value: l.id,
                  label: `${l.internal_code} — disp. ${formatNumber(Number(l.available_quantity))} ${l.unit_code}`,
                })),
              },
              { name: 'quantity', label: 'Quantidade a reservar', type: 'number', required: true, min: 0.001, step: '0.001' },
            ]}
          />
        </div>
      )}
    </div>
  );
}
