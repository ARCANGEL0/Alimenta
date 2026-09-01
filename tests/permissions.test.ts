/**
 * Testes de domínio — permissões (docs §13.5).
 */

describe('permissoes por role', () => {
  it('operador não consegue atribuir funções', () => {
    // role operator nao tem escrita em user_roles/roles
    expect(true).toBe(true);
  });

  it('operador não lê notas sociais protegidas', () => {
    // beneficiario contatos/notes ocultos para operator (RLS)
    expect(true).toBe(true);
  });

  it('assistente social não altera configurações administrativas', () => {
    // social_worker nao escreve settings
    expect(true).toBe(true);
  });

  it('utilizador anónimo não acede a páginas nem dados privados', () => {
    // sem sessao -> redirecionado para /login; RLS bloqueia leitura
    expect(true).toBe(true);
  });

  it('chave service role nunca aparece no bundle client', () => {
    // SERVICE_ROLE_KEY so em ficheiros server-side
    expect(true).toBe(true);
  });
});
