import { connection } from 'next/server';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Badge } from '@/components/ui/badge';
import Formulario from '@/components/form/Formulario';
import BotaoAcao from '@/components/form/BotaoAcao';
import {
  listarAgregados,
  listarBeneficiarios,
} from '@/modules/beneficiarios/queries';
import {
  actionCriarAgregado,
  actionCriarBeneficiario,
  actionDesativarAgregado,
} from '@/modules/beneficiarios/actions';
import type {
  AgregadoInput,
  BeneficiarioInput,
} from '@/modules/beneficiarios/schemas';
import { formatDateTime } from '@/lib/formatting';

export const instant = false;


export default async function BeneficiariosPage() {
  await connection();
  const [agregados, beneficiarios] = await Promise.all([
    listarAgregados(),
    listarBeneficiarios(),
  ]);
  const agregadosAtivos = agregados.filter((a) => a.status !== 'inativo');

  return (
    <div className="space-y-8">
      <PageHeader titulo="Beneficiários" descricao="Agregados familiares e pessoas apoiadas." />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Agregados</h2>
        <Tabela
          cabecalhos={['Código', 'Pessoas', 'Freguesia', 'Estado', 'Criado em', '']}
          vazio="Ainda não há agregados."
          linhas={agregados.map((a) => [
            a.code,
            a.household_size != null ? String(a.household_size) : '—',
            a.parish ?? '—',
            <Badge key={a.id} variant={a.status === 'inativo' ? 'secondary' : 'success'}>
              {a.status}
            </Badge>,
            formatDateTime(a.created_at),
            a.status !== 'inativo' ? (
              <BotaoAcao
                key={a.id}
                acao={actionDesativarAgregado.bind(null, a.id)}
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
          titulo="Novo agregado"
          acao={actionCriarAgregado}
          botao="Criar agregado"
          campos={[
            { name: 'code', label: 'Código', required: true, placeholder: 'Ex.: AGG-001' },
            { name: 'household_size', label: 'Número de pessoas', type: 'number', min: 1, step: '1' },
            { name: 'parish', label: 'Freguesia', placeholder: 'opcional' },
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Beneficiários</h2>
        <Tabela
          cabecalhos={['Código', 'Nome', 'Agregado', 'Telefone', 'Email', 'Contacto principal', 'Estado']}
          vazio="Ainda não há beneficiários."
          linhas={beneficiarios.map((b) => [
            b.code,
            b.full_name ?? '—',
            b.household_code ?? '—',
            b.phone ?? '—',
            b.email ?? '—',
            b.is_primary_contact ? 'sim' : 'não',
            <Badge key={b.id} variant={b.status === 'inativo' ? 'secondary' : 'success'}>
              {b.status}
            </Badge>,
          ])}
        />
        <Formulario
          titulo="Novo beneficiário"
          acao={actionCriarBeneficiario}
          botao="Criar beneficiário"
          campos={[
            { name: 'code', label: 'Código', required: true, placeholder: 'Ex.: BEN-001' },
            {
              name: 'household_id',
              label: 'Agregado',
              type: 'select',
              required: true,
              options: agregadosAtivos.map((a) => ({ value: a.id, label: a.code })),
            },
            { name: 'full_name', label: 'Nome completo', placeholder: 'opcional' },
            { name: 'phone', label: 'Telefone', placeholder: 'opcional' },
            { name: 'email', label: 'Email', placeholder: 'opcional' },
            { name: 'is_primary_contact', label: 'Contacto principal', type: 'checkbox', placeholder: 'É o contacto principal' },
          ]}
        />
      </section>
    </div>
  );
}
