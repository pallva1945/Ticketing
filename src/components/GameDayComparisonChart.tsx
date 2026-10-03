import React, { useMemo } from 'react';
import {
  Bar, CartesianGrid, Cell, ComposedChart, LabelList, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  gameDayMetricValues, gameDayTrend, GAMEDAY_METRICS, type GameDayComparisonGroup,
  type GameDayMetricKey,
} from '../utils/gameDayComparison';

interface Props {
  groups: GameDayComparisonGroup[];
  metricKey: GameDayMetricKey;
  includeTicketing: boolean;
  seasonal: boolean;
  translate?: (label: string) => string;
}

const formatValue = (value: number, key: GameDayMetricKey, locale: string) => {
  if (key === 'avgAttendance') return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
  if (key.startsWith('cagr')) return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);
};

const axisValue = (value: number, key: GameDayMetricKey, locale: string) =>
  key === 'avgAttendance'
    ? new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
    : key.startsWith('cagr') ? `${Math.round(value)}%` : `€${new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)}`;

const yearOf = (season?: string) => {
  const match = season?.match(/(?:^|)(\d{2,4})[-/]/);
  if (!match) return null;
  const year = Number(match[1]);
  return year < 100 ? 2000 + year : year;
};

export const GameDayComparisonChart: React.FC<Props> = ({ groups, metricKey, includeTicketing, seasonal, translate = label => label }) => {
  const values = gameDayMetricValues(groups, metricKey, includeTicketing, seasonal);
  const metricTitle = metricKey === 'totalRevenue' && seasonal
    ? translate('Average GameDay revenue / fixture')
    : translate(GAMEDAY_METRICS.find(metric => metric.key === metricKey)?.label || metricKey);
  const chartRows = useMemo(() => {
    const base = groups.map((group, index) => ({
      label: group.label,
      value: values[index],
      group,
      year: yearOf(group.season),
    }));
    const sameSeasonRepeated = base.some((row, index) =>
      Boolean(row.group.season && base.some((other, otherIndex) => otherIndex !== index && other.group.season === row.group.season)));
    const canTrend = seasonal && !sameSeasonRepeated;
    const points = canTrend ? base.flatMap(row => {
      const y = row.value;
      return y !== null && y !== undefined && row.year !== null ? [{ x: row.year, y }] : [];
    }) : [];
    const trend = gameDayTrend(points);
    return base.map(row => ({
      ...row,
      trend: trend && row.year !== null ? trend(row.year) : null,
    }));
  }, [groups, values, seasonal, metricKey]);
  const actualValues = chartRows.flatMap(row => row.value === null ? [] : [row.value]);
  const trendValues = chartRows.flatMap(row => row.trend === null ? [] : [row.trend]);
  const min = Math.min(0, ...actualValues, ...trendValues);
  const max = Math.max(1, ...actualValues, ...trendValues);
  const hasTrend = chartRows.some(row => row.trend !== null);
  const locale = typeof navigator !== 'undefined' && navigator.language.startsWith('it') ? 'it-IT' : 'en-GB';
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const axisColor = dark ? '#a8b4c3' : '#526173';
  const gridColor = dark ? '#354252' : '#e8edf2';

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{translate('GameDay metric')}</p>
          <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">{metricTitle}</h3>
        </div>
        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">
          {chartRows.filter(row => row.value !== null).length} {translate(chartRows.filter(row => row.value !== null).length === 1 ? 'group with data' : 'groups with data')}
        </span>
      </div>
      {groups.length ? <div className="px-2 pb-4 pt-3 sm:px-4" role="img" aria-label={`${metricTitle}, vertical column comparison${hasTrend ? ' with calculated linear regression trend' : ''}`}>
        <div className="overflow-x-auto">
          <div style={{ height: Math.max(320, chartRows.length * 42 + 190), minWidth: Math.max(320, chartRows.length * 74) }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartRows} margin={{ top: 28, right: 18, bottom: 0, left: 2 }} barCategoryGap="34%">
                <CartesianGrid strokeDasharray="3 5" vertical={false} stroke={gridColor} />
                <XAxis dataKey="label" interval={0} height={92} angle={-33} textAnchor="end"
                  tickFormatter={label => String(label).length > 25 ? `${String(label).slice(0, 22)}…` : String(label)}
                  tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis width={74} domain={[min < 0 ? min * 1.12 : 0, max * 1.13]}
                  tickFormatter={value => axisValue(Number(value), metricKey, locale)}
                  tick={{ fontSize: 10, fill: dark ? '#8c99aa' : '#788596' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: dark ? '#334155' : '#f6f8fa' }} content={({ active, payload, label }) => {
                  const row = payload?.[0]?.payload as typeof chartRows[number] | undefined;
                  if (!active || !row) return null;
                  const value = row.value;
                  return <div className="max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-rose-700 dark:text-rose-300">{value === null ? '—' : formatValue(value, metricKey, locale)}</p>
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{row.group.games.length} / {row.group.fixtureCount} {translate('fixtures have commercial data')}</p>
                  </div>;
                }} />
                <Bar dataKey="value" name={metricTitle} maxBarSize={42} radius={[5, 5, 0, 0]} isAnimationActive={false}>
                  {chartRows.map((row, index) => <Cell key={`${row.label}-${index}`} fill={row.value === null ? (dark ? '#344154' : '#e8edf2') : '#c84a52'} />)}
                  <LabelList dataKey="value" position="top" formatter={(value: number | null) =>
                    value === null || value === undefined ? '—' : formatValue(Number(value), metricKey, locale)}
                    style={{ fontSize: 9, fill: dark ? '#cbd5e1' : '#49586a', fontWeight: 700 }} />
                </Bar>
                {hasTrend && <Line dataKey="trend" name="Linear regression" type="linear" stroke="#176c67"
                  strokeWidth={2.5} dot={false} activeDot={false} connectNulls isAnimationActive={false} />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        {hasTrend && <p className="mt-2 text-right text-[10px] font-medium text-teal-800 dark:text-teal-300">{translate('Linear least-squares trend · fitted against season year')}</p>}
        {!chartRows.some(row => row.value !== null) && <p className="px-3 pb-2 text-center text-xs text-slate-500 dark:text-slate-400">{translate('No reported values for this metric in the selected groups.')}</p>}
        {metricKey.startsWith('cagr') && <p className="px-3 pb-1 text-center text-[11px] text-slate-500 dark:text-slate-400">{translate('CAGR is available only for seasonal comparisons; Custom A/B has no temporal growth interpretation.')}</p>}
        {metricKey === 'ticketingPerGame' && !includeTicketing && <p className="px-3 pb-1 text-center text-[11px] text-slate-500 dark:text-slate-400">{translate('Ticketing is excluded from this comparison.')}</p>}
      </div> : <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">{translate('No groups available for this comparison.')}</div>}
    </section>
  );
};