export type Lote = {
  id: string;
  internal_code: string;
  product_id: string | null;
  product_name: string | null;
  donation_item_id: string | null;
  supplier_batch_code: string | null;
  warehouse_id: string | null;
  warehouse_name: string | null;
  storage_location_id: string | null;
  storage_location_code: string | null;
  received_at: string;
  expiry_date: string | null;
  expiry_type: string | null;
  initial_quantity: number;
  on_hand_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  unit_code: string;
  status: string;
};

export type MovimentoStock = {
  id: string;
  batch_id: string;
  movement_type: string;
  quantity: number;
  unit_code: string;
  source_type: string | null;
  source_id: string | null;
  reason: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
};

export type LoteParaCriar = {
  internal_code: string;
  product_id: string;
  warehouse_id: string;
  storage_location_id?: string | null;
  received_at: string;
  expiry_date?: string | null;
  expiry_type?: string | null;
  initial_quantity: number;
  unit_code: string;
};

export type AjusteStock = {
  batch_id: string;
  movement_type: 'adjustment_in' | 'adjustment_out';
  quantity: number;
  reason: string;
};

export type LoteParaAtualizar = {
  status?: string;
  warehouse_id?: string | null;
  storage_location_id?: string | null;
};
