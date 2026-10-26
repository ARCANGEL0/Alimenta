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
      `select di.*, p.name as product_name
       from distribution_items di
       left join products p on p.id = di.product_id
       where di.distribution_id = $1
       order by di.created_at asc`,
      [id],
    );

    return NextResponse.json(result.rows);
  } catch (erro) {
    return NextResponse.json(
      { erro: 'Erro ao listar itens da distribuição.' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);

    const { distribution_id, product_id, quantity_requested, unit_code } = await request.json();

    const result = await query(
      `insert into distribution_items (distribution_id, product_id, quantity_requested, unit_code)
       values ($1, $2, $3, $4)
       returning *`,
      [distribution_id, product_id ?? null, quantity_requested ?? null, unit_code ?? null],
    );

    return NextResponse.json(result.rows[0]);
  } catch (erro) {
    return NextResponse.json(
      { erro: 'Não foi possível criar o item.' },
      { status: 500 },
    );
  }
}
