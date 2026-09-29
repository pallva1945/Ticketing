import React, { useMemo } from 'react';
import { ComparisonReportGroup } from './comparisonReport';
import { getComparisonMetrics } from './comparisonMetrics';

interface ComparisonQuadrantProps {
  groups: ComparisonReportGroup[];
  highlightLabels?: string[];
}

type MetricKey = 'revenue' | 'attendance' | 'yield' | 'loadFactor';

const metricDefinitions: {
  key: MetricKey;
  title: string;
  unit: string;
  format: (value: number) => string;
}[] = [
  {
    key: 'revenue',
    title: 'Total revenue',
    unit: 'EUR',
    format: value => `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    key: 'attendance',
    title: 'Total attendance',
    unit: 'people',
    format: value => value.toLocaleString(undefined, { maximumFractionDigits: 0 }),
  },
  {
    key: 'yield',
    title: 'Average price (Yield)',
    unit: 'EUR / ticket',
    format: value => `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    key: 'loadFactor',
    title: 'Load factor',
    unit: 'capacity',
    format: value => `${value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
  },
];

export const ComparisonQuadrant: React.FC<ComparisonQuadrantProps> = ({
  groups,
  highlightLabels = [],
}) => {
  const comparisonData = useMemo(
    () => groups.map(group => ({
      ...group,
      metrics: getComparisonMetrics(group.games),
    })),
    [groups],
  );
  const highlights = useMemo(() => new Set(highlightLabels), [highlightLabels]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Ticketing performance comparison charts">
      {metricDefinitions.map((metric, metricIndex) => {
        const values = comparisonData
          .map(group => group.metrics[metric.key])
          .filter((value): value is number => value !== null);
        const maxValue = Math.max(0, ...values);

        return (
          <section
            key={metric.key}
            aria-labelledby={`comparison-chart-${metric.key}`}
            className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-5">
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                  0{metricIndex + 1} / 04
                </p>
                <h3 id={`comparison-chart-${metric.key}`} className="text-base font-bold text-gray-900 dark:text-white">
                  {metric.title}
                </h3>
              </div>
              <span className="shrink-0 rounded-md bg-gray-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {metric.unit}
              </span>
            </div>

            {comparisonData.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center px-5 py-8 text-center">
                <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
                  Add comparison groups to see {metric.title.toLowerCase()} by selection.
                </p>
              </div>
            ) : (
              <div className="space-y-4 px-4 py-4 sm:px-5" role="list" aria-label={`${metric.title} by comparison group`}>
                {comparisonData.map((group, index) => {
                  const value = group.metrics[metric.key];
                  const isHighlighted = highlights.has(group.label);
                  const width = value === null || maxValue === 0 ? 0 : Math.max(0, Math.min(100, (value / maxValue) * 100));

                  return (
                    <div
                      key={`${group.label}-${index}`}
                      role="listitem"
                      className={`min-w-0 rounded-lg border px-3 py-2.5 transition-colors ${
                        isHighlighted
                          ? 'border-red-200 bg-red-50/70 dark:border-red-900/70 dark:bg-red-950/30'
                          : 'border-transparent bg-gray-50/80 dark:bg-gray-800/60'
                      }`}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span
                            aria-hidden="true"
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              isHighlighted ? 'bg-red-600 dark:bg-red-400' : 'bg-slate-400 dark:bg-slate-500'
                            }`}
                          />
                          <span
                            className={`min-w-0 break-words text-sm leading-5 ${
                              isHighlighted
                                ? 'font-semibold text-gray-900 dark:text-white'
                                : 'font-medium text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {group.label}
                          </span>
                        </div>
                        <span className={`shrink-0 whitespace-nowrap text-right font-mono text-xs tabular-nums sm:text-sm ${
                          value === null
                            ? 'text-gray-400 dark:text-gray-500'
                            : isHighlighted
                              ? 'font-bold text-red-700 dark:text-red-300'
                              : 'font-semibold text-gray-800 dark:text-gray-200'
                        }`}>
                          {value === null ? '—' : metric.format(value)}
                        </span>
                      </div>
                      <div
                        className="ml-[18px] mt-2 h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                        role="progressbar"
                        aria-label={`${metric.title} for ${group.label}`}
                        aria-valuemin={0}
                        aria-valuemax={maxValue || 1}
                        aria-valuenow={value === null ? undefined : value}
                        aria-valuetext={value === null ? 'No data' : metric.format(value)}
                      >
                        {value !== null && (
                          <div
                            className={`h-3 rounded-full transition-[width] duration-500 ${
                              isHighlighted ? 'bg-red-600 dark:bg-red-400' : 'bg-slate-400 dark:bg-slate-500'
                            }`}
                            style={{ width: `${width}%` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default ComparisonQuadrant;