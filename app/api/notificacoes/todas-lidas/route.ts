import { NextResponse } from 'next/server';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import { marcarTodasComoLidas } from '@/modules/notificacoes/queries';

export async function POST() {
  try {
    await verificarSessao();
  } catch {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  await marcarTodasComoLidas();
  return NextResponse.json({ sucesso: true });
}
