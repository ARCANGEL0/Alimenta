import { connection } from 'next/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Formulario from '@/components/form/Formulario';
import BotaoAcao from '@/components/form/BotaoAcao';
import { listarDoacoes, listarItensDaDoacao } from '@/modules/doacoes/queries';
import {
  actionAdicionarItemDoacao,
  actionInspecionarItem,
  actionFecharInspecao,
} from '@/modules/doacoes/actions';
import { listarProdutosAtivos } from '@/modules/catalogo/queries';
import { estadoDoacao } from '@/lib/estados';
import { formatDate, formatDateTime, formatNumber } from '@/lib/formatting';

export const instant = false;

export default async function DetalheDoacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const [doacoes, itens, produtos] = await Promise.all([
    listarDoacoes(),
    listarItensDaDoacao(id),
    listarProdutosAtivos(),
  ]);
  const doacao = doacoes.find((d) => d.id === id);
  if (!doacao) notFound();

  const e = estadoDoacao(doacao.status);
  const aberta = doacao.status === 'pending' || doacao.status === 'under_inspection';
  const porInspecionar = itens.filter((it) => !it.inspection_status).length;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Doação ${doacao.reference}`}
        descricao={`${doacao.donor_name ?? 'Doador desconhecido'} — recebida em ${formatDate(doacao.received_at)}`}
      />
      <Card className="flex flex-wrap items-center gap-3 p-5">
        <Badge variant={e.variante}>{e.label}</Badge>
        <span className="text-sm text-muted">Criada em {formatDateTime(doacao.created_at)}</span>
        {doacao.notes && <span className="text-sm text-muted">· {doacao.notes}</span>}
        <span className="ml-auto flex items-center gap-4">
          {aberta && itens.length > 0 && porInspecionar === 0 && (
            <BotaoAcao
              acao={actionFecharInspecao.bind(null, doacao.id)}
              className="btn-primary !py-2 text-xs"
            >
              Fechar inspeção e criar lotes
            </BotaoAcao>
          )}
          {aberta && porInspecionar > 0 && (
            <span className="text-xs text-muted">{porInspecionar} item(ns) por inspecionar</span>
          )}
          <Link href="/doacoes" className="text-sm font-medium text-forest hover:underline">
            ← todas as doações
          </Link>
        </span>
      </Card>

      <h2 className="text-sm font-semibold text-ink">Itens recebidos</h2>
      <Tabela
        cabecalhos={['Produto', 'Recebido', 'Aceite', 'Rejeitado', 'Lote fornecedor', 'Validade', 'Inspeção']}
        vazio="Esta doação ainda não tem itens. Adiciona em baixo."
        linhas={itens.map((it) => [
          it.product_name ?? '—',
          `${formatNumber(Number(it.quantity_received))} ${it.unit_code}`,
          formatNumber(Number(it.quantity_accepted)),
          formatNumber(Number(it.quantity_rejected)),
          it.supplier_batch_code ?? '—',
          it.expiry_date ? formatDate(it.expiry_date) : '—',
          it.inspection_status ? (
            <Badge key={it.id} variant={it.inspection_status === 'accepted' ? 'success' : 'danger'}>
              {it.inspection_status === 'accepted' ? 'aceite' : 'rejeitado'}
            </Badge>
          ) : aberta ? (
            <span key={it.id} className="flex gap-3">
              <BotaoAcao
                acao={actionInspecionarItem.bind(null, it.id, 'aceitar')}
                className="text-xs font-medium text-forest hover:underline"
              >
                aceitar
              </BotaoAcao>
              <BotaoAcao
                acao={actionInspecionarItem.bind(null, it.id, 'rejeitar')}
                className="text-xs font-medium text-danger hover:underline"
              >
                rejeitar
              </BotaoAcao>
            </span>
          ) : (
            '—'
          ),
        ])}
      />

      {aberta && (
        <Formulario
          titulo="Adicionar item à doação"
          acao={actionAdicionarItemDoacao.bind(null, id)}
          botao="Adicionar item"
          campos={[
            {
              name: 'product_id',
              label: 'Produto',
              type: 'select',
              required: true,
              options: produtos.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })),
            },
            { name: 'quantity_received', label: 'Quantidade recebida', type: 'number', required: true, min: 0.001, step: '0.001' },
            {
              name: 'unit_code',
              label: 'Unidade',
              type: 'select',
              required: true,
              options: [
                { value: 'kg', label: 'kg' },
                { value: 'un', label: 'un' },
                { value: 'l', label: 'l' },
              ],
            },
            { name: 'supplier_batch_code', label: 'Lote do fornecedor', placeholder: 'opcional' },
            { name: 'expiry_date', label: 'Validade', type: 'date' },
            {
              name: 'expiry_type',
              label: 'Tipo de validade',
              type: 'select',
              options: [
                { value: 'use_by', label: 'Consumir até' },
                { value: 'best_before', label: 'De preferência antes de' },
                { value: 'none', label: 'Sem validade' },
              ],
            },
          ]}
        />
      )}
    </div>
  );
}
