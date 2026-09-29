import { GameData } from '../types';
import { getComparisonMetrics, ComparisonMetrics } from './comparisonMetrics';

export interface ComparisonReportGroup {
  label: string;
  games: GameData[];
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character] || character);

const euro = (value: number) => `€${value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
const count = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 0 });

const charts: { key: keyof ComparisonMetrics; label: string; format: (value: number) => string }[] = [
  { key: 'revenue', label: 'Total revenue', format: euro },
  { key: 'attendance', label: 'Total attendance', format: count },
  { key: 'yield', label: 'Average price (Yield)', format: euro },
  { key: 'loadFactor', label: 'Load factor', format: value => `${value.toFixed(1)}%` },
];

export function printComparisonReport(title: string, subtitle: string, groups: ComparisonReportGroup[], highlightLabels: string[] = [groups[0]?.label]) {
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

  const metrics = groups.map(group => ({ ...group, values: getComparisonMetrics(group.games) }));
  const chartMarkup = charts.map(chart => {
    const max = Math.max(1, ...metrics.map(group => group.values[chart.key] ?? 0));
    return `<section class="chart"><h2>${chart.label}</h2>` +
      metrics.map(group => {
        const value = group.values[chart.key];
        const width = value === null ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
        return `<div class="bar-row"><span class="bar-label">${escapeHtml(group.label)}</span>` +
          `<div class="track">${value !== null ? `<div class="fill ${highlightLabels.includes(group.label) ? 'current' : ''}" style="width:${width}%"></div>` : ''}</div>` +
          `<strong>${value === null ? '—' : chart.format(value)}</strong></div>`;
      }).join('') + '</section>';
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
      .chart { border: 1px solid #dce1e8; border-radius: 10px; padding: 14px; break-inside: avoid; }
      .chart h2 { margin: 0 0 14px; }
      .bar-row { display: grid; grid-template-columns: 105px minmax(0, 1fr) 94px; align-items: center; gap: 8px; margin: 9px 0; font-size: 11px; }
      .bar-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .bar-row strong { text-align: right; }
      .track { height: 13px; background: #eceff3; border-radius: 3px; }
      .fill { height: 13px; background: #8993a3; border-radius: 3px; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .fill.current { background: #bf303b; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { padding: 9px 8px; border-bottom: 1px solid #dce1e8; text-align: right; }
      th:first-child, td:first-child, th[scope="row"] { text-align: left; }
      thead th { background: #f0f2f5; font-weight: 700; }
      tr { break-inside: avoid; } h2 { break-after: avoid; }
      .note { color: #5c6778; font-size: 11px; margin-top: 16px; }
      @media screen { body { max-width: 1100px; margin: 30px auto; padding: 0 20px; } }
    </style></head><body>
    <h1>${escapeHtml(title)}</h1><p class="subtitle">${escapeHtml(subtitle)}</p>
    <div class="quadrant">${chartMarkup}</div>
    <p class="note">“—” means no matching games or no available ticket/capacity data; it is not a zero result.
    Highlighted bars match the comparison view. Figures reflect the selected Total or GameDay view.</p>
    <h2>Included games</h2><table><thead><tr><th>Selection</th><th>Date</th><th>Opponent</th>
    <th>League</th><th>Revenue</th><th>Attendance</th></tr></thead><tbody>${detailRows || '<tr><td colspan="6">No matching games</td></tr>'}</tbody></table>
    </body></html>`);
  popup.document.close();
  // The new window's initial about:blank load can fire before its written document loads.
  popup.setTimeout(requestPrint, 400);
}