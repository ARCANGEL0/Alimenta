/**
 * Testes de formatação PT-PT.
 */

import { formatDate, formatDateTime, formatCurrency, formatNumber, parseDateInput } from '@/lib/formatting';

describe('formatDate', () => {
  it('formata data em DD/MM/AAAA', () => {
    expect(formatDate('2026-11-03')).toBe('03/11/2026');
    expect(formatDate(new Date('2026-01-15'))).toBe('15/01/2026');
  });

  it('retorna string vazia para valor nulo', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});

describe('formatDateTime', () => {
  it('formata data e hora em pt-PT', () => {
    const resultado = formatDateTime('2026-11-03T14:30:00');
    expect(resultado).toContain('03/11/2026');
    expect(resultado).toContain('14:30');
  });
});

describe('formatCurrency', () => {
  it('formata em EUR com vírgula decimal', () => {
    expect(formatCurrency(1500.5)).toContain('1.500,50');
    expect(formatCurrency(0)).toBe('0,00 €');
  });
});

describe('formatNumber', () => {
  it('formata número com vírgula decimal', () => {
    expect(formatNumber(1500.5)).toBe('1.500,5');
    expect(formatNumber(0)).toBe('0');
  });
});

describe('parseDateInput', () => {
  it('parseia data DD/MM/AAAA', () => {
    const resultado = parseDateInput('03/11/2026');
    expect(resultado).toBeInstanceOf(Date);
    expect(resultado!.getDate()).toBe(3);
    expect(resultado!.getMonth()).toBe(10); // novembro = índice 10
    expect(resultado!.getFullYear()).toBe(2026);
  });

  it('retorna null para valor inválido', () => {
    expect(parseDateInput('')).toBeNull();
    expect(parseDateInput('inválido')).toBeNull();
    expect(parseDateInput('13/13/2026')).toBeNull();
  });
});
