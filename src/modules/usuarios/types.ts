export type Perfil = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UsuarioComRoles = Perfil & {
  roles: string[];
};

export type UsuarioParaCriar = {
  email: string;
  password: string;
  full_name: string;
  roles: string[];
};

export type UsuarioParaAtualizar = {
  email?: string;
  full_name?: string | null;
  is_active?: boolean;
  roles?: string[];
};
