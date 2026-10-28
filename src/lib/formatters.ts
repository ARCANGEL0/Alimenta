export function numeroComSeparador(v: number): string {
  return v.toLocaleString('pt-BR');
}

export function dataPorExtenso(v: string): string {
  return new Date(v).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
