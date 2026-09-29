import React from 'react';
import { ComparisonReportGroup } from './comparisonReport';
import { COMPARISON_METRICS, ComparisonMetricKey, metricDisplayTitle } from './comparisonMetrics';
import { ComparisonTrendChart } from './ComparisonTrendChart';

interface ComparisonQuadrantProps {
  groups: ComparisonReportGroup[];
  highlightLabels?: string[];
  selectedMetrics: ComparisonMetricKey[];
  showTrend?: boolean;
  perGame?: boolean;
}

export const ComparisonQuadrant: React.FC<ComparisonQuadrantProps> = ({
  groups, highlightLabels = [], selectedMetrics, showTrend = false, perGame = false,
}) => {
  const visible = selectedMetrics.map(key => COMPARISON_METRICS.find(metric => metric.key === key))
    .filter((metric): metric is typeof COMPARISON_METRICS[number] => Boolean(metric));

  return (
    <div className={`grid grid-cols-1 gap-4 ${visible.length > 1 ? 'lg:grid-cols-2' : ''}`}
      aria-label="Ticketing performance comparison charts">
      {visible.map((metric, index) => (
        <section key={`${metric.key}-${index}`} aria-labelledby={`comparison-chart-${index}`}
          className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-5">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                0{index + 1} / 0{visible.length}
              </p>
              <h3 id={`comparison-chart-${index}`} className="text-base font-bold text-gray-900 dark:text-white">
                {metricDisplayTitle(metric.key, perGame)}
              </h3>
            </div>
            <span className="shrink-0 rounded-md bg-gray-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {metric.unit}
            </span>
          </div>
          <ComparisonTrendChart groups={groups} metricKey={metric.key}
            highlightLabels={highlightLabels} showTrend={showTrend} perGame={perGame} />
        </section>
      ))}
    </div>
  );
};

export default ComparisonQuadrant;