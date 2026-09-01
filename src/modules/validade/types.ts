export type LoteValidade = {
  id: string;
  internal_code: string;
  product_name: string | null;
  expiry_date: string | null;
  expiry_type: string | null;
  on_hand_quantity: number;
  available_quantity: number;
  unit_code: string;
  status: string;
  dias_para_vencimento: number | null;
  estado_alerta: 'vencido' | 'critico' | 'atencao' | 'normal';
};

export type LoteParaBloquear = {
  batch_id: string;
  motivo: string;
};

export type LoteParaAvaliar = {
  batch_id: string;
  avaliacao: 'apto' | 'imapto';
  notas: string | null;
};

export type LimiaresValidade = {
  expired_days: number;
  critical_days: number;
  attention_days: number;
};
