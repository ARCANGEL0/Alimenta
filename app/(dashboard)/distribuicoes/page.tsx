import { connection } from 'next/server';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Badge } from '@/components/ui/badge';
import Formulario from '@/components/form/Formulario';
import BotaoAcao from '@/components/form/BotaoAcao';
import {
  listarDistribuicoes,
} from '@/modules/distribuicoes/queries';
import {
  actionCriarDistribuicao,
  actionConfirmarDistribuicao,
  actionCancelarDistribuicao,
} from '@/modules/distribuicoes/actions';
import { listarAgregados } from '@/modules/beneficiarios/queries';
import type { DistribuicaoInput } from '@/modules/distribuicoes/schemas';
import { estadoDistribuicao } from '@/lib/estados';
import { formatDate, formatDateTime } from '@/lib/formatting';

export const instant = false;


export default async function DistribuicoesPage() {
  await connection();
  const [distribuicoes, agregados] = await Promise.all([
    listarDistribuicoes(),
    listarAgregados(),
  ]);
  const agregadosAtivos = agregados.filter((a) => a.status !== 'inativo');

  return (
    <div className="space-y-6">
      <PageHeader titulo="Distribuições" descricao="Cabazes preparados e entregues a agregados." />
      <Tabela
        cabecalhos={['Referência', 'Agregado', 'Agendada para', 'Estado', 'Criada em', '']}
        vazio="Ainda não há distribuições. Cria a primeira em baixo."
        linhas={distribuicoes.map((d) => [
          <Link key={d.id} href={`/distribuicoes/${d.id}`} className="font-medium text-forest hover:underline">
            {d.reference}
          </Link>,
          d.household_code ?? '—',
          d.scheduled_at ? formatDate(d.scheduled_at) : '—',
          <Badge key={d.id} variant={estadoDistribuicao(d.status).variante}>
            {estadoDistribuicao(d.status).label}
          </Badge>,
          formatDateTime(d.created_at),
          <span key={`${d.id}-a`} className="flex gap-3">
            {d.status === 'reserved' && (
              <BotaoAcao
                acao={actionConfirmarDistribuicao.bind(null, d.id)}
                className="text-xs font-medium text-forest hover:underline"
              >
                confirmar entrega
              </BotaoAcao>
            )}
            {!['delivered', 'cancelled'].includes(d.status) && (
              <BotaoAcao
                acao={actionCancelarDistribuicao.bind(null, d.id)}
                className="text-xs font-medium text-danger hover:underline"
              >
                cancelar
              </BotaoAcao>
            )}
            <Link href={`/distribuicoes/${d.id}`} className="text-xs font-medium text-muted hover:underline">
              abrir
            </Link>
          </span>,
        ])}
      />
      <Formulario
        titulo="Nova distribuição"
        acao={actionCriarDistribuicao}
        botao="Criar distribuição"
        campos={[
          {
            name: 'household_id',
            label: 'Agregado',
            type: 'select',
            required: true,
            options: agregadosAtivos.map((a) => ({ value: a.id, label: a.code })),
          },
          { name: 'scheduled_at', label: 'Data agendada', type: 'date' },
          { name: 'notes', label: 'Notas', placeholder: 'opcional' },
        ]}
      />
    </div>
  );
}
