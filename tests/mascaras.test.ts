import { describe, it, expect } from 'vitest';
import { mascaraTelefone, mascaraMoeda, mascaraData } from '@/lib/mascaras';

describe('mascaras', () => {
  it('mascara telefone', () => {
    expect(mascaraTelefone('11987654321')).toBe('(11) 98765-4321');
  });
  it('mascara moeda', () => {
    expect(mascaraMoeda(1234.5)).toContain('1.234,50');
  });
});
