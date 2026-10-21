import { NextResponse } from 'next/server';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import { contarNotificacoesNaoLidas } from '@/modules/notificacoes/queries';

export async function GET() {
  try {
    await verificarSessao();
  } catch {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  const total = await contarNotificacoesNaoLidas();
  return NextResponse.json({ sucesso: true, total });
}
