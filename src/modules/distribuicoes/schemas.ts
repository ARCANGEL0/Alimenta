import { z } from 'zod';

export const distribuicaoSchema = z.object({
  household_id: z.string().min(1, 'O agregado é obrigatório.'),
  scheduled_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const itemDistribuicaoSchema = z.object({
  distribution_id: z.string().min(1, 'A distribuição é obrigatória.'),
  product_id: z.string().nullable().optional(),
  quantity_requested: z
    .number()
    .min(0, 'A quantidade não pode ser negativa.'),
  unit_code: z.string().nullable().optional(),
});

export const distribuicaoAtualizarSchema = z.object({
  status: z.string().optional(),
  notes: z.string().nullable().optional(),
});

export const reservarStockSchema = z.object({
  distribution_item_id: z.string().min(1, 'O item é obrigatório.'),
  batch_id: z.string().min(1, 'O lote é obrigatório.'),
  quantity: z.number().min(0.001, 'A quantidade deve ser superior a zero.'),
});

export type DistribuicaoInput = z.infer<typeof distribuicaoSchema>;
export type ItemDistribuicaoInput = z.infer<typeof itemDistribuicaoSchema>;
export type DistribuicaoAtualizarInput = z.infer<
  typeof distribuicaoAtualizarSchema
>;
export type ReservarStockInput = z.infer<typeof reservarStockSchema>;
