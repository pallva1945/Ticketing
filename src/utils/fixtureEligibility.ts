// Performance is eligible the day AFTER the fixture, in the club's timezone.
// Do not infer completion from ticket sales, revenue, or a nonzero attendance.
const romeCalendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function romeDay(now = new Date()): string {
  const parts = romeCalendar.formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function fixtureDay(value: string): string {
  const text = value.trim();
  const italian = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?:$|[ T])/);
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[ T])/);
  if (!italian && !iso) return '';
  const year = italian ? Number(italian[3]) + (italian[3].length === 2 ? 2000 : 0) : Number(iso![1]);
  const month = Number(italian ? italian[2] : iso![2]);
  const day = Number(italian ? italian[1] : iso![3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function isPlayedFixture(fixture: { date: string }, asOf = romeDay()): boolean {
  const date = fixtureDay(fixture.date);
  return Boolean(date && date < asOf);
}

export function isUpcomingFixture(fixture: { date: string }, asOf = romeDay()): boolean {
  const date = fixtureDay(fixture.date);
  return Boolean(date && date >= asOf);
}

export function playedFixtures<T extends { date: string }>(fixtures: T[], asOf = romeDay()): T[] {
  return fixtures.filter(fixture => isPlayedFixture(fixture, asOf));
}