import { GameData } from '../types';
import { calculateKPIs } from './StatsCards';

export interface ComparisonReportGroup {
  label: string;
  games: GameData[];
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character] || character);

const euro = (value: number) => `€${value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

export function printComparisonReport(title: string, subtitle: string, groups: ComparisonReportGroup[]) {
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

  const rows = groups.map(({ label, games }) => {
    const stats = calculateKPIs(games);
    return `<tr><th scope="row">${escapeHtml(label)}</th><td>${stats?.gameCount ?? '—'}</td>` +
      `<td>${stats ? euro(stats.totalRevenue) : '—'}</td>` +
      `<td>${stats ? euro(stats.arpg) : '—'}</td>` +
      `<td>${stats ? Math.round(stats.totalAttendance / stats.gameCount).toLocaleString() : '—'}</td>` +
      `<td>${stats ? `${stats.occupancy.toFixed(1)}%` : '—'}</td></tr>`;
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
      .subtitle { color: #5c6778; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { padding: 9px 8px; border-bottom: 1px solid #dce1e8; text-align: right; }
      th:first-child, td:first-child, th[scope="row"] { text-align: left; }
      thead th { background: #f0f2f5; font-weight: 700; }
      tr { break-inside: avoid; } h2 { break-after: avoid; }
      .note { color: #5c6778; font-size: 11px; margin-top: 16px; }
      @media screen { body { max-width: 1100px; margin: 30px auto; padding: 0 20px; } }
    </style></head><body>
    <h1>${escapeHtml(title)}</h1><p class="subtitle">${escapeHtml(subtitle)}</p>
    <h2>Comparison summary</h2><table><thead><tr>
    <th>Selection</th><th>Games</th><th>Revenue</th><th>Revenue / game</th>
    <th>Avg. attendance</th><th>Load factor</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="note">“—” means no matching games; it is not a zero result. Figures reflect the selected Total or GameDay view.</p>
    <h2>Included games</h2><table><thead><tr><th>Selection</th><th>Date</th><th>Opponent</th>
    <th>League</th><th>Revenue</th><th>Attendance</th></tr></thead><tbody>${detailRows || '<tr><td colspan="6">No matching games</td></tr>'}</tbody></table>
    </body></html>`);
  popup.document.close();
  // The new window's initial about:blank load can fire before its written document loads.
  popup.setTimeout(requestPrint, 400);
}