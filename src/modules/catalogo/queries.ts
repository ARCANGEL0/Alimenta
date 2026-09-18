import { query } from '@/lib/db/pool';
import type {
  Categoria,
  CategoriaParaCriar,
  Produto,
  ProdutoParaCriar,
} from './types';

export async function listarCategorias(): Promise<Categoria[]> {
  const result = await query(
    'select * from categories order by created_at desc, name asc',
  );
  return result.rows as Categoria[];
}

export async function listarProdutos(): Promise<Produto[]> {
  const result = await query(
    `select p.*, c.name as category_name
     from products p
     left join categories c on c.id = p.category_id
     order by p.name asc`,
  );
  return result.rows as Produto[];
}

export async function listarCategoriasAtivas(): Promise<Categoria[]> {
  const result = await query(
    'select * from categories where is_active = true order by created_at desc, name asc',
  );
  return result.rows as Categoria[];
}

export async function listarProdutosAtivos(): Promise<Produto[]> {
  const result = await query(
    `select p.*, c.name as category_name
     from products p
     left join categories c on c.id = p.category_id
     where p.is_active = true
     order by p.name asc`,
  );
  return result.rows as Produto[];
}

export async function criarCategoria(
  payload: CategoriaParaCriar,
): Promise<Categoria> {
  const result = await query(
    `insert into categories (name, description)
     values ($1, $2)
     returning *`,
    [payload.name, payload.description ?? null],
  );
  return result.rows[0] as Categoria;
}

export async function criarProduto(
  payload: ProdutoParaCriar,
): Promise<Produto> {
  const result = await query(
    `insert into products (sku, name, category_id, default_unit, description)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [
      payload.sku,
      payload.name,
      payload.category_id ?? null,
      payload.default_unit,
      payload.description ?? null,
    ],
  );
  return result.rows[0] as Produto;
}

export async function buscarProdutoPorSku(sku: string): Promise<Produto | null> {
  const result = await query(`select p.*, c.name as category_name from products p left join categories c on c.id = p.category_id where p.sku = $1`, [sku]);
  return result.rows[0] ?? null;
}


export async function obterContagemProdutosPorCategoria(): Promise<Array<{ categoria: string; total: number }>> {
  const result = await query(`select c.name as categoria, count(p.id) as total from categories c left join products p on p.category_id = c.id group by c.name order by total desc`);
  return result.rows;
}


export async function listarCategoriasComProdutos(): Promise<Array<{ categoria: string; total_produtos: number }>> {
  const result = await query(`select c.name as categoria, count(p.id) as total_produtos from categories c left join products p on p.category_id = c.id where p.is_active = true group by c.name order by total_produtos desc`);
  return result.rows;
}
