import { connection } from 'next/server';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Badge } from '@/components/ui/badge';
import Formulario from '@/components/form/Formulario';
import { listarLotes, listarArmazens, listarLocalizacoes } from '@/modules/inventario/queries';
import { actionCriarLote } from '@/modules/inventario/actions';
import { listarProdutosAtivos } from '@/modules/catalogo/queries';
import type { LoteInput } from '@/modules/inventario/schemas';
import { estadoLote } from '@/lib/estados';
import { formatDate, formatNumber } from '@/lib/formatting';

export const instant = false;


export default async function InventarioPage() {
  await connection();
  const [lotes, armazens, localizacoes, produtos] = await Promise.all([
    listarLotes(),
    listarArmazens(),
    listarLocalizacoes(),
    listarProdutosAtivos(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader titulo="Inventário" descricao="Lotes em stock, por armazém." />
      <Tabela
        cabecalhos={['Código', 'Produto', 'Armazém', 'Local', 'Em stock', 'Reservado', 'Disponível', 'Un.', 'Validade', 'Estado']}
        vazio="Ainda não há lotes. Cria o primeiro em baixo."
        linhas={lotes.map((l) => [
          <Link key={l.id} href={`/inventario/${l.id}`} className="font-medium text-forest hover:underline">
            {l.internal_code}
          </Link>,
          l.product_name ?? '—',
          l.warehouse_name ?? '—',
          l.storage_location_code ?? '—',
          formatNumber(Number(l.on_hand_quantity)),
          formatNumber(Number(l.reserved_quantity)),
          <span key={`${l.id}-a`} className="font-medium">{formatNumber(Number(l.available_quantity))}</span>,
          l.unit_code,
          l.expiry_date ? formatDate(l.expiry_date) : '—',
          <Badge key={l.id} variant={estadoLote(l.status).variante}>
            {estadoLote(l.status).label}
          </Badge>,
        ])}
      />
      <Formulario
        titulo="Novo lote"
        acao={actionCriarLote}
        botao="Criar lote"
        campos={[
          { name: 'internal_code', label: 'Código interno', required: true, placeholder: 'Ex.: LOTE-001' },
          {
            name: 'product_id',
            label: 'Produto',
            type: 'select',
            required: true,
            options: produtos.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })),
          },
          {
            name: 'warehouse_id',
            label: 'Armazém',
            type: 'select',
            required: true,
            options: armazens.map((w) => ({ value: w.id, label: w.name })),
          },
          {
            name: 'storage_location_id',
            label: 'Localização',
            type: 'select',
            options: localizacoes.map((s) => ({ value: s.id, label: s.code })),
          },
          { name: 'received_at', label: 'Data de receção', type: 'date', required: true },
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
          { name: 'initial_quantity', label: 'Quantidade inicial', type: 'number', required: true, min: 0, step: '0.001' },
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
        ]}
      />
    </div>
  );
}
