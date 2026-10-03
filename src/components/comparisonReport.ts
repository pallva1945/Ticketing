import { GameData } from '../types';
import { COMPARISON_METRICS, ComparisonMetricKey, fitLinearTrend, getComparisonSeriesValues, getYoYMarkers, isCagrMetric, metricDisplayTitle } from './comparisonMetrics';

export interface ComparisonReportGroup {
  label: string;
  games: GameData[];
  fixtureCount?: number;
  missingFixtures?: number;
  seriesKey?: string;
  fixtures?: { season: string; league: string; date: string; opponent: string }[];
}

export interface ComparisonReport {
  title: string;
  subtitle: string;
  groups: ComparisonReportGroup[];
  highlightLabels: string[];
  showTrend: boolean;
  perGame: boolean;
  league?: string;
  opponents?: string[];
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character] || character);

const seriesName = (label: string) => /^W\d+ · /.test(label.split(' · ').slice(1).join(' · '))
  ? label.split(' · ')[1] : label.includes(' · ') ? label.split(' · ').slice(1).join(' · ') : 'Season trend';

const opponentLogos: Record<string, string> = {
  Bahcesehir: 'bahcesehir.png', Bologna: 'bologna.png', Brescia: 'brescia.png', Brindisi: 'brindisi.png',
  Cantù: 'cantu.png', Chemnitz: 'chemnitz.jpg', Cremona: 'cremona.png',
  'CSM Oradea': 'csm-oradea.png', Gottingen: 'gottingen.jpg',
  Keravnos: 'keravnos.svg', Milano: 'milano.png', Napoli: 'napoli.png', Nymburk: 'nymburk.svg',
  Pesaro: 'pesaro.jpg', Pistoia: 'pistoia.png', 'Reggio Emilia': 'reggio-emilia.png',
  Sassari: 'sassari.png', Scafati: 'scafati.png', Tortona: 'tortona.png',
  Trapani: 'trapani.png', Trento: 'trento.png', Treviso: 'treviso.png', Trieste: 'trieste.png',
  'TSU Tbilisi': 'tsu-tbilisi.png', Udine: 'udine.png', Venezia: 'venezia.png', 'ZZ Leiden': 'zz-leiden.png',
};

const leagueLogos: Record<string, string> = {
  LBA: 'lba.svg',
  BCL: 'bcl.png',
  FEC: 'fec.png',
};

export const opponentLogoSrc = (name: string): string | null =>
  opponentLogos[name] ? `/report-logos/${opponentLogos[name]}` : null;

export const leagueLogoSrc = (league: string): string | null => {
  const code = league.trim().toUpperCase();
  return leagueLogos[code] ? `/report-logos/${leagueLogos[code]}` : null;
};

