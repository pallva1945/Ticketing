import { GameData, SalesChannel, TicketZone } from '../types';
import type { ComparisonReportGroup } from './comparisonReport';
import { calculateKPIs } from './StatsCards';

export interface ComparisonMetrics {
  revenue: number | null;
  attendance: number | null;
  yield: number | null;
  loadFactor: number | null;
}

export type ComparisonMetricKey = string;

export const COMPARISON_METRICS: {
  key: ComparisonMetricKey;
  title: string;
  unit: string;
  category: string;
  format: (value: number) => string;
  axisFormat: (value: number) => string;
}[] = [
  {
    key: 'revenue', title: 'Total revenue', unit: 'EUR', category: 'Core metrics',
    format: value => `€${value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`,
    axisFormat: value => `€${Math.round(value / 1000)}k`,
  },
  {
    key: 'attendance', title: 'Total attendance', unit: 'people', category: 'Core metrics',
    format: value => value.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    axisFormat: value => value.toLocaleString(undefined, { maximumFractionDigits: 0 }),
  },
  {
    key: 'yield', title: 'Average price (Yield)', unit: 'EUR / ticket', category: 'Core metrics',
    format: value => `€${value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`,
    axisFormat: value => `€${Math.round(value)}`,
  },
  {
    key: 'loadFactor', title: 'Load factor', unit: 'capacity', category: 'Core metrics',
    format: value => `${value.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`,
    axisFormat: value => `${Math.round(value)}%`,
  },
];

const money = COMPARISON_METRICS[0];
const people = COMPARISON_METRICS[1];
const percent = COMPARISON_METRICS[3];
COMPARISON_METRICS.push(
  { ...percent, key: 'cagrRevenue', title: 'Revenue · Compound Annual Growth Rate (CAGR)', unit: 'annualized', category: 'Growth',
    format: value => `${value > 0 ? '+' : ''}${value.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`,
    axisFormat: value => `${Math.round(value)}%` },
  { ...percent, key: 'cagrYield', title: 'Yield · Compound Annual Growth Rate (CAGR)', unit: 'annualized', category: 'Growth',
    format: value => `${value > 0 ? '+' : ''}${value.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`,
    axisFormat: value => `${Math.round(value)}%` },
  { ...money, key: 'revenuePerGame', title: 'Average revenue / game', category: 'Other KPIs' },
  { ...people, key: 'attendancePerGame', title: 'Average attendance / game', category: 'Other KPIs' },
  { ...money, key: 'revPas', title: 'RevPAS', unit: 'EUR / seat', category: 'Other KPIs',
    axisFormat: value => `€${Math.round(value)}` },
  { ...percent, key: 'giveawayRate', title: 'Giveaway %', unit: 'tickets', category: 'Other KPIs' },
  { ...people, key: 'giveaways', title: 'Giveaway tickets', category: 'Other KPIs' },
  { ...people, key: 'ticketsSold', title: 'Tickets issued', category: 'Other KPIs' },
  { ...percent, key: 'corpShare', title: 'Corporate revenue %', unit: 'revenue', category: 'Other KPIs' },
  { ...money, key: 'corpRevenue', title: 'Corporate revenue', category: 'Other KPIs' },
  { ...people, key: 'gameCount', title: 'Games', category: 'Other KPIs' },
);

for (const zone of Object.values(TicketZone)) {
  COMPARISON_METRICS.push(
    { ...money, key: `zone:${zone}:revenue`, title: `${zone} · revenue`, category: zone },
    { ...people, key: `zone:${zone}:attendance`, title: `${zone} · attendance`, category: zone },
    { ...money, key: `zone:${zone}:yield`, title: `${zone} · yield`, unit: 'EUR / ticket', category: zone,
      axisFormat: value => `€${Math.round(value)}` },
    { ...percent, key: `zone:${zone}:loadFactor`, title: `${zone} · load factor`, category: zone },
    { ...percent, key: `zone:${zone}:giveawayRate`, title: `${zone} · giveaway %`, unit: 'tickets', category: zone },
  );
}

