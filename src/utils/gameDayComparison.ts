import type { GameData, GameDayData } from '../types';

export type GameDayComparisonMode = 'opponent' | 'week' | 'ytd' | 'tier' | 'custom';
export type GameDayRevenueField = 'tixRevenue' | 'merchRevenue' | 'hospitalityRevenue' | 'parkingRevenue' | 'fbRevenue' | 'sponsorshipRevenue' | 'expRevenue';
export type GameDayValueField = GameDayRevenueField | 'attendance' | 'tvRevenue' | 'totalRevenue';
export const GAMEDAY_CHANNELS: { field: GameDayRevenueField; label: string; operational: boolean }[] = [
  { field: 'fbRevenue', label: 'F&B', operational: true },
  { field: 'merchRevenue', label: 'Merchandising', operational: true },
  { field: 'hospitalityRevenue', label: 'Hospitality', operational: true },
  { field: 'parkingRevenue', label: 'Parking', operational: true },
  { field: 'expRevenue', label: 'Experience', operational: true },
  { field: 'sponsorshipRevenue', label: 'Sponsorship', operational: false },
  { field: 'tixRevenue', label: 'Ticketing', operational: false },
];
export const GAMEDAY_METRICS = [
  { key: 'revenuePerGame', label: 'GameDay revenue / game', format: 'currency' },
  { key: 'avgAttendance', label: 'Average attendance', format: 'number' },
  { key: 'operationalPerPerson', label: 'Operational revenue / person', format: 'currency' },
  { key: 'fbPerPerson', label: 'F&B / person', format: 'currency' },
  { key: 'merchPerPerson', label: 'Merchandising / person', format: 'currency' },
  { key: 'hospitalityPerGame', label: 'Hospitality / game', format: 'currency' },
  { key: 'totalRevenue', label: 'Total GameDay revenue', format: 'currency' },
  { key: 'operationalPerGame', label: 'Operational revenue / game', format: 'currency' },
  { key: 'totalPerPerson', label: 'Total GameDay revenue / person', format: 'currency' },
  { key: 'fbPerGame', label: 'F&B / game', format: 'currency' },
  { key: 'merchPerGame', label: 'Merchandising / game', format: 'currency' },
  { key: 'parkingPerGame', label: 'Parking / game', format: 'currency' },
  { key: 'experiencePerGame', label: 'Experience / game', format: 'currency' },
  { key: 'sponsorshipPerGame', label: 'Sponsorship / game', format: 'currency' },
  { key: 'ticketingPerGame', label: 'Ticketing / game', format: 'currency' },
  { key: 'cagrRevenue', label: 'Revenue / game — Compound Annual Growth Rate', format: 'percent' },
  { key: 'cagrOperationalPerPerson', label: 'Operational revenue / person — Compound Annual Growth Rate', format: 'percent' },
] as const;
export type GameDayMetricKey = typeof GAMEDAY_METRICS[number]['key'];
export const DEFAULT_GAMEDAY_METRICS: GameDayMetricKey[] = ['revenuePerGame', 'avgAttendance', 'operationalPerPerson', 'fbPerPerson', 'merchPerPerson', 'hospitalityPerGame'];
export interface GameDaySelection {
  league: string;
  opponent: string;
  tier: string;
  week: number;
}
export interface GameDayCustomFilters {
  seasons: string[];
  leagues: string[];
  opponents: string[];
  tiers: string[];
  dates: string[];
}
export interface GameDayComparisonGroup {
  label: string;
  season?: string;
  games: GameDayData[];
  fixtureCount: number;
  missingFixtures: number;
}
export interface GameDayFixture {
  date: string;
  season: string;
  league: string;
  opponent: string;
  tier?: number;
  data?: GameDayData;
}

