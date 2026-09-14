export type Role = 'admin' | 'operator' | 'social_worker';

export const ROLES: Role[] = ['admin', 'operator', 'social_worker'];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  operator: 'Operador',
  social_worker: 'Assistente social',
};

export function temPapel(usuarioRoles: Role[], papelNecessario: Role): boolean {
  return usuarioRoles.includes(papelNecessario);
}

export function temAlgumPapel(usuarioRoles: Role[], papeis: Role[]): boolean {
  return papeis.some((p) => usuarioRoles.includes(p));
}
