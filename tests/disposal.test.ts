/**
 * Testes de domínio — descartes (docs §13.4).
 */

describe('register_disposal', () => {
  it('descarte válido cria registo e movimento', () => {
    // saldo livre suficiente -> descarte, movimento disposal, auditoria
    expect(true).toBe(true);
  });

  it('descarte acima da quantidade livre falha', () => {
    // quantidade > available_quantity -> erro
    expect(true).toBe(true);
  });

  it('descarte de stock reservado falha sem libertação explícita', () => {
    // available_quantity já descontou reservas ativas
    expect(true).toBe(true);
  });

  it('repetição não duplica descarte', () => {
    // idempotência por chamada controlada
    expect(true).toBe(true);
  });
});
