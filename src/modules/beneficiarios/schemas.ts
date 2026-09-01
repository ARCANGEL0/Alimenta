import { z } from 'zod';

export const agregadoSchema = z.object({
  code: z.string().min(1, 'O código do agregado é obrigatório.'),
  household_size: z
    .number()
    .int()
    .min(1, 'O tamanho deve ser pelo menos 1.')
    .optional(),
  parish: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});

export const beneficiarioSchema = z.object({
  code: z.string().min(1, 'O código do beneficiário é obrigatório.'),
  household_id: z.string().min(1, 'O agregado é obrigatório.'),
  full_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido.').nullable().optional(),
  is_primary_contact: z.boolean().optional(),
  status: z.string().nullable().optional(),
});

export const necessidadeSchema = z.object({
  beneficiary_id: z.string().min(1, 'O beneficiário é obrigatório.'),
  need_type: z.string().min(1, 'O tipo de necessidade é obrigatório.'),
  value: z.string().min(1, 'O valor é obrigatório.'),
  notes: z.string().nullable().optional(),
});

export const agregadoAtualizarSchema = z.object({
  household_size: z
    .number()
    .int()
    .min(1, 'O tamanho deve ser pelo menos 1.')
    .optional(),
  parish: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});

export type AgregadoInput = z.infer<typeof agregadoSchema>;
export type BeneficiarioInput = z.infer<typeof beneficiarioSchema>;
export type NecessidadeInput = z.infer<typeof necessidadeSchema>;
export type AgregadoAtualizarInput = z.infer<typeof agregadoAtualizarSchema>;