export function printComparisonReports(reports: ComparisonReport[], selectedMetrics: ComparisonMetricKey[]) {
  if (!reports.length) return;
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
  const charts = selectedMetrics.map(key => COMPARISON_METRICS.find(chart => chart.key === key))
    .filter((chart): chart is typeof COMPARISON_METRICS[number] => Boolean(chart));
  const pages = reports.map(({ title, subtitle, groups, highlightLabels, showTrend, perGame, league, opponents = [] }, page) => {
  const leagueCode = league?.trim().toUpperCase();
  const leagueBadge = leagueCode && leagueLogoSrc(leagueCode)
    ? `<img class="league-logo" src="${leagueLogoSrc(leagueCode)}" alt="${leagueCode} league logo" onerror="this.nextElementSibling.hidden=false;this.remove()"><span class="league-code" hidden>${escapeHtml(leagueCode)}</span>`
    : leagueCode ? `<span class="league-code">${escapeHtml(leagueCode)}</span>` : '';
  const opponentBadges = opponents.map(name => {
    const logo = opponentLogoSrc(name);
    const image = logo ? `<img class="crest" src="${logo}" alt="" onerror="this.remove()">` : '';
    return `<div class="opponent">${image}<span>${escapeHtml(name)}</span></div>`;
  }).join('');
  const ordered = showTrend ? [...groups].sort((a, b) => parseInt(a.label, 10) - parseInt(b.label, 10)) : groups;
  const values = Object.fromEntries(charts.map(chart =>
    [chart.key, getComparisonSeriesValues(ordered, chart.key, perGame, showTrend)])) as Record<string, (number | null)[]>;
  const metrics = ordered.map((group, index) => ({
      ...group,
      values: Object.fromEntries(charts.map(chart => [chart.key, values[chart.key][index]])) as Record<string, number | null>,
    }));
  const chartMarkup = charts.map((chart, chartIndex) => {
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
    const min = Math.min(0, ...metrics.map(group => group.values[chart.key] ?? 0),
      ...trends.flatMap(trend => [trend.start, trend.end])) * 1.12;
    const range = max - min;
    const zero = -min / range * 100;
    const lines = trends.map(trend => {
      const color = trend.index % 2 === 0 ? '#0f766e' : '#7c3aed';
      const x1 = (trend.first + 0.5) * 100;
      const x2 = (trend.last + 0.5) * 100;
      return `<line x1="${x1}" y1="${(max - trend.start) / range * 100}" x2="${x2}" y2="${(max - trend.end) / range * 100}" ` +
        `stroke="${color}" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`;
    }).join('');
    const columns = metrics.map(group => {
        const value = group.values[chart.key];
         const valuePosition = value === null ? zero : (value - min) / range * 100;
         const height = Math.abs(valuePosition - zero);
         return `<div class="column"><span class="column-value" style="bottom:${value === null ? zero : value < 0 ? valuePosition - 12 : valuePosition}%">${value === null ? '—' : chart.format(value)}</span>` +
           `<div class="column-bar ${highlightLabels.includes(group.label) ? 'current' : ''}" style="bottom:${Math.min(zero, valuePosition)}%;height:${height}%"></div></div>`;
      }).join('');
    const labels = metrics.map(group => `<span title="${escapeHtml(group.label)}">${escapeHtml(group.label)}</span>`).join('');
    const yoy = chartIndex < charts.length - 1
      ? getYoYMarkers(ordered, chart.key, perGame, showTrend)
        .map(marker => `<span class="yoy-marker ${marker.value >= 0 ? 'up' : 'down'}"><i></i>${escapeHtml(marker.fixture ? `${marker.fixture} · ` : '')}${escapeHtml(marker.from)} → ${escapeHtml(marker.to)}: ${marker.value > 0 ? '+' : ''}${marker.value.toFixed(1)}% YoY</span>`)
        .join('') : '';
    return `<section class="chart"><h2>${escapeHtml(metricDisplayTitle(chart.key, perGame))}</h2><div class="plot"><div class="zero-line" style="bottom:${zero}%"></div>` + columns +
      (lines ? `<svg class="trend-overlay" viewBox="0 0 ${metrics.length * 100} 100" preserveAspectRatio="none" aria-label="Linear season trend">${lines}</svg>` : '') +
      `</div><div class="category-labels">${labels}</div>` +
      (yoy ? `<div class="yoy-markers">${yoy}</div>` : '') +
      (isCagrMetric(chart.key) && !metrics.some(group => group.values[chart.key] !== null)
        ? `<p class="chart-note">${showTrend ? 'Requires a later matching season and a positive baseline.' : 'CAGR is unavailable for Custom A/B.'}</p>` : '') +
      `</section>`;
  }).join('');

  return `<article class="report-page">
    <header class="report-header">
      <div class="brand"><img class="crest" src="/favicon.png" alt="Pallacanestro Varese logo">
        <div><strong>PALLACANESTRO VARESE</strong><span>TICKETING INTELLIGENCE · COMPARISON REPORT</span></div>
      </div>
      <div class="header-right">${opponentBadges}${leagueBadge}<span class="page-count">${String(page + 1).padStart(2, '0')} / ${String(reports.length).padStart(2, '0')}</span></div>
    </header>
    <div class="report-heading"><h1>${escapeHtml(title)}</h1><p class="subtitle">${escapeHtml(subtitle)}</p>
      <p class="note">${groups.map(group => `${escapeHtml(group.label)}: ${group.games.length}/${group.fixtureCount ?? group.games.length} fixtures with data`).join(' · ')}</p></div>
    <div class="quadrant ${charts.length === 1 ? 'solo' : ''} ${charts.length === 6 ? 'six' : ''}">${chartMarkup}</div>
    <p class="note">“—” means no matching games or no available ticket/capacity data; it is not a zero result.
    Highlighted bars match the comparison view.${showTrend ? ' Straight lines are least-squares trends across observed seasons, not connections between data points.' : ''}
    Figures reflect the selected Total or GameDay view.${perGame ? ' Volume metrics are averaged per matching game.' : ''}
    ${charts.some(chart => isCagrMetric(chart.key)) && showTrend ? 'Compound Annual Growth Rate (CAGR) is calculated from the earliest matching season with a positive value.' : ''}</p>
    </article>${groups.some(group => group.fixtures?.length) ? `<section class="fixture-appendix"><h2>${escapeHtml(title)} · Included fixtures</h2>${groups.map(group =>
      `<div class="fixture-group"><strong>${escapeHtml(group.label)} · ${group.games.length}/${group.fixtureCount ?? group.games.length} with data</strong><p>${(group.fixtures || []).map(fixture =>
        escapeHtml(`${fixture.date} · ${fixture.opponent} · ${fixture.league} · ${fixture.season}`)).join('<br>') || 'No matching fixtures'}${group.missingFixtures ? `<br>${group.missingFixtures} fixture records missing; no figures invented.` : ''}</p></div>`).join('')}</section>` : ''}`;
  }).join('');
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Ticketing comparison reports</title>
    <style>
      @page { size: A4 landscape; margin: 9mm; }
      body { font: 12px Arial, sans-serif; color: #192333; margin: 0; }
      .fixture-appendix { font-size: 10px; break-after: page; }
      .fixture-appendix:last-child { break-after: auto; }
      .fixture-group { break-inside: avoid; margin: 10px 0; }
      .report-page { box-sizing: border-box; height: 192mm; display: flex; flex-direction: column;
        break-after: page; page-break-after: always; break-inside: avoid; }
      .report-page:last-child { break-after: auto; page-break-after: auto; }
      .report-header { height: 55px; flex: 0 0 55px; display: flex; align-items: center;
        justify-content: space-between; gap: 15px; border-top: 4px solid #c51f30;
        border-bottom: 1px solid #dce1e8; margin-bottom: 6px; }
      .brand, .header-right, .opponent { display: flex; align-items: center; }
      .brand { gap: 11px; min-width: 0; }
      .brand strong { display: block; font-size: 12px; letter-spacing: .08em; }
      .brand span { display: block; margin-top: 3px; color: #667184; font-size: 8px; letter-spacing: .1em; }
      .crest { width: 42px; height: 42px; object-fit: contain; flex: none; }
      .header-right { gap: 12px; }
      .opponent { gap: 5px; font-size: 10px; color: #334155; font-weight: 700; }
      .opponent .crest { width: 38px; height: 38px; }
      .league-logo { width: 52px; height: 40px; object-fit: contain; }
      .league-code { font-size: 11px; font-weight: 700; color: #c51f30; }
      .page-count { border-left: 1px solid #dce1e8; padding-left: 10px; color: #667184;
        font-size: 10px; white-space: nowrap; }
      .report-heading { flex: none; }
      h1 { font-size: 18px; margin: 0 0 2px; } h2 { font-size: 13px; }
      .subtitle { color: #5c6778; margin: 0 0 6px; white-space: pre-line; font-size: 9px; }
      .quadrant { display: grid; flex: 1; min-height: 0; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .quadrant.six { grid-template-rows: repeat(3, minmax(0, 1fr)); }
      .quadrant.solo { grid-template-columns: 1fr; }
      .chart { display: flex; flex-direction: column; min-height: 0; border: 1px solid #dce1e8;
        border-radius: 8px; padding: 8px 11px; break-inside: avoid; }
      .chart h2 { margin: 0 0 4px; min-height: 28px; display: flex; align-items: center; }
      .plot { display: flex; flex: 1; min-height: 0; position: relative;
        background: repeating-linear-gradient(to top, transparent 0, transparent 25px, #eef1f4 26px); }
      .zero-line { position: absolute; left: 0; right: 0; border-top: 1px solid #a9b3c0; }
      .column { flex: 1; min-width: 0; position: relative; height: 100%; display: flex; justify-content: center; align-items: flex-end; }
      .column-value { position: absolute; transform: translateY(-3px); white-space: nowrap; font-size: 8px; font-weight: 700; }
      .column-bar { position: absolute; width: 45%; min-width: 9px; max-width: 36px; background: #8993a3; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .column-bar.current { background: #bf303b; }
      .trend-overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
      .category-labels { display: flex; margin-top: 4px; font-size: 8px; color: #5c6778; }
      .category-labels span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center; }
      .yoy-markers { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px; }
      .yoy-marker { display: inline-flex; align-items: center; gap: 3px; border-radius: 10px; padding: 2px 5px;
        font-size: 7px; font-weight: bold; white-space: nowrap; background: #e9f7f0; color: #146348; }
      .yoy-marker.down { background: #fcebed; color: #ae263c; }
      .yoy-marker i { width: 3px; height: 8px; background: currentColor; border-radius: 1px; }
      .chart-note { margin: 4px 0 0; font-size: 8px; color: #5c6778; }
      .note { color: #5c6778; font-size: 8px; margin: 6px 0 0; flex: none; }
      @media screen { body { max-width: 1120px; margin: 20px auto; padding: 0 20px; }
        .report-page { margin-bottom: 30px; border: 1px solid #dce1e8; padding: 9mm; height: 210mm; } }
    </style></head><body>${pages}</body></html>`);
  popup.document.close();
  // Wait for same-origin crests to load; the initial about:blank load may fire before document.write.
  popup.setTimeout(() => {
    const images = Array.from(popup.document.images);
    const ready = Promise.all(images.map(image => image.decode().catch(() => undefined)));
    Promise.race([ready, new Promise(resolve => popup.setTimeout(resolve, 4000))]).then(requestPrint);
  }, 80);
}