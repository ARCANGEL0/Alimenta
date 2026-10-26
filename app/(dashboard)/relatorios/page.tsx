import { connection } from 'next/server';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Card } from '@/components/ui/card';
import {
  obterTotalDoacoesPorDoador,
  obterTotalStockPorArmazem,
  obterIndicadoresPorCategoria,
} from '@/modules/dashboard/queries';
import { obterTotalDistribuicoesPorEstado } from '@/modules/distribuicoes/queries';
import { obterTotalDescartesPorMotivo } from '@/modules/desperdicio/queries';
import { obterContagemUsuariosPorFuncao } from '@/modules/usuarios/queries';
import { formatNumber } from '@/lib/formatting';
import { FUNCAO_LABELS, ESTADO_DISTRIBUICAO_LABELS, MOTIVO_DESCARTE_LABELS, rotulo } from '@/lib/rotulos';

export const instant = false;

export default async function RelatoriosPage() {
  await connection();
  const [
    doacoesPorDoador,
    stockPorArmazem,
    porCategoria,
    distPorEstado,
    descartesPorMotivo,
    usuariosPorFuncao,
  ] = await Promise.all([
    obterTotalDoacoesPorDoador(),
    obterTotalStockPorArmazem(),
    obterIndicadoresPorCategoria(),
    obterTotalDistribuicoesPorEstado(),
    obterTotalDescartesPorMotivo(),
    obterContagemUsuariosPorFuncao(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader titulo="Relatórios" descricao="Resumo real da atividade da sua armazém." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Doações por doador</h2>
          <Tabela
            cabecalhos={['Doador', 'Total']}
            vazio="Ainda sem doações registadas."
            linhas={doacoesPorDoador.map((r) => [r.doador, formatNumber(Number(r.total))])}
          />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Stock por armazém</h2>
          <Tabela
            cabecalhos={['Armazém', 'Total']}
            vazio="Sem stock registado."
            linhas={stockPorArmazem.map((r) => [r.armazem, formatNumber(Number(r.total))])}
          />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Lotes por categoria</h2>
          <Tabela
            cabecalhos={['Categoria', 'Lotes']}
            vazio="Sem lotes."
            linhas={porCategoria.map((r) => [r.categoria ?? 'Sem categoria', String(r.quantidade)])}
          />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Distribuições por estado</h2>
          <Tabela
            cabecalhos={['Estado', 'Total']}
            vazio="Sem distribuições."
            linhas={distPorEstado.map((r) => [rotulo(ESTADO_DISTRIBUICAO_LABELS, r.status), String(r.total)])}
          />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Descartes por motivo</h2>
          <Tabela
            cabecalhos={['Motivo', 'Total']}
            vazio="Sem descartes."
            linhas={descartesPorMotivo.map((r) => [rotulo(MOTIVO_DESCARTE_LABELS, r.motivo), String(r.total)])}
          />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Utilizadores por função</h2>
          <Tabela
            cabecalhos={['Função', 'Total']}
            vazio="Sem utilizadores."
            linhas={usuariosPorFuncao.map((r) => [rotulo(FUNCAO_LABELS, r.funcao), String(r.total)])}
          />
        </Card>
      </div>
    </div>
  );
}
