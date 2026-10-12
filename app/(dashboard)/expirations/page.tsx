import { connection } from 'next/server';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Badge } from '@/components/ui/badge';
import Formulario from '@/components/form/Formulario';
import BotaoAcao from '@/components/form/BotaoAcao';
import {
  listarLotesValidade,
  obterContagemPorEstadoAlerta,
} from '@/modules/validade/queries';
import {
  actionBloquearLote,
  actionAvaliarLote,
} from '@/modules/validade/actions';
import type { LoteBloquearInput, LoteAvaliarInput } from '@/modules/validade/schemas';
import { estadoLote } from '@/lib/estados';
import { formatDate, formatNumber } from '@/lib/formatting';

export const instant = false;


const variantByEstado: Record<string, 'danger' | 'warning' | 'secondary' | 'success'> = {
  vencido: 'danger',
  critico: 'warning',
  atencao: 'secondary',
  normal: 'success',
};

export default async function ExpirationsPage() {
  await connection();
  const [lotes, contagens] = await Promise.all([
    listarLotesValidade(),
    obterContagemPorEstadoAlerta(),
  ]);
  const totalPorEstado = Object.fromEntries(contagens.map((c) => [c.estado, c.total]));

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Validades"
        descricao={`Vencidos: ${totalPorEstado.vencido ?? 0} · Críticos: ${totalPorEstado.critico ?? 0} · Atenção: ${totalPorEstado.atencao ?? 0}`}
      />
      <Tabela
        cabecalhos={['Lote', 'Produto', 'Validade', 'Disponível', 'Alerta', 'Situação', '']}
        vazio="Não há lotes registados."
        linhas={lotes.map((l) => [
          l.internal_code,
          l.product_name ?? '—',
          l.expiry_date ? formatDate(l.expiry_date) : 'sem validade',
          `${formatNumber(Number(l.available_quantity))} ${l.unit_code}`,
          <Badge key={l.id} variant={variantByEstado[l.estado_alerta]}>
            {l.estado_alerta === 'vencido'
              ? `vencido há ${Math.abs(l.dias_para_vencimento ?? 0)}d`
              : l.estado_alerta === 'critico'
                ? `crítico (${l.dias_para_vencimento}d)`
                : l.estado_alerta === 'atencao'
                  ? `atenção (${l.dias_para_vencimento}d)`
                  : 'normal'}
          </Badge>,
          <Badge key={`${l.id}-s`} variant={estadoLote(l.status).variante}>
            {estadoLote(l.status).label}
          </Badge>,
          l.status === 'available' ? (
            <span key={l.id} className="flex gap-3">
              <BotaoAcao
                acao={actionAvaliarLote.bind(null, {
                    batch_id: l.id,
                    avaliacao: 'imapto',
                    notas: 'Vencido ou em risco, bloqueado na revisão de validades.',
                  } as LoteAvaliarInput)}
                className="text-xs font-medium text-danger hover:underline"
              >
                marcar imapto
              </BotaoAcao>
            </span>
          ) : (
            '—'
          ),
        ])}
      />
      <Formulario
        titulo="Bloquear lote manualmente"
        acao={actionBloquearLote}
        botao="Bloquear"
        campos={[
          {
            name: 'batch_id',
            label: 'Lote',
            type: 'select',
            required: true,
            options: lotes
              .filter((l) => l.status === 'available')
              .map((l) => ({
                value: l.id,
                label: `${l.internal_code} (${l.product_name ?? '—'})`,
              })),
          },
          { name: 'motivo', label: 'Motivo', required: true, placeholder: 'Ex.: embalagem danificada' },
        ]}
      />
    </div>
  );
}
