import { connection } from 'next/server';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Badge } from '@/components/ui/badge';
import Formulario from '@/components/form/Formulario';
import BotaoAcao from '@/components/form/BotaoAcao';
import { listarDoadores } from '@/modules/doacoes/queries';
import {
  actionCriarDoador,
  actionDesativarDoador,
} from '@/modules/doacoes/actions';
import { formatDateTime } from '@/lib/formatting';

export const instant = false;


export default async function DoadoresPage() {
  await connection();
  const doadores = await listarDoadores();

  return (
    <div className="space-y-6">
      <PageHeader titulo="Doadores" descricao="Quem nos entrega comida." />
      <Tabela
        cabecalhos={['Código', 'Nome', 'Tipo', 'Email', 'Telefone', 'Estado', '']}
        vazio="Ainda não há doadores."
        linhas={doadores.map((d) => [
          d.code,
          d.name,
          d.donor_type ?? '—',
          d.email ?? '—',
          d.phone ?? '—',
          <Badge key={d.id} variant={d.is_active ? 'success' : 'secondary'}>
            {d.is_active ? 'ativo' : 'inativo'}
          </Badge>,
          d.is_active ? (
            <BotaoAcao
              key={d.id}
              acao={actionDesativarDoador.bind(null, d.id)}
              className="text-xs font-medium text-danger hover:underline"
            >
              desativar
            </BotaoAcao>
          ) : (
            '—'
          ),
        ])}
      />
      <Formulario
        titulo="Novo doador"
        acao={actionCriarDoador}
        botao="Criar doador"
        campos={[
          { name: 'code', label: 'Código', required: true, placeholder: 'Ex.: DOA-001' },
          { name: 'name', label: 'Nome', required: true, placeholder: 'Ex.: Mercearia Central' },
          {
            name: 'donor_type',
            label: 'Tipo',
            type: 'select',
            options: [
              { value: 'empresa', label: 'Empresa' },
              { value: 'particular', label: 'Particular' },
              { value: 'instituicao', label: 'Instituição' },
            ],
          },
          { name: 'email', label: 'Email', type: 'text', placeholder: 'opcional' },
          { name: 'phone', label: 'Telefone', placeholder: 'opcional' },
          { name: 'address', label: 'Morada', placeholder: 'opcional' },
          { name: 'notes', label: 'Notas', placeholder: 'opcional' },
        ]}
      />
    </div>
  );
}