// Least-squares fit across observed seasons; missing metrics are excluded, never treated as zero.
export function fitLinearTrend(points: { x: number; y: number }[]) {
  if (points.length < 2) return null;
  const xMean = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const yMean = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const denominator = points.reduce((sum, point) => sum + (point.x - xMean) ** 2, 0);
  if (denominator === 0) return null;
  const slope = points.reduce((sum, point) => sum + (point.x - xMean) * (point.y - yMean), 0) / denominator;
  return (x: number) => yMean + slope * (x - xMean);
}

export function getComparisonMetrics(games: GameData[]): ComparisonMetrics {
  const stats = calculateKPIs(games);
  if (!stats) return { revenue: null, attendance: null, yield: null, loadFactor: null };

  const ticketCount = games.reduce((total, game) =>
    total + game.salesBreakdown.reduce((sum, sale) => sum + sale.quantity, 0), 0);
  const capacity = games.reduce((total, game) => total + game.capacity, 0);

  return {
    revenue: stats.totalRevenue,
    attendance: stats.totalAttendance,
    yield: ticketCount > 0 ? stats.yield_atp : null,
    loadFactor: capacity > 0 ? stats.occupancy : null,
  };
}

export function metricDisplayTitle(key: ComparisonMetricKey, perGame = false): string {
  const title = COMPARISON_METRICS.find(metric => metric.key === key)?.title || key;
  if (!perGame) return title;
  if (key === 'cagrRevenue') return 'Revenue / game · Compound Annual Growth Rate (CAGR)';
  if (key === 'revenue') return 'Average revenue / game';
  if (key === 'attendance') return 'Average attendance / game';
  if (['giveaways', 'ticketsSold', 'corpRevenue'].includes(key) || /^zone:.+:(revenue|attendance)$/.test(key))
    return `${title} / game`;
  return title;
}

function getRawMetricValue(games: GameData[], key: ComparisonMetricKey): number | null {
  if (!games.length) return null;
  const stats = calculateKPIs(games)!;
  if (key === 'revenue' || key === 'attendance' || key === 'yield' || key === 'loadFactor')
    return getComparisonMetrics(games)[key];

  const sales = games.flatMap(game => game.salesBreakdown);
  const giveaways = sales.filter(item =>
    item.channel === SalesChannel.GIVEAWAY || item.channel === SalesChannel.PROTOCOL);
  switch (key) {
    case 'revenuePerGame': return stats.arpg;
    case 'attendancePerGame': return stats.totalAttendance / stats.gameCount;
    case 'revPas': return games.some(game => game.capacity > 0) ? stats.revPas : null;
    case 'giveawayRate': return stats.totalAttendance > 0 ? stats.giveawayRate : null;
    case 'giveaways': return giveaways.reduce((sum, item) => sum + item.quantity, 0);
    case 'ticketsSold': return sales.reduce((sum, item) => sum + item.quantity, 0);
    case 'corpShare': return stats.totalRevenue > 0 ? stats.corpShare : null;
    case 'corpRevenue': return sales.filter(item => item.channel === SalesChannel.CORP).reduce((sum, item) => sum + item.revenue, 0);
    case 'gameCount': return stats.gameCount;
  }
  const match = /^zone:(.+):(revenue|attendance|yield|loadFactor|giveawayRate)$/.exec(key);
  if (!match) return null;
  const [, zone, metric] = match;
  const zoneSales = sales.filter(item => item.zone === zone);
  const exists = games.some(game => Object.prototype.hasOwnProperty.call(game.zoneCapacities || {}, zone)) || zoneSales.length > 0;
  if (!exists) return null;
  const revenue = zoneSales.reduce((sum, item) => sum + item.revenue, 0);
  const attendance = zoneSales.reduce((sum, item) => sum + item.quantity, 0);
  const capacity = games.reduce((sum, game) => sum + (game.zoneCapacities?.[zone] || 0), 0);
  switch (metric) {
    case 'revenue': return revenue;
    case 'attendance': return attendance;
    case 'yield': return attendance > 0 ? revenue / attendance : null;
    case 'loadFactor': return capacity > 0 ? attendance / capacity * 100 : null;
    case 'giveawayRate': return attendance > 0
      ? zoneSales.filter(item => item.channel === SalesChannel.GIVEAWAY || item.channel === SalesChannel.PROTOCOL)
          .reduce((sum, item) => sum + item.quantity, 0) / attendance * 100
      : null;
  }
  return null;
}

