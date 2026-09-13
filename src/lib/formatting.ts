const PT_TZ = 'Europe/Lisbon';

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-PT', {
    timeZone: PT_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleString('pt-PT', {
    timeZone: PT_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatarComSeparadores(value: number, minFrac: number, maxFrac: number): string {
  const texto = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
  }).format(value);
  const [inteiroBruto, fracao] = texto.split('.');
  const inteiro = inteiroBruto.replace(/,/g, '');
  const agrupado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return fracao ? `${agrupado},${fracao}` : agrupado;
}

export function formatCurrency(value: number): string {
  return `${formatarComSeparadores(value, 2, 2)} €`;
}

export function formatNumber(value: number): string {
  return formatarComSeparadores(value, 0, 3);
}

export function parseDateInput(value: string): Date | null {
  const partes = value.split('/');
  if (partes.length !== 3) return null;
  const [day, month, year] = partes.map(Number);
  if (!day || !month || !year) return null;
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  if (
    isNaN(date.getTime()) ||
    date.getUTCDate() !== day ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCFullYear() !== year
  ) {
    return null;
  }
  return date;
}

export function tempoLeitura(texto: string): number {
  return Math.ceil(texto.length / 200);
}
