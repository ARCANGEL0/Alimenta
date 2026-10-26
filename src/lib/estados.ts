type Variante = 'success' | 'warning' | 'danger' | 'secondary';

const DOACAO: Record<string, [string, Variante]> = {
  pending: ['por inspecionar', 'secondary'],
  under_inspection: ['em inspeção', 'warning'],
  accepted: ['aceite', 'success'],
  partially_accepted: ['aceite em parte', 'success'],
  rejected: ['rejeitada', 'danger'],
};

const DISTRIBUICAO: Record<string, [string, Variante]> = {
  draft: ['rascunho', 'secondary'],
  preparing: ['em preparação', 'warning'],
  reserved: ['stock reservado', 'warning'],
  delivered: ['entregue', 'success'],
  cancelled: ['cancelada', 'danger'],
};

const LOTE: Record<string, [string, Variante]> = {
  available: ['disponível', 'success'],
  reserved: ['reservado', 'warning'],
  blocked: ['bloqueado', 'danger'],
  expired: ['vencido', 'danger'],
  depleted: ['esgotado', 'secondary'],
  disposed: ['descartado', 'secondary'],
};

const MOVIMENTO: Record<string, string> = {
  receipt: 'entrada',
  distribution: 'entrega',
  disposal: 'descarte',
  adjustment_in: 'ajuste +',
  adjustment_out: 'ajuste −',
  reservation_release: 'reserva libertada',
};

function de(mapa: Record<string, [string, Variante]>, estado: string) {
  const [label, variante] = mapa[estado] ?? [estado, 'secondary' as Variante];
  return { label, variante };
}

export const estadoDoacao = (s: string) => de(DOACAO, s);
export const estadoDistribuicao = (s: string) => de(DISTRIBUICAO, s);
export const estadoLote = (s: string) => de(LOTE, s);
export const tipoMovimento = (s: string) => MOVIMENTO[s] ?? s;
