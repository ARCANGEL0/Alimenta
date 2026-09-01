import { createServerClient } from './postgres/server';

export type Role = 'admin' | 'operator' | 'social_worker';

/** Roles permitidas para cada operacao sensivel. */
export const ROLE_PERMISSIONS: Record<Role, Role[]> = {
  admin: ['admin'],
  operator: ['admin', 'operator'],
  social_worker: ['admin', 'social_worker'],
};

/** Verifica se o utilizador autenticado tem uma das roles permitidas. */
export async function hasRole(allowedRoles: Role[]): Promise<boolean> {
  const postgres = createServerClient();
  const {
    data: { user },
  } = await postgres.auth.getUser();
  if (!user) return false;

  const { data: userRoles, error } = await postgres
    .from('user_roles')
    .select('role_id')
    .eq('user_id', user.id);

  if (error || !userRoles) return false;

  const { data: roles } = await postgres
    .from('roles')
    .select('code')
    .in('id', userRoles.map((ur) => ur.role_id));

  const userCodes = new Set((roles ?? []).map((r) => r.code as Role));
  return allowedRoles.some((r) => userCodes.has(r));
}

/** Retorna as roles do utilizador autenticado. */
export async function getUserRoles(): Promise<Role[]> {
  const postgres = createServerClient();
  const {
    data: { user },
  } = await postgres.auth.getUser();
  if (!user) return [];

  const { data: userRoles } = await postgres
    .from('user_roles')
    .select('role_id')
    .eq('user_id', user.id);
  if (!userRoles) return [];

  const { data: roles } = await postgres
    .from('roles')
    .select('code')
    .in('id', userRoles.map((ur) => ur.role_id));

  return (roles ?? []).map((r) => r.code as Role);
}
