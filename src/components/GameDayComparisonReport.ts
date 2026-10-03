import type { GameDayComparisonGroup } from '../utils/gameDayComparison';
import {
  DEFAULT_GAMEDAY_METRICS, GAMEDAY_METRICS, gameDayChannelRows, gameDayMetric,
  gameDayCoverage, gameDayMetricValues, gameDayTrend, type GameDayMetricKey,
} from '../utils/gameDayComparison';
import { leagueLogoSrc, opponentLogoSrc } from './comparisonReport';

const escapeHtml = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character] || character);
const yearOf = (season?: string) => {
  const match = season?.match(/(\d{2,4})[-/]/);
  if (!match) return null;
  const year = Number(match[1]);
  return year < 100 ? year + 2000 : year;
};
const formatMoney = (value: number | null, locale: string) =>
  value === null ? '—' : new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);
const formatMetric = (value: number | null, key: GameDayMetricKey, locale: string) => {
  if (value === null) return '—';
  if (key === 'avgAttendance') return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
  if (key.startsWith('cagr')) return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  return formatMoney(value, locale);
};

export interface GameDayReportOptions {
  groups: GameDayComparisonGroup[];
  metrics?: GameDayMetricKey[];
  includeTicketing: boolean;
  mode: string;
  filterSummary: string;
  newestSeason: string;
  ytdReferenceCount: number;
  cagrBaseline: string;
  excludedRecords?: number;
  league?: string;
  opponents?: string[];
  locale?: string;
  translate?: (label: string) => string;
}

