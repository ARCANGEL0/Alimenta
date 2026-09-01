const PT_TZ = 'Europe/Lisbon';

export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-PT', {
    timeZone: PT_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string | null): string {
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

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-PT').format(value);
}

export function parseDateInput(value: string): Date | null {
  const [day, month, year] = value.split('/').map(Number);
  if (!day || !month || !year) return null;
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  if (isNaN(date.getTime())) return null;
  return date;
}
