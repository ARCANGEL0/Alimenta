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

  const permitido = await hasRole(['admin', 'operator']);
  if (!permitido) {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  const body = await request.json();
  const { batch_id, motivo } = body;

  if (!batch_id || !motivo) {
    return NextResponse.json({ sucesso: false, erro: 'Dados incompletos.' }, { status: 400 });
  }

  const { error } = await postgres
    .from('batches')
    .update({ status: 'blocked' })
    .eq('id', batch_id);

  if (error) {
    return NextResponse.json({ sucesso: false, erro: 'Não foi possível bloquear o lote.' }, { status: 500 });
  }

  await postgres.from('audit_logs').insert({
    action: 'bloquear_lote',
    entity_type: 'batch',
    entity_id: batch_id,
    metadata: { motivo },
  });

  return NextResponse.json({ sucesso: true });
}
