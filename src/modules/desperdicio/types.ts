export type Descarte = {
  id: string;
  batch_id: string;
  batch_internal_code: string | null;
  product_name: string | null;
  quantity: number;
  unit_code: string;
  reason_code: string;
  reason_notes: string | null;
  destination: string | null;
  disposed_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
};

export type DescarteParaCriar = {
  batch_id: string;
  quantity: number;
  reason_code: string;
  reason_notes?: string | null;
  destination?: string | null;
};
