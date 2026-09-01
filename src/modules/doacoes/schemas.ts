import { z } from 'zod';

export const doadorSchema = z.object({
  code: z.string().min(1, 'O código do doador é obrigatório.'),
  name: z.string().min(1, 'O nome do doador é obrigatório.'),
  donor_type: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido.').nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const doacaoSchema = z.object({
  donor_id: z.string().min(1, 'Selecione um doador.'),
  received_at: z.string().min(1, 'A data de receção é obrigatória.'),
  notes: z.string().nullable().optional(),
});

export const doacaoItemSchema = z.object({
  donation_id: z.string().min(1, 'A doação é obrigatória.'),
  product_id: z.string().nullable().optional(),
  quantity_received: z
    .number()
    .min(0, 'A quantidade recebida não pode ser negativa.'),
  unit_code: z.string().min(1, 'A unidade é obrigatória.'),
  supplier_batch_code: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  expiry_type: z
    .enum(['use_by', 'best_before', 'none'])
    .nullable()
    .optional(),
});

export const doadorAtualizarSchema = z.object({
  name: z.string().min(1, 'O nome do doador é obrigatório.').optional(),
  donor_type: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido.').nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type DoadorInput = z.infer<typeof doadorSchema>;
export type DoacaoInput = z.infer<typeof doacaoSchema>;
export type DoacaoItemInput = z.infer<typeof doacaoItemSchema>;
export type DoadorAtualizarInput = z.infer<typeof doadorAtualizarSchema>;
