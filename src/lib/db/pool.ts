import { Pool, type PoolClient } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'alimenta',
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no cliente PostgreSQL:', err);
});

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

export async function getClient() {
  return pool.connect();
}

export async function transacao<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const resultado = await fn(client);
    await client.query('commit');
    return resultado;
  } catch (erro) {
    await client.query('rollback');
    throw erro;
  } finally {
    client.release();
  }
}

type RespostaRpc = { success: boolean; error?: string; message?: string };

export async function chamarRpc(sql: string, params: unknown[]): Promise<{ sucesso: boolean; erro?: string; mensagem?: string }> {
  const result = await pool.query(sql, params);
  const r = result.rows[0]?.resultado as RespostaRpc | undefined;
  if (!r) return { sucesso: false, erro: 'Sem resposta da base de dados.' };
  return r.success
    ? { sucesso: true, mensagem: r.message }
    : { sucesso: false, erro: r.error ?? 'Operação recusada.' };
}
