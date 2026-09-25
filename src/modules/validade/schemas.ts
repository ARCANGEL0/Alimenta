import { z } from 'zod';

export const loteBloquearSchema = z.object({
  batch_id: z.string().min(1, 'O lote é obrigatório.'),
  motivo: z.string().min(1, 'O motivo do bloqueio é obrigatório.'),
});

export const loteAvaliarSchema = z.object({
  batch_id: z.string().min(1, 'O lote é obrigatório.'),
  avaliacao: z.enum(['apto', 'imapto']),
  notas: z.string().nullable().optional(),
});

export const limiaresSchema = z.object({
  expired_days: z.number().min(0, 'Dias expirados não pode ser negativo.'),
  critical_days: z.number().min(0, 'Dias críticos não pode ser negativo.'),
  attention_days: z.number().min(0, 'Dias de atenção não pode ser negativo.').max(30, 'Dias de atenção não pode ser superior a 30.'),
});

export type LoteBloquearInput = z.infer<typeof loteBloquearSchema>;
export type LoteAvaliarInput = z.infer<typeof loteAvaliarSchema>;
export type LimiaresInput = z.infer<typeof limiaresSchema>;
