import { GameData } from '../types';
import { COMPARISON_METRICS, ComparisonMetricKey, fitLinearTrend, getMetricValue, metricDisplayTitle } from './comparisonMetrics';

export interface ComparisonReportGroup {
  label: string;
  games: GameData[];
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character] || character);

const euro = (value: number) => `€${value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
const seriesName = (label: string) => label.includes(' · ') ? label.split(' · ').slice(1).join(' · ') : 'Season trend';

export function printComparisonReport(
  title: string, subtitle: string, groups: ComparisonReportGroup[],
  highlightLabels: string[] = [groups[0]?.label],
  selectedMetrics: ComparisonMetricKey[] = COMPARISON_METRICS.map(metric => metric.key),
  showTrend = false,
  perGame = false,
) {
  const popup = window.open('', '_blank');
  if (!popup) {
    window.alert('Please allow pop-ups to print or save this comparison as a PDF.');
    return;
  }
  let printRequested = false;
  const requestPrint = () => {
    if (printRequested) return;
    printRequested = true;
    popup.focus();
    popup.print();
  };
  popup.addEventListener('load', requestPrint, { once: true });

  const charts = selectedMetrics.map(key => COMPARISON_METRICS.find(chart => chart.key === key))
    .filter((chart): chart is typeof COMPARISON_METRICS[number] => Boolean(chart));
  const metrics = (showTrend ? [...groups].reverse() : groups)
    .map(group => ({
      ...group,
      values: Object.fromEntries(charts.map(chart => [chart.key, getMetricValue(group.games, chart.key, perGame)])) as Record<string, number | null>,
    }));
  const chartMarkup = charts.map(chart => {
    const names = [...new Set(metrics.map(group => seriesName(group.label)))];
    const trends = showTrend ? names.flatMap((name, index) => {
      const points = metrics.flatMap((group, x) =>
        seriesName(group.label) === name && group.values[chart.key] !== null
          ? [{ x, y: group.values[chart.key]! }] : []);
      const fit = fitLinearTrend(points);
      if (!fit) return [];
      return [{ index, first: points[0].x, last: points[points.length - 1].x,
        start: fit(points[0].x), end: fit(points[points.length - 1].x) }];
    }) : [];
    const max = Math.max(1, ...metrics.map(group => group.values[chart.key] ?? 0),
      ...trends.flatMap(trend => [trend.start, trend.end])) * 1.12;
    const lines = trends.map(trend => {
      const color = trend.index % 2 === 0 ? '#0f766e' : '#7c3aed';
      const x1 = (trend.first + 0.5) * 100;
      const x2 = (trend.last + 0.5) * 100;
      return `<line x1="${x1}" y1="${100 - trend.start / max * 100}" x2="${x2}" y2="${100 - trend.end / max * 100}" ` +
        `stroke="${color}" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`;
    }).join('');
    const columns = metrics.map(group => {
        const value = group.values[chart.key];
        const height = value === null ? 0 : Math.max(0, Math.min(100, value / max * 100));
        return `<div class="column"><span class="column-value" style="bottom:${height}%">${value === null ? '—' : chart.format(value)}</span>` +
          `<div class="column-bar ${highlightLabels.includes(group.label) ? 'current' : ''}" style="height:${height}%"></div></div>`;
      }).join('');
    const labels = metrics.map(group => `<span title="${escapeHtml(group.label)}">${escapeHtml(group.label)}</span>`).join('');
    return `<section class="chart"><h2>${escapeHtml(metricDisplayTitle(chart.key, perGame))}</h2><div class="plot">` + columns +
      (lines ? `<svg class="trend-overlay" viewBox="0 0 ${metrics.length * 100} 100" preserveAspectRatio="none" aria-label="Linear season trend">${lines}</svg>` : '') +
      `</div><div class="category-labels">${labels}</div></section>`;
  }).join('');

  const detailRows = groups.flatMap(({ label, games }) =>
    games.map(game => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(game.date)}</td>` +
      `<td>${escapeHtml(game.opponent)}</td><td>${escapeHtml(game.league)}</td>` +
      `<td>${euro(game.totalRevenue)}</td><td>${game.attendance.toLocaleString()}</td></tr>`)
  ).join('');

  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>
      @page { size: A4 landscape; margin: 14mm; }
      body { font: 12px Arial, sans-serif; color: #192333; margin: 24px; }
      h1 { font-size: 23px; margin-bottom: 5px; } h2 { font-size: 16px; margin-top: 26px; }
      .subtitle { color: #5c6778; margin-bottom: 20px; white-space: pre-line; }
       .quadrant { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
       .quadrant.solo { grid-template-columns: 1fr; }
      .chart { border: 1px solid #dce1e8; border-radius: 10px; padding: 14px; break-inside: avoid; }
      .chart h2 { margin: 0 0 14px; }
       .plot { display: flex; position: relative; height: 142px; border-bottom: 1px solid #a9b3c0;
         background: repeating-linear-gradient(to top, transparent 0, transparent 34px, #eef1f4 35px); }
       .column { flex: 1; min-width: 0; position: relative; height: 100%; display: flex; justify-content: center; align-items: flex-end; }
       .column-value { position: absolute; transform: translateY(-3px); white-space: nowrap; font-size: 9px; font-weight: 700; }
       .column-bar { width: 45%; min-width: 9px; max-width: 36px; background: #8993a3; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
       .column-bar.current { background: #bf303b; }
       .trend-overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
       .category-labels { display: flex; margin-top: 5px; font-size: 9px; color: #5c6778; }
       .category-labels span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { padding: 9px 8px; border-bottom: 1px solid #dce1e8; text-align: right; }
      th:first-child, td:first-child, th[scope="row"] { text-align: left; }
      thead th { background: #f0f2f5; font-weight: 700; }
      tr { break-inside: avoid; } h2 { break-after: avoid; }
      .note { color: #5c6778; font-size: 11px; margin-top: 16px; }
      @media screen { body { max-width: 1100px; margin: 30px auto; padding: 0 20px; } }
    </style></head><body>
    <h1>${escapeHtml(title)}</h1><p class="subtitle">${escapeHtml(subtitle)}</p>
    <div class="quadrant ${charts.length === 1 ? 'solo' : ''}">${chartMarkup}</div>
    <p class="note">“—” means no matching games or no available ticket/capacity data; it is not a zero result.
    Highlighted bars match the comparison view.${showTrend ? ' Straight lines are least-squares trends across observed seasons, not connections between data points.' : ''}
    Figures reflect the selected Total or GameDay view.${perGame ? ' Volume metrics are averaged per matching game.' : ''}</p>
    <h2>Included games</h2><table><thead><tr><th>Selection</th><th>Date</th><th>Opponent</th>
    <th>League</th><th>Revenue</th><th>Attendance</th></tr></thead><tbody>${detailRows || '<tr><td colspan="6">No matching games</td></tr>'}</tbody></table>
    </body></html>`);
  popup.document.close();
  // The new window's initial about:blank load can fire before its written document loads.
  popup.setTimeout(requestPrint, 400);
}