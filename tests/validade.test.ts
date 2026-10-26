/**
 * Testes de domínio — FEFO e validades.
 * Estes testes não requerem base de dados: testam a lógica pura de
 * classificação de alertas e ordenação FEFO.
 */

function classificarAlerta(dias: number | null): 'vencido' | 'critico' | 'atencao' | 'normal' {
  if (dias === null) return 'normal';
  if (dias < 0) return 'vencido';
  if (dias <= 3) return 'critico';
  if (dias <= 7) return 'atencao';
  return 'normal';
}

function ordenarFEFO(lotes: Array<{ id: string; recebido: Date; validade: Date | null }>) {
  return [...lotes].sort((a, b) => {
    if (a.validade === null && b.validade === null) return a.recebido.getTime() - b.recebido.getTime();
    if (a.validade === null) return 1;
    if (b.validade === null) return -1;
    if (a.validade.getTime() !== b.validade.getTime()) return a.validade.getTime() - b.validade.getTime();
    return a.recebido.getTime() - b.recebido.getTime();
  });
}

describe('classificarAlerta', () => {
  it('classifica validade vencida', () => {
    expect(classificarAlerta(-1)).toBe('vencido');
    expect(classificarAlerta(-30)).toBe('vencido');
  });

  it('classifica crítica (0-3 dias)', () => {
    expect(classificarAlerta(0)).toBe('critico');
    expect(classificarAlerta(3)).toBe('critico');
  });

  it('classifica atenção (4-7 dias)', () => {
    expect(classificarAlerta(4)).toBe('atencao');
    expect(classificarAlerta(7)).toBe('atencao');
  });

  it('classifica normal (>7 dias)', () => {
    expect(classificarAlerta(8)).toBe('normal');
    expect(classificarAlerta(30)).toBe('normal');
  });

  it('classifica sem validade como normal', () => {
    expect(classificarAlerta(null)).toBe('normal');
  });
});

describe('ordenarFEFO', () => {
  it('ordena por validade crescente', () => {
    const lotes = [
      { id: 'B', recebido: new Date('2026-01-01'), validade: new Date('2026-02-01') },
      { id: 'A', recebido: new Date('2026-01-02'), validade: new Date('2026-01-15') },
    ];
    const ordenado = ordenarFEFO(lotes);
    expect(ordenado[0].id).toBe('A');
    expect(ordenado[1].id).toBe('B');
  });

  it('desempata por data de receção (FIFO)', () => {
    const lotes = [
      { id: 'B', recebido: new Date('2026-01-02'), validade: new Date('2026-01-15') },
      { id: 'A', recebido: new Date('2026-01-01'), validade: new Date('2026-01-15') },
    ];
    const ordenado = ordenarFEFO(lotes);
    expect(ordenado[0].id).toBe('A');
    expect(ordenado[1].id).toBe('B');
  });

  it('coloca lotes sem validade por último', () => {
    const lotes = [
      { id: 'B', recebido: new Date('2026-01-01'), validade: null },
      { id: 'A', recebido: new Date('2026-01-01'), validade: new Date('2026-01-15') },
    ];
    const ordenado = ordenarFEFO(lotes);
    expect(ordenado[0].id).toBe('A');
    expect(ordenado[1].id).toBe('B');
  });
});
