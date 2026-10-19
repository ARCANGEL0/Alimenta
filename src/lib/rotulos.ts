export const MOTIVO_DESCARTE_LABELS: Record<string, string> = {
  expired: 'Validade expirada',
  damaged_packaging: 'Embalagem danificada',
  improper_storage: 'Armazenamento inadequado',
  spoiled: 'Deteriorado',
  preventive_recall: 'Recolha preventiva',
  other: 'Outro',
};

export const FUNCAO_LABELS: Record<string, string> = {
  admin: 'Administrador',
  operator: 'Operador',
  social_worker: 'Assistente social',
};

export const ESTADO_LOTE_LABELS: Record<string, string> = {
  available: 'Disponível',
  reserved: 'Reservado',
  blocked: 'Bloqueado',
  expired: 'Vencido',
  depleted: 'Esgotado',
  disposed: 'Descarte',
};

export const ESTADO_DISTRIBUICAO_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  preparing: 'Em preparação',
  reserved: 'Stock reservado',
  delivered: 'Entregue',
  cancelled: 'Cancelada',
};

export const ESTADO_DOACAO_LABELS: Record<string, string> = {
  pending: 'Por inspecionar',
  under_inspection: 'Em inspeção',
  accepted: 'Aceite',
  partially_accepted: 'Aceite em parte',
  rejected: 'Rejeitada',
};

export const TIPO_MOVIMENTO_LABELS: Record<string, string> = {
  receipt: 'Entrada',
  distribution: 'Entrega',
  disposal: 'Descarte',
  adjustment_in: 'Ajuste +',
  adjustment_out: 'Ajuste –',
  reservation_release: 'Reserva libertada',
};

export function rotulo(mapa: Record<string, string>, chave: string) {
  return mapa[chave] ?? chave;
}
