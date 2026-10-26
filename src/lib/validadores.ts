export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarCodigo(codigo: string): boolean {
  return codigo.length >= 3;
}

export function validarQuantidade(qtd: number): boolean {
  return qtd > 0;
}

export function validarData(data: string): boolean {
  return !isNaN(new Date(data).getTime());
}