export function getMetricValue(games: GameData[], key: ComparisonMetricKey, perGame = false): number | null {
  const value = getRawMetricValue(games, key);
  if (value === null || !perGame) return value;
  if (['revenue', 'attendance', 'giveaways', 'ticketsSold', 'corpRevenue'].includes(key) ||
    /^zone:.+:(revenue|attendance)$/.test(key)) return value / games.length;
  return value;
}

export const isCagrMetric = (key: ComparisonMetricKey) =>
  key === 'cagrRevenue' || key === 'cagrYield';

// Input groups are ordered oldest to newest. Each observed season's CAGR is
// annualized against the earliest positive season for that same fixture.
export function getComparisonSeriesValues(
  groups: ComparisonReportGroup[], key: ComparisonMetricKey, perGame: boolean, showTrend: boolean,
): (number | null)[] {
  if (!isCagrMetric(key)) return groups.map(group => group.missingFixtures ? null : getMetricValue(group.games, key, perGame));
  if (!showTrend) return groups.map(() => null); // Custom A/B is not a seasonal series.
  const baseKey = key === 'cagrRevenue' ? 'revenue' : 'yield';
  const series = groups.map(group => {
    const match = /^(\d{2,4})[-/]\d{2,4}(?: · (.+))?$/.exec(group.label);
    const year = match ? Number(match[1]) : NaN;
    return {
      year: year < 100 ? year + 2000 : year,
      fixture: group.seriesKey ?? match?.[2] ?? '',
      base: group.missingFixtures ? null : getMetricValue(group.games, baseKey, perGame),
    };
  });
  return series.map(current => {
    const baseline = series.find(row => row.fixture === current.fixture &&
      Number.isFinite(row.year) && row.base !== null && row.base > 0);
    if (current.base === null || current.base < 0 || !baseline || current.year <= baseline.year) return null;
    return (Math.pow(current.base / baseline.base!, 1 / (current.year - baseline.year)) - 1) * 100;
  });
}

export function getYoYMarkers(
  groups: ComparisonReportGroup[], key: ComparisonMetricKey, perGame: boolean, showTrend: boolean,
): { from: string; to: string; fixture: string; value: number }[] {
  if (!showTrend) return [];
  const baseKey = key === 'cagrRevenue' ? 'revenue' : key === 'cagrYield' ? 'yield' : key;
  const rows = groups.map(group => {
    const match = /^(\d{2,4})[-/]\d{2,4}(?: · (.+))?$/.exec(group.label);
    const year = match ? Number(match[1]) : NaN;
    return {
      label: group.label,
      year: year < 100 ? year + 2000 : year,
      fixture: group.seriesKey ?? match?.[2] ?? '',
      value: group.missingFixtures ? null : getMetricValue(group.games, baseKey, perGame),
    };
  });
  return rows.flatMap(current => {
    const previous = rows.find(row => row.year === current.year - 1 && row.fixture === current.fixture);
    if (!previous || previous.value === null || previous.value <= 0 ||
      current.value === null || !Number.isFinite(current.year)) return [];
    return [{
      from: previous.label.split(' · ')[0], to: current.label.split(' · ')[0],
      fixture: current.fixture, value: (current.value / previous.value - 1) * 100,
    }];
  });
}