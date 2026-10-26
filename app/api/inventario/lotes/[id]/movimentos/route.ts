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
      `select * from stock_movements
       where batch_id = $1
       order by created_at desc`,
      [id],
    );

    return NextResponse.json(result.rows);
  } catch (erro) {
    return NextResponse.json(
      { erro: 'Erro ao listar movimentos do lote.' },
      { status: 500 },
    );
  }
}
