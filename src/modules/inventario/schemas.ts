import { z } from 'zod';

export const loteSchema = z.object({
  internal_code: z.string().min(1, 'O código interno do lote é obrigatório.'),
  product_id: z.string().min(1, 'O produto é obrigatório.'),
  warehouse_id: z.string().min(1, 'O armazém é obrigatório.'),
  storage_location_id: z.string().nullable().optional(),
  received_at: z.string().min(1, 'A data de receção é obrigatória.'),
  expiry_date: z.string().nullable().optional(),
  expiry_type: z.enum(['use_by', 'best_before', 'none']).nullable().optional(),
  initial_quantity: z
    .number()
    .min(0, 'A quantidade inicial não pode ser negativa.'),
  unit_code: z.string().min(1, 'A unidade é obrigatória.'),
});

export const ajusteStockSchema = z.object({
  batch_id: z.string().min(1, 'O lote é obrigatório.'),
  movement_type: z.enum(['adjustment_in', 'adjustment_out']),
  quantity: z
    .number()
    .min(0.001, 'A quantidade deve ser superior a zero.'),
  reason: z.string().min(1, 'O motivo do ajuste é obrigatório.'),
});

export const loteAtualizarSchema = z.object({
  status: z.string().optional(),
  warehouse_id: z.string().nullable().optional(),
  storage_location_id: z.string().nullable().optional(),
});

export type LoteInput = z.infer<typeof loteSchema>;
export type AjusteStockInput = z.infer<typeof ajusteStockSchema>;
export type LoteAtualizarInput = z.infer<typeof loteAtualizarSchema>;
