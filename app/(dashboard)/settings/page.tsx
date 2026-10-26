import { connection } from 'next/server';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Card } from '@/components/ui/card';
import Formulario from '@/components/form/Formulario';
import { query } from '@/lib/db/pool';
import { obterLimiaresValidade } from '@/modules/validade/queries';
import { actionAtualizarLimiaresValidade } from '@/modules/validade/actions';
import type { LimiaresInput } from '@/modules/validade/schemas';
import { formatDateTime } from '@/lib/formatting';

export const instant = false;

type SettingRow = { key: string; value: unknown; updated_at: string };

export default async function SettingsPage() {
  await connection();
  const [settingsResult, limiares] = await Promise.all([
    query(`select key, value, updated_at from settings order by key`),
    obterLimiaresValidade(),
  ]);
  const settings = settingsResult.rows as SettingRow[];

  return (
    <div className="space-y-8">
      <PageHeader
        titulo="Definições"
        descricao="Configuração geral da aplicação da sua armazém."
      />

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Limiares de alerta de validade</h2>
        <p className="text-sm text-muted mb-4">
          Defina quantos dias antes da validade um lote é considerado crítico
          ou que precisa de atenção.
        </p>
        <Formulario
          titulo="Editar limiares"
          acao={actionAtualizarLimiaresValidade}
          botao="Guardar limiares"
          campos={[
            {
              name: 'expired_days',
              label: 'Vencido (dias)',
              type: 'number',
              required: true,
              min: 0,
              step: '1',
            },
            {
              name: 'critical_days',
              label: 'Crítico (dias)',
              type: 'number',
              required: true,
              min: 0,
              step: '1',
            },
            {
              name: 'attention_days',
              label: 'Atenção (dias)',
              type: 'number',
              required: true,
              min: 0,
              step: '1',
            },
          ]}
        />
        <p className="text-sm text-muted mt-3">
          Atuais: vencido{' '}
          <span className="font-semibold text-ink">{limiares.expired_days}d</span>{' · '}
          crítico{' '}
          <span className="font-semibold text-ink">{limiares.critical_days}d</span>{' · '}
          atenção{' '}
          <span className="font-semibold text-ink">{limiares.attention_days}d</span>
        </p>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Valores guardados</h2>
        <Tabela
          cabecalhos={['Chave', 'Valor', 'Atualizado em']}
          vazio="Sem definições guardadas."
          linhas={settings.map((s) => [
            s.key,
            typeof s.value === 'string' ? s.value : JSON.stringify(s.value),
            formatDateTime(s.updated_at),
          ])}
        />
      </Card>
    </div>
  );
}
