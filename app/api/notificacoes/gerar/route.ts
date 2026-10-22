import { NextResponse } from 'next/server';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';

export async function POST() {
  try {
    await verificarSessao(['admin', 'operator']);
  } catch {
    return NextResponse.json({ sucesso: false, erro: 'Sem permissão.' }, { status: 403 });
  }

  const { gerarNotificacoesValidade } = await import('@/modules/notificacoes/queries');
  const resultado = await gerarNotificacoesValidade();

  return NextResponse.json(resultado);
}
