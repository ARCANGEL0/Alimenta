import { query } from '@/lib/db/pool';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';
import { NextResponse } from 'next/server';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';

export async function GET() {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);

    const result = await query(
      `select d.*, b.internal_code as batch_internal_code, p.name as product_name
       from disposals d
       left join batches b on b.id = d.batch_id
       left join products p on p.id = b.product_id
       order by d.created_at desc`,
    );

    return NextResponse.json(result.rows);
  } catch (erro) {
    return NextResponse.json(
      { erro: 'Erro ao listar descartes.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);

    const { batch_id, quantity, reason_code, reason_notes, destination } =
      await request.json();

    const result = await query(
      `insert into disposals (batch_id, quantity, reason_code, reason_notes, destination)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [batch_id, quantity, reason_code, reason_notes ?? null, destination ?? null],
    );

    return NextResponse.json(result.rows[0]);
  } catch (erro) {
    return NextResponse.json(
      { erro: 'Não foi possível registar o descarte.' },
      { status: 500 },
    );
  }
}
