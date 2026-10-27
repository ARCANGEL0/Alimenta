export function filtroTexto(itens: any[], campo: string, texto: string): any[] {
  if (!texto) return itens;
  const t = texto.toLowerCase();
  return itens.filter((i: any) => String(i[campo] ?? '').toLowerCase().includes(t));
}

export function filtroData(itens: any[], campo: string, de: string, ate: string): any[] {
  if (!de && !ate) return itens;
  return itens.filter((i: any) => {
    const d = new Date(i[campo]);
    return (!de || d >= new Date(de)) && (!ate || d <= new Date(ate));
  });
}
