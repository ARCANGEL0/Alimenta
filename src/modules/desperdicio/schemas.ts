import { z } from 'zod';

export const descarteSchema = z.object({
  batch_id: z.string().min(1, 'O lote é obrigatório.'),
  quantity: z.number().min(0.001, 'A quantidade deve ser superior a zero.').max(100000, 'A quantidade não pode exceder 100000.'),
  reason_code: z.enum([
    'expired',
    'damaged_packaging',
    'improper_storage',
    'spoiled',
    'preventive_recall',
    'other',
  ]),
  reason_notes: z.string().nullable().optional(),
  destination: z.string().nullable().optional(),
});

export type DescarteInput = z.infer<typeof descarteSchema>;

export const MOTIVOS_DESCARTE = [
  { code: 'expired', label: 'Validade ultrapassada', requerDescricao: false },
  { code: 'damaged_packaging', label: 'Embalagem danificada', requerDescricao: false },
  { code: 'improper_storage', label: 'Conservação inadequada', requerDescricao: false },
  { code: 'spoiled', label: 'Deterioração', requerDescricao: false },
  { code: 'preventive_recall', label: 'Recolha preventiva', requerDescricao: false },
  { code: 'other', label: 'Outro', requerDescricao: true },
];