export function printGameDayComparisonReport(options: GameDayReportOptions): boolean {
  const {
    groups, includeTicketing, mode, filterSummary, newestSeason, ytdReferenceCount,
    cagrBaseline, league, opponents = [], locale = 'en-GB', translate = label => label,
  } = options;
  const metrics = (options.metrics?.length ? options.metrics : DEFAULT_GAMEDAY_METRICS).slice(0, 6);
  const popup = window.open('', '_blank');
  if (!popup) {
    window.alert(translate('Pop-up blocked. Allow pop-ups to print or save this comparison as a PDF.'));
    return false;
  }
  const badgeLogos = [
    ...[...new Set(opponents)].map(name => {
      const src = opponentLogoSrc(name);
      return `<span class="badge">${src ? `<img src="${escapeHtml(src)}" alt="">` : ''}${escapeHtml(name)}</span>`;
    }),
    ...(league ? [`<span class="badge">${leagueLogoSrc(league) ? `<img src="${escapeHtml(leagueLogoSrc(league))}" alt="">` : ''}${escapeHtml(league)}</span>`] : []),
  ].join('');
  const valuesByMetric = new Map(metrics.map(key => [key, gameDayMetricValues(groups, key, includeTicketing, mode !== 'custom')]));
  const charts = metrics.map(key => {
    const values = valuesByMetric.get(key) || [];
    const sameSeasonRepeated = groups.some((group, index) =>
      Boolean(group.season && groups.some((other, otherIndex) => index !== otherIndex && other.season === group.season)));
    const temporal = mode !== 'custom' && !sameSeasonRepeated;
    const points = temporal ? groups.flatMap((group, index) => {
      const year = yearOf(group.season);
      const value = values[index];
      return year !== null && value !== null && value !== undefined ? [{ x: year, y: value }] : [];
    }) : [];
    const trend = gameDayTrend(points);
    const forecasts = groups.map(group => {
      const year = yearOf(group.season);
      return trend && year !== null ? trend(year) : null;
    });
    const numeric = [...values.filter((value): value is number => value !== null), ...forecasts.filter((value): value is number => value !== null)];
    const max = Math.max(1, ...numeric) * 1.12;
    const min = Math.min(0, ...numeric) * 1.12;
    const range = max - min || 1;
    const zeroY = (max / range) * 100;
    const bars = groups.map((group, index) => {
      const value = values[index] ?? null;
      const y = value === null ? zeroY : (max - value) / range * 100;
      const height = value === null ? 0 : Math.abs(zeroY - y);
      const left = groups.length ? (index + 0.5) * 100 / groups.length : 50;
       return `<g><rect x="${(left - Math.min(18, 38 / Math.max(groups.length, 1))) * 6}" y="${Math.min(y, zeroY) * 1.6}" width="${Math.min(36, 76 / Math.max(groups.length, 1)) * 6}" height="${height * 1.6}" fill="${value === null ? '#e4e9ef' : '#c84a52'}"/>` +
        `<text x="${left * 6}" y="${Math.max(5, y - 2) * 1.6}" text-anchor="middle" class="value-label">${escapeHtml(formatMetric(value, key, locale))}</text></g>`;
    }).join('');
    const line = trend && forecasts.length > 1 ? (() => {
      const points = forecasts.flatMap((value, index) => value === null ? [] :
        [`${(index + 0.5) * 600 / groups.length},${(max - value) / range * 160}`]);
      return points.length > 1 ? `<polyline points="${points.join(' ')}" fill="none" stroke="#176c67" stroke-width="1.6" vector-effect="non-scaling-stroke"/>` : '';
    })() : '';
    const labels = groups.map(group => `<span title="${escapeHtml(group.label)}">${escapeHtml(group.label)}</span>`).join('');
    const definition = GAMEDAY_METRICS.find(metric => metric.key === key);
    return `<section class="chart"><h2>${escapeHtml(translate(definition?.label || key))}</h2><div class="plot"><div class="zero" style="top:${zeroY}%"></div><svg class="bars" viewBox="0 0 600 160" preserveAspectRatio="none" aria-label="${escapeHtml(translate('GameDay comparison columns'))}">${bars}${line}</svg></div><div class="labels">${labels}</div>${groups.every((_, i) => values[i] === null) ? `<p class="empty">${escapeHtml(translate('No reported values for this metric.'))}</p>` : ''}${key.startsWith('cagr') && mode === 'custom' ? `<p class="empty">${escapeHtml(translate('CAGR is not applicable to Custom A/B.'))}</p>` : ''}${key === 'ticketingPerGame' && !includeTicketing ? `<p class="empty">${escapeHtml(translate('Ticketing is excluded from this comparison.'))}</p>` : ''}</section>`;
  }).join('');

  const channelTables = groups.map((group, groupIndex) => {
    const rows = gameDayChannelRows(group, includeTicketing);
    const prior = groupIndex > 0 ? gameDayChannelRows(groups[groupIndex - 1], includeTicketing) : [];
    const body = rows.map(row => {
      const previous = prior.find(item => item.field === row.field)?.perGame;
      const change = row.perGame === null || previous === null || previous === undefined || previous === 0
        ? null : (row.perGame - previous) / Math.abs(previous) * 100;
      return `<tr><th>${escapeHtml(translate(row.label))}</th><td>${formatMoney(row.revenue, locale)}</td><td>${formatMoney(row.perGame, locale)}</td><td>${formatMoney(row.perPerson, locale)}</td><td>${row.share === null ? '—' : `${row.share.toFixed(1)}%`}</td><td>${change === null ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`}</td><td>${row.coverage}/${group.fixtureCount}</td></tr>`;
    }).join('');
    return `<section class="channel-section"><h2>${escapeHtml(group.label)} <small>${group.games.length}/${group.fixtureCount} ${escapeHtml(translate('games with data'))}${group.missingFixtures ? ` · ${group.missingFixtures} ${escapeHtml(translate('missing'))}` : ''} · ${escapeHtml(translate('Attendance coverage'))} ${gameDayCoverage(group, 'attendance')}/${group.fixtureCount}</small></h2><div class="table-wrap"><table><thead><tr><th>${escapeHtml(translate('Channel'))}</th><th>${escapeHtml(translate('Revenue'))}</th><th>${escapeHtml(translate('€/game'))}</th><th>${escapeHtml(translate('€/person'))}</th><th>${escapeHtml(translate('Share'))}</th><th>${escapeHtml(translate('Change in €/game vs prior group'))}</th><th>${escapeHtml(translate('Coverage'))}</th></tr></thead><tbody>${body}</tbody></table></div></section>`;
  }).join('');
  const printedAt = new Date().toLocaleString(locale);
  const page = `<!doctype html><html lang="${locale.startsWith('it') ? 'it' : 'en'}"><head><meta charset="utf-8"><title>${escapeHtml(translate('GameDay comparison report'))}</title>
  <style>
  @page{size:A4 landscape;margin:9mm}*{box-sizing:border-box}body{margin:0;color:#233142;font:11px/1.4 Arial,sans-serif;background:#fff}
  .sheet{min-height:190mm;break-after:page;page-break-after:always}.sheet:last-child{break-after:auto;page-break-after:auto}
  header{height:50px;border-top:4px solid #c84a52;border-bottom:1px solid #dce3e9;display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}
  .brand{display:flex;align-items:center;gap:10px}.brand img{width:36px;height:36px;object-fit:contain}.brand strong{display:block;font-size:11px;letter-spacing:.08em}.brand small{color:#718093;letter-spacing:.12em;font-size:8px}
  .badges{display:flex;gap:7px;align-items:center}.badge{display:flex;align-items:center;gap:4px;border:1px solid #e1e6eb;border-radius:12px;padding:3px 7px;font-weight:bold;font-size:9px}.badge img{width:23px;height:22px;object-fit:contain}
  h1{font-size:19px;margin:0 0 3px}.sub{white-space:pre-wrap;color:#617083;font-size:9px;margin:0 0 8px}.meta{font-size:8px;color:#667486;margin:5px 0 10px}
  .charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr));gap:7px;height:143mm}.chart{border:1px solid #dce3e9;border-radius:7px;padding:6px 8px;display:flex;flex-direction:column;min-height:0;break-inside:avoid}
  .chart h2,.channel-section h2{font-size:11px;margin:0 0 4px}.plot{position:relative;flex:1;min-height:40px;background:repeating-linear-gradient(to bottom,transparent 0,transparent 23px,#edf1f4 24px)}.zero{position:absolute;border-top:1px solid #aab4c0;left:0;right:0}.bars{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.bars text{font:14px Arial;fill:#384658}.labels{display:flex;gap:1px;margin-top:4px}.labels span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;font-size:7px;color:#617083}
  .empty{margin:3px 0 0;font-size:8px;color:#657386}.footnote{font-size:8px;color:#647386;margin:7px 0 0}.channel-section{margin:7px 0 12px;break-inside:avoid}.channel-section h2 small{font-size:8px;font-weight:normal;color:#718093;margin-left:5px}
  .table-wrap{overflow:visible}table{width:100%;border-collapse:collapse;font-size:8px}th,td{border-bottom:1px solid #e6eaee;padding:4px 5px;text-align:right;white-space:nowrap}th:first-child,td:first-child{text-align:left}thead{background:#f2f5f7}thead th{font-size:7px;text-transform:uppercase;letter-spacing:.04em;color:#59687a}
  .coverage-note{font-size:8px;color:#607083;margin-top:6px}
  @media screen{body{max-width:1200px;margin:20px auto;padding:0 20px}.sheet{padding:9mm;border:1px solid #dce3e9;margin-bottom:24px;min-height:210mm}.charts{height:143mm}}
  </style></head><body><article class="sheet"><header><div class="brand"><img src="/favicon.png" alt="Pallacanestro Varese"><div><strong>PALLACANESTRO VARESE</strong><small>GAMEDAY · COMMERCIAL COMPARISON</small></div></div><div class="badges">${badgeLogos}</div></header>
  <h1>${escapeHtml(translate('GameDay comparison'))}</h1><p class="sub">${escapeHtml(mode)} · ${escapeHtml(filterSummary)}</p>
  ${options.excludedRecords ? `<p class="meta">${options.excludedRecords} ${escapeHtml(translate('source records excluded because their season or match date is invalid. No figures have been assigned to another season.'))}</p>` : ''}
  <p class="meta">${escapeHtml(translate('Newest season'))}: ${escapeHtml(newestSeason || '—')} · ${escapeHtml(translate('YTD reference'))}: first ${ytdReferenceCount} fixtures in ${escapeHtml(newestSeason || '—')} · ${escapeHtml(translate('Include ticketing'))}: ${includeTicketing ? escapeHtml(translate('Yes')) : escapeHtml(translate('No'))} · ${escapeHtml(translate('CAGR baseline'))}: ${escapeHtml(cagrBaseline)} · ${escapeHtml(translate('Printed'))}: ${escapeHtml(printedAt)}</p>
  <div class="charts">${charts}</div><p class="footnote">— ${escapeHtml(translate('means no matching fixture or unreported field, never zero. Columns use actual matching games; per-game and per-person ratios are weighted by actual game and attendance totals. Trend lines are least-squares fits against season year, not connections between fixtures.'))}</p></article>
  <article class="sheet"><header><div class="brand"><img src="/favicon.png" alt="Pallacanestro Varese"><div><strong>PALLACANESTRO VARESE</strong><small>CHANNEL PERFORMANCE · COVERAGE</small></div></div><div class="badges">${badgeLogos}</div></header>
  <h1>${escapeHtml(translate('Channel breakdown and data coverage'))}</h1><p class="sub">${escapeHtml(filterSummary)}</p>
  <p class="meta">${escapeHtml(translate('Operational revenue'))}: F&B + Merchandising + Hospitality + Parking + Experience. ${escapeHtml(translate('Commercial total'))}: operational revenue + Sponsorship${includeTicketing ? ` + ${escapeHtml(translate('Ticketing'))}` : ''}. TV revenue is excluded. No costs or margin are inferred.</p>
  ${channelTables}<p class="coverage-note">${escapeHtml(translate('Coverage is the count of fixtures with a reported channel value over fixtures in the comparison group. Change compares euros per game with the immediately prior comparison group, so groups with unequal fixture counts remain comparable; unavailable baselines are shown as a dash.'))}</p></article></body></html>`;
  popup.document.open();
  popup.document.write(page);
  popup.document.close();
  popup.setTimeout(() => {
    const images = Array.from(popup.document.images);
    Promise.race([
      Promise.all(images.map(image => image.decode().catch(() => undefined))),
      new Promise(resolve => popup.setTimeout(resolve, 3500)),
    ]).then(() => {
      if (!popup.closed) { popup.focus(); popup.print(); }
    });
  }, 100);
  return true;
}