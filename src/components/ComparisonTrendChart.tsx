import React, { useMemo } from 'react';
import {
  Bar, CartesianGrid, Cell, ComposedChart, LabelList, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ComparisonReportGroup } from './comparisonReport';
import { COMPARISON_METRICS, ComparisonMetricKey, fitLinearTrend, getComparisonSeriesValues, isCagrMetric, metricDisplayTitle } from './comparisonMetrics';

interface Props {
  groups: ComparisonReportGroup[];
  metricKey: ComparisonMetricKey;
  highlightLabels: string[];
  showTrend: boolean;
  perGame?: boolean;
}

const lineColors = ['#0f766e', '#7c3aed'];
const seriesName = (label: string) => label.includes(' · ') ? label.split(' · ').slice(1).join(' · ') : 'Season trend';

export const ComparisonTrendChart: React.FC<Props> = ({ groups, metricKey, highlightLabels, showTrend, perGame = false }) => {
  const metric = COMPARISON_METRICS.find(item => item.key === metricKey)!;
  const title = metricDisplayTitle(metricKey, perGame);
  const { rows, trends, minValue, maxValue } = useMemo(() => {
    // Historical seasons read left to right; current season is the last column.
    const ordered = showTrend ? [...groups].reverse() : groups;
    const names = [...new Set(ordered.map(group => seriesName(group.label)))];
    const values = getComparisonSeriesValues(ordered, metricKey, perGame, showTrend);
    const actual = ordered.map((group, index) => {
      return {
        label: group.label,
        value: values[index],
        highlight: highlightLabels.includes(group.label),
      };
    });
    const series = showTrend
      ? names.flatMap((name, index) => {
        const points = actual.flatMap((row, x) =>
          seriesName(row.label) === name && row.value !== null ? [{ x, y: row.value }] : []);
        const fit = fitLinearTrend(points);
        if (!fit) return [];
        const first = ordered.findIndex(group => seriesName(group.label) === name);
        const last = ordered.length - 1 - [...ordered].reverse().findIndex(group => seriesName(group.label) === name);
        return [{ name, key: `trend${index}`, first, last, start: fit(first), end: fit(last) }];
      })
      : [];
    const data = actual.map((row, index) => ({
      ...row,
      ...Object.fromEntries(series.map(trend =>
        [trend.key, index === trend.first ? trend.start : index === trend.last ? trend.end : null])),
    }));
    return {
      rows: data,
      trends: series,
      minValue: Math.min(0, ...data.map(row => row.value ?? 0), ...series.flatMap(trend => [trend.start, trend.end])),
      maxValue: Math.max(1, ...data.map(row => row.value ?? 0), ...series.flatMap(trend => [trend.start, trend.end])),
    };
  }, [groups, metricKey, highlightLabels, showTrend, perGame]);

  if (!groups.length) {
    return <div className="flex min-h-56 items-center justify-center text-sm text-gray-500 dark:text-gray-400">No comparison data yet.</div>;
  }

  return (
    <div className="px-3 pb-4 pt-3 sm:px-4" role="img" aria-label={`${title} vertical columns${trends.length ? ' and linear regression trend line' : ''}`}>
      <div className="overflow-x-auto">
      <div style={{ height: Math.max(332, rows.length * 34 + 210), minWidth: rows.length > 4 ? rows.length * 65 : 310 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 29, right: 12, bottom: 0, left: 0 }} barCategoryGap="31%">
            <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#e5e7eb" />
            <XAxis type="category" dataKey="label" interval={0} height={90}
              angle={-35} textAnchor="end"
              tickFormatter={label => String(label).length > 19 ? `${String(label).slice(0, 17)}…` : String(label)}
              tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis type="number" width={67} domain={[minValue < 0 ? minValue * 1.12 : 0, maxValue * 1.12]}
              tickFormatter={metric.axisFormat}
              tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
              content={({ active, payload, label }) => {
                const value = payload?.find(item => item.dataKey === 'value')?.value;
                return active && value !== undefined && value !== null
                  ? <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                      <p className="font-semibold">{label}</p><p>{metric.format(Number(value))}</p>
                    </div>
                  : null;
              }}
            />
            <Bar dataKey="value" name={title} maxBarSize={38} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {rows.map(row => <Cell key={row.label} fill={row.highlight ? '#dc2626' : '#94a3b8'} />)}
              <LabelList dataKey="value" position="top"
                formatter={(value: number | null) => value === null || value === undefined ? '' : metric.format(Number(value))}
                style={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} />
            </Bar>
            {trends.map((trend, index) =>
              <Line key={trend.key} dataKey={trend.key} type="linear" connectNulls
                stroke={lineColors[index % lineColors.length]} strokeWidth={2.5}
                dot={false} activeDot={false}
                isAnimationActive={false} legendType="none" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      </div>
      {trends.length > 0 && <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 pr-2 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
        {trends.map((trend, index) => <span key={trend.key} className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2" style={{ borderColor: lineColors[index % lineColors.length] }} />
          {trend.name === 'Season trend' ? 'Linear trend · oldest → newest' : `${trend.name} · linear trend`}
        </span>)}
      </div>}
      {isCagrMetric(metricKey) && showTrend && <p className="pt-1 text-center text-xs text-gray-500 dark:text-gray-400">
        Annualized growth from the earliest matching season with a positive value.
      </p>}
      {!rows.some(row => row.value !== null) && <p className="text-center text-xs text-gray-500">
        {isCagrMetric(metricKey) ? (showTrend
          ? 'CAGR needs a later season with matching games and a positive baseline.'
          : 'CAGR is only available in seasonal comparisons, not Custom A/B.') : 'No data for this metric.'}
      </p>}
    </div>
  );
};