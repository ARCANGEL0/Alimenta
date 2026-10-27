import { describe, it, expect } from 'vitest';
import { filtroTexto, filtroData } from '@/lib/filtros';

describe('filtros', () => {
  it('filtra por texto', () => {
    const itens = [{ nome: 'Maçã' }, { nome: 'Banana' }];
    expect(filtroTexto(itens, 'nome', 'maçã')).toHaveLength(1);
  });
  it('filtra por data', () => {
    const itens = [{ d: '2026-01-01' }, { d: '2026-12-31' }];
    expect(filtroData(itens, 'd', '2026-06-01', '2026-06-30')).toHaveLength(0);
  });
});
