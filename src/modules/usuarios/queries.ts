import { createServerClient } from '@/src/lib/postgres/server';
import type {
  UsuarioComRoles,
  UsuarioParaCriar,
  UsuarioParaAtualizar,
} from './types';

export async function listarUsuarios(): Promise<UsuarioComRoles[]> {
  const postgres = createServerClient();

  const { data: perfis, error: erroPerfis } = await postgres
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });

  if (erroPerfis) {
    throw new Error('Não foi possível listar os utilizadores.');
  }

  const perfisComRoles: UsuarioComRoles[] = [];

  for (const perfil of perfis ?? []) {
    const { data: userRoles } = await postgres
      .from('user_roles')
      .select('role_id')
      .eq('user_id', perfil.id);

    const roleIds = (userRoles ?? []).map((ur) => ur.role_id);

    let nomesRoles: string[] = [];
    if (roleIds.length > 0) {
      const { data: roles } = await postgres
        .from('roles')
        .select('code')
        .in('id', roleIds);
      nomesRoles = (roles ?? []).map((r) => r.code);
    }

    perfisComRoles.push({
      ...perfil,
      roles: nomesRoles,
    });
  }

  return perfisComRoles;
}

export async function criarUsuario(
  payload: UsuarioParaCriar,
): Promise<UsuarioComRoles> {
  const postgres = createServerClient();

  // Cria o utilizador no postgres Auth.
  const {
    data: authData,
    error: erroAuth,
  } = await postgres.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
  });

  if (erroAuth || !authData.user) {
    throw new Error(erroAuth?.message ?? 'Não foi possível criar o utilizador.');
  }

  // Cria o perfil.
  const { data: perfil, error: erroPerfil } = await postgres
    .from('profiles')
    .insert({
      id: authData.user.id,
      full_name: payload.full_name,
      is_active: true,
    })
    .select()
    .single();

  if (erroPerfil || !perfil) {
    throw new Error('Não foi possível criar o perfil do utilizador.');
  }

  // Atribui as funções.
  const papelIds = await obterIdsDasRoles(payload.roles);

  if (papelIds.length > 0) {
    const { error: erroRoles } = await postgres.from('user_roles').insert(
      papelIds.map((roleId) => ({
        user_id: perfil.id,
        role_id: roleId,
      })),
    );

    if (erroRoles) {
      throw new Error('Não foi possível atribuir as funções.');
    }
  }

  return {
    ...perfil,
    roles: payload.roles,
  };
}

export async function atualizarUsuario(
  id: string,
  payload: UsuarioParaAtualizar,
): Promise<void> {
  const postgres = createServerClient();

  const { error: erroPerfil } = await postgres
    .from('profiles')
    .update({
      full_name: payload.full_name,
      is_active: payload.is_active,
    })
    .eq('id', id);

  if (erroPerfil) {
    throw new Error('Não foi possível atualizar o utilizador.');
  }

  if (payload.roles !== undefined) {
    // Remove funções atuais.
    await postgres.from('user_roles').delete().eq('user_id', id);

    // Atribui as novas funções.
    const papelIds = await obterIdsDasRoles(payload.roles);

    if (papelIds.length > 0) {
      const { error: erroRoles } = await postgres.from('user_roles').insert(
        papelIds.map((roleId) => ({
          user_id: id,
          role_id: roleId,
        })),
      );

      if (erroRoles) {
        throw new Error('Não foi possível atribuir as funções.');
      }
    }
  }
}

export async function desativarUsuario(id: string): Promise<void> {
  const postgres = createServerClient();

  const { error } = await postgres
    .from('profiles')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    throw new Error('Não foi possível desativar o utilizador.');
  }
}

async function obterIdsDasRoles(codigos: string[]): Promise<string[]> {
  const postgres = createServerClient();

  const { data: roles } = await postgres
    .from('roles')
    .select('id')
    .in('code', codigos);

  return (roles ?? []).map((r) => r.id);
}
