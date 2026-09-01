export type Distribuicao = {
  id: string;
  reference: string;
  household_id: string | null;
  household_code: string | null;
  status: string;
  scheduled_at: string | null;
  delivered_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  delivered_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ItemDistribuicao = {
  id: string;
  distribution_id: string;
  product_id: string | null;
  product_name: string | null;
  quantity_requested: number | null;
  quantity_reserved: number;
  unit_code: string | null;
};

export type ReservaStock = {
  id: string;
  batch_id: string;
  batch_internal_code: string | null;
  quantity: number;
  status: string;
};

export type DistribuicaoParaCriar = {
  household_id: string;
  scheduled_at: string | null;
  notes?: string | null;
};

export type ItemDistribuicaoParaCriar = {
  distribution_id: string;
  product_id: string | null;
  quantity_requested: number;
  unit_code: string | null;
};

export type ReservarStockInput = {
  distribution_item_id: string;
  batch_id: string;
  quantity: number;
};

export type DistribuicaoParaAtualizar = {
  status?: string;
  notes?: string | null;
};
