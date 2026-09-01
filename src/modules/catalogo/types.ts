export type Categoria = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Produto = {
  id: string;
  sku: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
  default_unit: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoriaParaCriar = {
  name: string;
  description?: string | null;
};

export type ProdutoParaCriar = {
  sku: string;
  name: string;
  category_id: string | null;
  default_unit: string;
  description?: string | null;
};

export type ProdutoParaAtualizar = {
  name?: string;
  category_id?: string | null;
  default_unit?: string;
  description?: string | null;
  is_active?: boolean;
};

export type CategoriaParaAtualizar = {
  name?: string;
  description?: string | null;
  is_active?: boolean;
};
