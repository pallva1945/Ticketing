export function formatMerchDate(dateStr: string, language: string, withTime = false): string {
  const date = new Date(dateStr);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : 'en-GB', {
    timeZone: 'Europe/Rome', day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit' as const, minute: '2-digit' as const } : {}),
  }).format(date);
}
