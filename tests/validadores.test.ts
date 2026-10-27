import { describe, it, expect } from 'vitest';
import { validarEmail, validarCodigo, validarQuantidade, validarData } from '@/lib/validadores';

describe('validadores', () => {
  it('valida email', () => {
    expect(validarEmail('a@b.com')).toBe(true);
    expect(validarEmail('invalido')).toBe(false);
  });
  it('valida quantidade', () => {
    expect(validarQuantidade(1)).toBe(true);
    expect(validarQuantidade(0)).toBe(false);
  });
});
