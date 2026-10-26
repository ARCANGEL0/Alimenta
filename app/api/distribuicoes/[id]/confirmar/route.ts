import { query } from '@/lib/db/pool';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';
import { NextResponse } from 'next/server';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);

    const { id } = await params;

    const result = await query(
      `select confirm_distribution($1::uuid, null::uuid) as resultado`,
      [id],
    );

    const distribuicao = result.rows[0]?.resultado;
    if (!distribuicao || !distribuicao.sucesso) {
      return NextResponse.json(
        { erro: distribuicao?.erro || 'Não foi possível confirmar a distribuição.' },
        { status: 400 },
      );
    }

    return NextResponse.json(distribuicao);
  } catch (erro) {
    return NextResponse.json(
      { erro: 'Erro ao confirmar a distribuição.' },
      { status: 500 },
    );
  }
}
