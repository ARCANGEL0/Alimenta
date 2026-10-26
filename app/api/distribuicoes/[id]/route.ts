import { query } from '@/lib/db/pool';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';
import { NextResponse } from 'next/server';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);

    const { id } = await params;

    const result = await query(
      `select d.*, h.code as household_code
       from distributions d
       left join households h on h.id = d.household_id
       where d.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ erro: 'Distribuição não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (erro) {
    return NextResponse.json(
      { erro: 'Erro ao buscar distribuição.' },
      { status: 500 },
    );
  }
}
