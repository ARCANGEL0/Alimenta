export type Doador = {
  id: string;
  code: string;
  name: string;
  donor_type: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Doacao = {
  id: string;
  reference: string;
  donor_id: string | null;
  donor_name: string | null;
  received_at: string;
  status: string;
  received_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DoacaoItem = {
  id: string;
  donation_id: string;
  product_id: string | null;
  product_name: string | null;
  quantity_received: number;
  quantity_accepted: number;
  quantity_rejected: number;
  unit_code: string;
  supplier_batch_code: string | null;
  expiry_date: string | null;
  expiry_type: string | null;
  inspection_status: string | null;
  inspection_notes: string | null;
};

export type DoadorParaCriar = {
  code: string;
  name: string;
  donor_type?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
};

export type DoacaoParaCriar = {
  donor_id: string;
  received_at: string;
  notes?: string | null;
};

export type DoacaoItemParaCriar = {
  donation_id: string;
  product_id: string | null;
  quantity_received: number;
  unit_code: string;
  supplier_batch_code?: string | null;
  expiry_date?: string | null;
  expiry_type?: string | null;
};

export type DoadorParaAtualizar = {
  name?: string;
  donor_type?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

export type DoacaoParaAtualizar = {
  status?: string;
  notes?: string | null;
};