export const gameDaySeason = (season: string) => {
  const match = season.match(/(?:20)?(\d{2})\s*[-/]\s*(?:20)?(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : season.trim();
};
export const isGameDaySeason = (season: string) => {
  const normalized = gameDaySeason(season);
  return /^\d{2}-\d{2}$/.test(normalized) &&
    (Number(normalized.slice(0, 2)) + 1) % 100 === Number(normalized.slice(3, 5));
};
export const gameDayDate = (date: string): string => {
  const italian = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (italian) return `${italian[3]}-${italian[2].padStart(2, '0')}-${italian[1].padStart(2, '0')}`;
  const iso = date.match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : '';
};
const nameKey = (value: string) => value.trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const fixtureKey = (fixture: { season: string; league: string; date: string; opponent: string }) =>
  [gameDaySeason(fixture.season), nameKey(fixture.league), gameDayDate(fixture.date), nameKey(fixture.opponent)].join('|');
export const gameDayFixtureLabel = (fixture: { date: string; season: string; league: string; opponent: string }) =>
  `${fixture.date} · ${fixture.opponent} · ${fixture.league} · ${fixture.season}`;
export const gameDayToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Join by encounter, never by opponent alone. Retain schedule rows without
// commercial figures so a missing early game cannot shift historical YTD.
export function buildGameDayFixtures(data: GameDayData[], ticketing: GameData[], asOf = gameDayToday()): GameDayFixture[] {
  const fixtures = new Map<string, GameDayFixture>();
  ticketing.forEach(game => {
    const date = gameDayDate(game.date);
    if (!isGameDaySeason(game.season) || !date || date > asOf) return;
    fixtures.set(fixtureKey(game), { date: game.date, season: gameDaySeason(game.season), league: game.league, opponent: game.opponent, tier: game.tier });
  });
  data.forEach(game => {
    const date = gameDayDate(game.date);
    if (!isGameDaySeason(game.season) || !date || date > asOf) return;
    const key = fixtureKey(game);
    const previous = fixtures.get(key);
    fixtures.set(key, { ...previous, date: game.date, season: gameDaySeason(game.season), league: game.league, opponent: game.opponent, data: game });
  });
  return [...fixtures.values()].sort((a, b) => gameDayDate(a.date).localeCompare(gameDayDate(b.date)) || a.opponent.localeCompare(b.opponent));
}
export const gameDaySeasons = (data: GameDayData[], ticketing: GameData[]) =>
  [...new Set([...data, ...ticketing].map(game => gameDaySeason(game.season)).filter(isGameDaySeason))].sort();
const group = (label: string, fixtures: GameDayFixture[], season?: string): GameDayComparisonGroup => ({
  label, season, games: fixtures.flatMap(fixture => fixture.data ? [fixture.data] : []),
  fixtureCount: fixtures.length, missingFixtures: fixtures.filter(fixture => !fixture.data).length,
});
const includes = (values: string[], value: string) => values.includes('All') || values.some(selected => nameKey(selected) === nameKey(value));
export function selectGameDayCustom(fixtures: GameDayFixture[], filters: GameDayCustomFilters): GameDayFixture[] {
  return fixtures.filter(fixture =>
    includes(filters.seasons.map(gameDaySeason), fixture.season) &&
    includes(filters.leagues, fixture.league) &&
    includes(filters.opponents, fixture.opponent) &&
    (filters.tiers.includes('All') || (fixture.tier !== undefined && filters.tiers.includes(String(fixture.tier)))) &&
    (filters.dates.includes('All') || filters.dates.some(date => date.includes(' · ')
      ? date === gameDayFixtureLabel(fixture) : gameDayDate(date) === gameDayDate(fixture.date))));
}
export function buildGameDayGroups(
  fixtures: GameDayFixture[], seasons: string[], mode: GameDayComparisonMode,
  selection: GameDaySelection, customA: GameDayCustomFilters, customB: GameDayCustomFilters,
): GameDayComparisonGroup[] {
  if (mode === 'custom') return [group('A', selectGameDayCustom(fixtures, customA)), group('B', selectGameDayCustom(fixtures, customB))];
  const leagueFixtures = fixtures.filter(fixture => nameKey(fixture.league) === nameKey(selection.league));
  const orderedSeasons = [...seasons].sort();
  const currentSeason = orderedSeasons[orderedSeasons.length - 1];
  const ytdCount = leagueFixtures.filter(fixture => fixture.season === currentSeason).length;
  return [...seasons].sort().flatMap(season => {
    const seasonFixtures = leagueFixtures.filter(fixture => fixture.season === season);
    if (mode === 'opponent') {
      const matches = seasonFixtures.filter(fixture => nameKey(fixture.opponent) === nameKey(selection.opponent));
      return matches.length ? matches.map(fixture => group(`${season} · ${fixture.opponent} · ${fixture.date}`, [fixture], season))
        : [group(`${season} · ${selection.opponent || 'Select opponent'}`, [], season)];
    }
    if (mode === 'week') {
      const fixture = seasonFixtures[Math.max(1, selection.week) - 1];
      return [group(`${season} · Game ${selection.week}${fixture ? ` · ${fixture.opponent} · ${fixture.date}` : ''}`, fixture ? [fixture] : [], season)];
    }
    if (mode === 'tier') {
      return [group(`${season} · Tier ${selection.tier || '—'}`, seasonFixtures.filter(fixture => fixture.tier !== undefined && String(fixture.tier) === selection.tier), season)];
    }
    return [group(`${season} · First ${ytdCount} games`, seasonFixtures.slice(0, ytdCount), season)];
  });
}
export const hasGameDayValue = (game: GameDayData, field: GameDayValueField) =>
  game.reported?.[field] !== false && typeof game[field] === 'number' && Number.isFinite(game[field]);
export const gameDayCoverage = (group: GameDayComparisonGroup, field: GameDayValueField) =>
  group.games.filter(game => hasGameDayValue(game, field)).length;
export function sumGameDay(group: GameDayComparisonGroup, fields: GameDayValueField[]): number | null {
  if (!group.fixtureCount || group.missingFixtures || group.games.some(game => fields.some(field => !hasGameDayValue(game, field)))) return null;
  return group.games.reduce((total, game) => total + fields.reduce((sum, field) => sum + game[field], 0), 0);
}
const operationalFields = GAMEDAY_CHANNELS.filter(channel => channel.operational).map(channel => channel.field);
export const gameDayRevenueFields = (includeTicketing: boolean): GameDayRevenueField[] =>
  GAMEDAY_CHANNELS.filter(channel => includeTicketing || channel.field !== 'tixRevenue').map(channel => channel.field);
const ratio = (value: number | null, denominator: number | null) => value === null || denominator === null || denominator <= 0 ? null : value / denominator;
export function gameDayMetric(group: GameDayComparisonGroup, key: GameDayMetricKey, includeTicketing: boolean): number | null {
  const perGame = (fields: GameDayValueField[]) => ratio(sumGameDay(group, fields), group.fixtureCount);
  const perPerson = (fields: GameDayValueField[]) => ratio(sumGameDay(group, fields), sumGameDay(group, ['attendance']));
  switch (key) {
    case 'totalRevenue': return sumGameDay(group, gameDayRevenueFields(includeTicketing));
    case 'revenuePerGame': return perGame(gameDayRevenueFields(includeTicketing));
    case 'avgAttendance': return perGame(['attendance']);
    case 'operationalPerGame': return perGame(operationalFields);
    case 'operationalPerPerson': return perPerson(operationalFields);
    case 'totalPerPerson': return perPerson(gameDayRevenueFields(includeTicketing));
    case 'fbPerPerson': return perPerson(['fbRevenue']);
    case 'merchPerPerson': return perPerson(['merchRevenue']);
    case 'fbPerGame': return perGame(['fbRevenue']);
    case 'merchPerGame': return perGame(['merchRevenue']);
    case 'hospitalityPerGame': return perGame(['hospitalityRevenue']);
    case 'parkingPerGame': return perGame(['parkingRevenue']);
    case 'experiencePerGame': return perGame(['expRevenue']);
    case 'sponsorshipPerGame': return perGame(['sponsorshipRevenue']);
    case 'ticketingPerGame': return includeTicketing ? perGame(['tixRevenue']) : null;
    default: return null;
  }
}
export function gameDayMetricValues(groups: GameDayComparisonGroup[], key: GameDayMetricKey, includeTicketing: boolean, temporal: boolean): (number | null)[] {
  if (!key.startsWith('cagr')) return groups.map(group => gameDayMetric(group, key, includeTicketing));
  if (!temporal) return groups.map(() => null);
  const underlying = key === 'cagrRevenue' ? 'revenuePerGame' : 'operationalPerPerson';
  const values = groups.map(group => gameDayMetric(group, underlying, includeTicketing));
  const baselineIndex = values.findIndex(value => value !== null && value > 0);
  if (baselineIndex < 0) return groups.map(() => null);
  const baselineYear = Number(groups[baselineIndex].season?.slice(0, 2));
  return groups.map((group, index) => {
    const years = Number(group.season?.slice(0, 2)) - baselineYear;
    const value = values[index];
    // A repeated encounter in one season is not an annual growth series.
    if (groups.filter(other => other.season === group.season).length > 1 || groups.filter(other => other.season === groups[baselineIndex].season).length > 1) return null;
    return years > 0 && value !== null && value >= 0
      ? 100 * ((value / values[baselineIndex]!) ** (1 / years) - 1) : null;
  });
}
export function gameDayDelta(value: number | null, previous: number | null): number | null {
  return value === null || previous === null || previous === 0 ? null : (value - previous) / Math.abs(previous) * 100;
}
export function gameDayChannelRows(group: GameDayComparisonGroup, includeTicketing: boolean) {
  const total = sumGameDay(group, gameDayRevenueFields(includeTicketing));
  const attendance = sumGameDay(group, ['attendance']);
  return GAMEDAY_CHANNELS.filter(channel => includeTicketing || channel.field !== 'tixRevenue').map(channel => {
    const revenue = sumGameDay(group, [channel.field]);
    return { ...channel, revenue, perGame: ratio(revenue, group.fixtureCount), perPerson: ratio(revenue, attendance),
      share: ratio(revenue === null ? null : revenue * 100, total), coverage: gameDayCoverage(group, channel.field) };
  });
}
export function gameDayTrend(points: { x: number; y: number }[]): ((x: number) => number) | null {
  if (points.length < 2) return null;
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const divisor = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  if (!divisor) return null;
  const slope = points.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0) / divisor;
  return x => meanY + slope * (x - meanX);
}