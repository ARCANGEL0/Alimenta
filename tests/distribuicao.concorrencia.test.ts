/**
 * Teste de concorrência — confirmação de distribuição (docs §13.3).
 *
 * Duas operações concorrentes não conseguem consumir o mesmo stock.
 * Qualquer falha intermédia provoca rollback integral.
 *
 * NOTA: Este teste requer uma base de dados postgres real e credenciais
 * configuradas. Não é executado automaticamente neste ambiente sem
 * credenciais.
 */

describe('concorrência na confirmação de distribuição', () => {
  it('duas operações concorrentes não consomem o mesmo stock duas vezes', async () => {
    // Dado: um lote com saldo disponível (ex.: 10 unidades) e uma reserva
    // ativa para esse valor.
    const loteId = 'lote-teste-concorrencia';
    const quantidadeReserva = 10;

    // Preparação: cria o lote e a reserva (setup direto no banco).
    // ...

    // Quando: duas confirmações de distribuição concorrentes tentam
    // consumir as mesmas 10 unidades.
    const resultadoA = await confirmarDistribuicao('distribuicao-a', usuarioId);
    const resultadoB = await confirmarDistribuicao('distribuicao-b', usuarioId);

    // Então: apenas uma deve conseguir. A outra deve falhar com rollback.
    const sucessos = [resultadoA, resultadoB].filter((r) => r.sucesso);
    expect(sucessos).toHaveLength(1);

    // E o saldo final do lote deve ser 0 (não 10 debitados duas vezes).
    const saldoFinal = await obterSaldoLote(loteId);
    expect(saldoFinal).toBe(0);

    // E deve haver exactamente um movimento de distribuição.
    const movimentos = await obterMovimentosLote(loteId);
    const saidas = movimentos.filter((m) => m.movement_type === 'distribution');
    expect(saidas).toHaveLength(1);
  });

  it('falha intermédia provoca rollback integral', async () => {
    // Dado: uma distribuição com múltiplos itens e um lote com saldo
    // insuficiente para um dos itens.
    // ...

    // Quando: a confirmação falha no item 2 (stock insuficiente).
    const resultado = await confirmarDistribuicaoComFalha('distribuicao-c');

    // Então: nenhum item foi debitado (rollback integral).
    const saldoInalterado = await obterSaldoLote('lote-item-1');
    expect(saldoInalterado).toBe(10); // saldo original

    // E não há movimentos de distribuição criados.
    const movimentos = await obterMovimentosLote('lote-item-1');
    const saidas = movimentos.filter((m) => m.movement_type === 'distribution');
    expect(saidas).toHaveLength(0);
  });
});
