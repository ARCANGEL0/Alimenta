'use server';

import { marcarNotificacaoComoLida, marcarTodasComoLidas } from './queries';

export async function actionMarcarNotificacaoLida(id: string): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await marcarNotificacaoComoLida(id);
    return { sucesso: true };
  } catch {
    return { sucesso: false, erro: 'Não foi possível marcar como lida.' };
  }
}

export async function actionMarcarTodasComoLidas(): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await marcarTodasComoLidas();
    return { sucesso: true };
  } catch {
    return { sucesso: false, erro: 'Não foi possível marcar como lidas.' };
  }
}
