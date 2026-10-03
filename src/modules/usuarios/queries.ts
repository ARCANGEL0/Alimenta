import { query } from '@/lib/db/pool';
import type {
  UsuarioComRoles,
  UsuarioParaCriar,
  UsuarioParaAtualizar,
} from './types';

export async function listarUsuarios(): Promise<UsuarioComRoles[]> {
  const result = await query(
    `select p.id, p.email, p.full_name, p.is_active, p.created_at, p.updated_at, r.code as role_code
     from profiles p
     left join user_roles ur on ur.user_id = p.id
     left join roles r on r.id = ur.role_id
     order by p.full_name asc`,
  );

  const perfisMap = new Map<string, UsuarioComRoles>();
  (result.rows ?? []).forEach((row: any) => {
    if (!perfisMap.has(row.id)) {
      perfisMap.set(row.id, {
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        roles: [],
      });
    }
    if (row.role_code) {
      perfisMap.get(row.id)!.roles.push(row.role_code);
    }
  });

  return Array.from(perfisMap.values());
}

export async function criarUsuario(payload: UsuarioParaCriar): Promise<UsuarioComRoles> {
  const client = await query('begin');

  try {
    const { hashPassword } = await import('@/lib/auth/hash');
    const passwordHash = await hashPassword(payload.password);

    const perfilResult = await query(
      `insert into profiles (email, password_hash, full_name, is_active)
       values ($1, $2, $3, true)
       returning *`,
      [payload.email, passwordHash, payload.full_name],
    );

    const perfil = perfilResult.rows[0];

    const roleIdsResult = await query(
      `select id from roles where code = any($1)`,
      [payload.roles],
    );
    const roleIds = (roleIdsResult.rows ?? []).map((r: any) => r.id);

    for (const roleId of roleIds) {
      await query(
        `insert into user_roles (user_id, role_id) values ($1, $2)`,
        [perfil.id, roleId],
      );
    }

    await query('commit');

    return {
      ...perfil,
      roles: payload.roles,
    } as UsuarioComRoles;
  } catch (erro) {
    await query('rollback');
    throw erro;
  }
}

export async function atualizarUsuario(
  id: string,
  payload: UsuarioParaAtualizar,
): Promise<void> {
  const client = await query('begin');

  try {
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (payload.full_name !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      params.push(payload.full_name);
    }
    if (payload.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(payload.is_active);
    }
    if (payload.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      params.push(payload.email);
    }

    if (updates.length > 0) {
      await query(
        `update profiles set ${updates.join(', ')}, updated_at = now() where id = $${paramIndex++}`,
        [...params, id],
      );
    }

    if (payload.roles !== undefined) {
      await query(`delete from user_roles where user_id = $1`, [id]);
      const roleIdsResult = await query(
        `select id from roles where code = any($1)`,
        [payload.roles],
      );
      const roleIds = (roleIdsResult.rows ?? []).map((r: any) => r.id);
      for (const roleId of roleIds) {
        await query(`insert into user_roles (user_id, role_id) values ($1, $2)`, [id, roleId]);
      }
    }

    await query('commit');
  } catch (erro) {
    await query('rollback');
    throw erro;
  }
}

export async function desativarUsuario(id: string): Promise<void> {
  await query(`update profiles set is_active = false, updated_at = now() where id = $1`, [id]);
}


export async function buscarUsuarioPorEmail(email: string): Promise<UsuarioComRoles | null> {
  const result = await query(`select p.* from profiles p where p.email = $1`, [email]);
  if (result.rows.length === 0) return null;
  return result.rows[0] as UsuarioComRoles;
}


export async function listarUsuariosPorFuncao(roleCode: string): Promise<UsuarioComRoles[]> {
  const result = await query(`select p.*, ur.role_id from profiles p join user_roles ur on ur.user_id = p.id join roles r on r.id = ur.role_id where r.code = $1 order by p.full_name asc`, [roleCode]);
  return result.rows as UsuarioComRoles[];
}


export async function obterContagemUsuariosPorFuncao(): Promise<Array<{ funcao: string; total: number }>> {
  const result = await query(`select r.code as funcao, count(*) as total from user_roles ur join roles r on r.id = ur.role_id group by r.code order by total desc`);
  return result.rows;
}


export async function listarUsuariosAtivos(): Promise<UsuarioComRoles[]> {
  const result = await query(`select p.* from profiles p where p.is_active = true order by p.full_name asc`);
  return result.rows as UsuarioComRoles[];
}
