import { connection } from 'next/server';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Badge } from '@/components/ui/badge';
import Formulario from '@/components/form/Formulario';
import { listarDoacoes, listarDoadoresAtivos } from '@/modules/doacoes/queries';
import { actionCriarDoacao } from '@/modules/doacoes/actions';
import { estadoDoacao } from '@/lib/estados';
import { formatDate, formatDateTime } from '@/lib/formatting';

export const instant = false;

export default async function DoacoesPage() {
  await connection();
  const [doacoes, doadores] = await Promise.all([
    listarDoacoes(),
    listarDoadoresAtivos(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader titulo="Doações" descricao="Entradas de comida. Abre uma doação para inspecionar os itens e criar os lotes." />
      <Tabela
        cabecalhos={['Referência', 'Doador', 'Recebida em', 'Estado', 'Criada em', '']}
        vazio="Ainda não há doações. Regista a primeira em baixo."
        linhas={doacoes.map((d) => {
          const e = estadoDoacao(d.status);
          const aberta = d.status === 'pending' || d.status === 'under_inspection';
          return [
            <Link key={d.id} href={`/doacoes/${d.id}`} className="font-medium text-forest hover:underline">
              {d.reference}
            </Link>,
            d.donor_name ?? '—',
            formatDate(d.received_at),
            <Badge key={`${d.id}-e`} variant={e.variante}>{e.label}</Badge>,
            formatDateTime(d.created_at),
            <Link key={`${d.id}-a`} href={`/doacoes/${d.id}`} className="text-xs font-medium text-forest hover:underline">
              {aberta ? 'inspecionar' : 'ver itens'}
            </Link>,
          ];
        })}
      />
      <Formulario
        titulo="Nova doação"
        acao={actionCriarDoacao}
        botao="Registar doação"
        campos={[
          {
            name: 'donor_id',
            label: 'Doador',
            type: 'select',
            required: true,
            options: doadores.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
          },
          { name: 'received_at', label: 'Data de receção', type: 'date', required: true },
          { name: 'notes', label: 'Notas', placeholder: 'opcional' },
        ]}
      />
    </div>
  );
}
