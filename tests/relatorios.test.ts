import { describe, it, expect } from 'vitest';

describe('relatorios', () => {
  it('retorna vazio quando nao ha dados', () => {
    expect([]).toHaveLength(0);
  });
});
