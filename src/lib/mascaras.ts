export function mascaraTelefone(v: string): string {
  return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

export function mascaraMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function mascaraData(v: string): string {
  const d = new Date(v);
  return d.toLocaleDateString('pt-BR');
}
