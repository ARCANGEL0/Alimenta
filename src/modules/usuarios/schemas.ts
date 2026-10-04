import { z } from 'zod';

export const usuarioParaCriarSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(8, 'A palavra-passe deve ter pelo menos 8 caracteres.'),
  full_name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  roles: z.array(z.string()).min(1, 'Selecione pelo menos uma função.'),
});

export const usuarioParaAtualizarSchema = z.object({
  email: z.string().email('E-mail inválido.').optional(),
  full_name: z.string().min(1, 'O nome é obrigatório.').optional(),
  is_active: z.boolean().optional(),
  roles: z.array(z.string()).optional(),
});

export type UsuarioParaCriarInput = z.infer<typeof usuarioParaCriarSchema>;
export type UsuarioParaAtualizarInput = z.infer<typeof usuarioParaAtualizarSchema>;
