import { createServerClient } from '@/src/lib/postgres/server';
import { hasRole } from '@/src/lib/permissions';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const postgres = createServerClient();

  const {
    data: { user },
  } = await postgres.auth.getUser();
  if (!user) {
    return NextResponse.json({ sucesso: false, erro: 'Não autenticado.' }, { status: 401 });
  }

  const permitido = await hasRole(['admin', 'operator', 'social_worker']);
  if (!permitido) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  const body = await request.json();
  const { batch_id, avaliacao, notas } = body;

  if (!batch_id || !avaliacao) {
    return NextResponse.json({ sucesso: false, erro: 'Dados incompletos.' }, { status: 400 });
  }

  const decision = avaliacao === 'apto' ? 'approved' : 'rejected';

  const { error: erroInsp } = await postgres.from('batch_inspections').insert({
    batch_id,
    decision,
    notes: notas ?? null,
    inspected_at: new Date().toISOString(),
  });

  if (erroInsp) {
    return NextResponse.json({ sucesso: false, erro: 'Não foi possível registar a avaliação.' }, { status: 500 });
  }

  const novoStatus = avaliacao === 'apto' ? 'available' : 'blocked';

  const { error: erroUpd } = await postgres
    .from('batches')
    .update({ status: novoStatus })
    .eq('id', batch_id);

  if (erroUpd) {
    return NextResponse.json({ sucesso: false, erro: 'Não foi possível atualizar o lote.' }, { status: 500 });
  }

  return NextResponse.json({ sucesso: true });
}
