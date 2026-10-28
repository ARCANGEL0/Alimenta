import { describe, it, expect } from 'vitest';
import { numeroComSeparador, dataPorExtenso } from '@/lib/formatters';

describe('formatters', () => {
  it('formata numero', () => {
    expect(numeroComSeparador(1234.5)).toBe('1.234,5');
  });
  it('formata data', () => {
    expect(dataPorExtenso('2026-01-01')).toContain('2026');
  });
});
