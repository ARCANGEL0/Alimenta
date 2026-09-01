export type Agregado = {
  id: string;
  code: string;
  household_size: number | null;
  parish: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Beneficiario = {
  id: string;
  code: string;
  household_id: string | null;
  household_code: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  is_primary_contact: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Necessidade = {
  id: string;
  beneficiary_id: string;
  need_type: string | null;
  value: string | null;
  notes: string | null;
  created_at: string;
};

export type AgregadoParaCriar = {
  code: string;
  household_size?: number | null;
  parish?: string | null;
  status?: string | null;
};

export type BeneficiarioParaCriar = {
  code: string;
  household_id: string;
  full_name: string | null;
  phone?: string | null;
  email?: string | null;
  is_primary_contact?: boolean;
  status?: string | null;
};

export type NecessidadeParaCriar = {
  beneficiary_id: string;
  need_type: string;
  value: string;
  notes?: string | null;
};

export type AgregadoParaAtualizar = {
  household_size?: number | null;
  parish?: string | null;
  status?: string | null;
};

export type BeneficiarioParaAtualizar = {
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  is_primary_contact?: boolean;
  status?: string | null;
};
