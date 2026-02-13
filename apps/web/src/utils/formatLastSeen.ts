/**
 * Форматирует дату последней активности для подписи "Был(а) в сети ..."
 * @param iso - ISO строка даты или Date
 */
export function formatLastSeen(iso: string | Date | null | undefined): string {
  if (iso == null) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dateTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.floor((today - dateTime) / 86400000);
  if (diffDays === 0) return `Сегодня в ${timeStr}`;
  if (diffDays === 1) return `Вчера в ${timeStr}`;
  if (diffDays < 7 && diffDays < 365) {
    const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    return `${dateStr} в ${timeStr}`;
  }
  const dateStr = d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
  return `${dateStr} в ${timeStr}`;
}
