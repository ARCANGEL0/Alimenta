import { z } from 'zod';

export const categoriaSchema = z.object({
  name: z.string().min(1, 'O nome da categoria é obrigatório.'),
  description: z.string().nullable().optional(),
});

export const produtoSchema = z.object({
  sku: z.string().min(1, 'O SKU do produto é obrigatório.'),
  name: z.string().min(1, 'O nome do produto é obrigatório.'),
  category_id: z.string().nullable().optional(),
  default_unit: z.string().min(1, 'A unidade por defeito é obrigatória.'),
  description: z.string().nullable().optional(),
});

export const produtoAtualizarSchema = z.object({
  name: z.string().min(1, 'O nome do produto é obrigatório.').optional(),
  category_id: z.string().nullable().optional(),
  default_unit: z.string().min(1, 'A unidade por defeito é obrigatória.').optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const categoriaAtualizarSchema = z.object({
  name: z.string().min(1, 'O nome da categoria é obrigatório.').optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type ProdutoInput = z.infer<typeof produtoSchema>;
export type ProdutoAtualizarInput = z.infer<typeof produtoAtualizarSchema>;
export type CategoriaAtualizarInput = z.infer<typeof categoriaAtualizarSchema>;
