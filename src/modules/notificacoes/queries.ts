import { query } from '@/lib/db/pool';

export type Notificacao = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  related_entity_type: string | null;
  related_entity_id: string | null;
  read: boolean;
  created_at: string;
  read_at: string | null;
};

export async function listarNotificacoes(limite = 20): Promise<Notificacao[]> {
  const result = await query(
    `select id, title, message, type, related_entity_type, related_entity_id, read, created_at, read_at
     from notifications
     order by created_at desc
     limit $1`,
    [limite],
  );
  return result.rows as Notificacao[];
}

export async function listarNotificacoesNaoLidas(): Promise<Notificacao[]> {
  const result = await query(
    `select id, title, message, type, related_entity_type, related_entity_id, read, created_at, read_at
     from notifications
     where read = false
     order by created_at desc`,
  );
  return result.rows as Notificacao[];
}

export async function contarNotificacoesNaoLidas(): Promise<number> {
  const result = await query(`select count(*) from notifications where read = false`);
  return Number(result.rows[0].count);
}

export async function marcarNotificacaoComoLida(id: string): Promise<void> {
  await query(
    `update notifications set read = true, read_at = now() where id = $1 and read = false`,
    [id],
  );
}

export async function marcarTodasComoLidas(): Promise<void> {
  await query(`update notifications set read = true, read_at = now() where read = false`);
}

export async function gerarNotificacoesValidade(): Promise<{
  sucesso: boolean;
  geradas: number;
  erro?: string;
}> {
  try {
    await query(`select gerar_notificacoes_validade()`);
    const { rows } = await query(`select count(*) from notifications where read = false`);
    return { sucesso: true, geradas: Number(rows[0].count) };
  } catch (erro) {
    return { sucesso: false, geradas: 0, erro: 'Não foi possível gerar notificações de validade.' };
  }
}
