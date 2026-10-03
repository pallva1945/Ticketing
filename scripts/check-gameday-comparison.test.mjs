import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGameDayFixtures, buildGameDayGroups, gameDayMetric, gameDayMetricValues,
  gameDayChannelRows, gameDayDelta, gameDayTrend, sumGameDay,
  gameDayFixtureLabel,
  gameDaySeasons,
} from '../src/utils/gameDayComparison.ts';
import { processGameDayData } from '../src/utils/dataProcessor.ts';
import { printGameDayComparisonReport } from '../src/components/GameDayComparisonReport.ts';

const game = (season, date, opponent, extra = {}) => ({
  season, date, opponent, league: 'LBA', attendance: 100, totalRevenue: 999999,
  tixRevenue: 1000, merchRevenue: 100, hospitalityRevenue: 100, parkingRevenue: 100,
  fbRevenue: 100, expRevenue: 100, sponsorshipRevenue: 500, tvRevenue: 7000, ...extra,
});
const filters = (extra = {}) => ({ seasons: ['All'], leagues: ['All'], opponents: ['All'], tiers: ['All'], dates: ['All'], ...extra });
const selection = (extra = {}) => ({ league: 'LBA', opponent: 'Bologna', tier: '1', week: 1, ...extra });
const group = (games) => ({ label: 'Test', games, fixtureCount: games.length, missingFixtures: 0 });
const groups = (fixtures, seasons, mode, selected = {}) =>
  buildGameDayGroups(fixtures, seasons, mode, selection(selected), filters(), filters());

test('commercial revenue respects Ticketing and separates Sponsorship from operational spending', () => {
  const sample = group([game('26-27', '27/09/2026', 'Bologna')]);
  assert.equal(gameDayMetric(sample, 'revenuePerGame', false), 1000);
  assert.equal(gameDayMetric(sample, 'revenuePerGame', true), 2000);
  assert.equal(gameDayMetric(sample, 'operationalPerPerson', false), 5);
  assert.equal(gameDayMetric(sample, 'operationalPerPerson', true), 5);
  assert.equal(gameDayMetric(sample, 'totalPerPerson', false), 10);
  assert.equal(gameDayMetric(sample, 'ticketingPerGame', false), null);
  assert.equal(gameDayChannelRows(sample, false).length, 6);
  assert.equal(gameDayChannelRows(sample, true).length, 7);
  assert.equal(gameDayChannelRows(sample, false).reduce((sum, row) => sum + row.share, 0), 100);
});

test('per-person ratios are weighted by attendance and volume comparisons are per game', () => {
  const sample = group([
    game('25-26', '12/10/2025', 'Bologna', { attendance: 100, fbRevenue: 100 }),
    game('25-26', '19/10/2025', 'Trieste', { attendance: 900, fbRevenue: 1800 }),
  ]);
  assert.equal(gameDayMetric(sample, 'fbPerPerson', false), 1.9);
  assert.equal(gameDayMetric(sample, 'fbPerGame', false), 950);
  assert.equal(gameDayMetric(sample, 'avgAttendance', false), 500);
  assert.equal(gameDayMetric(group([game('26-27', '27/09/2026', 'Bologna', { attendance: 0 })]), 'fbPerPerson', false), null);
});

test('same opponent encounters stay distinct and tiers join by season, date and league', () => {
  const source = [
    game('25/26', '12/10/2025', 'Bologna'),
    game('26-27', '27/09/2026', 'Bologna'),
    game('26-27', '10/10/2026', 'Bologna'),
    game('26-27', '10/10/2026', 'Bologna', { league: 'FEC' }),
  ];
  const ticketing = source.map((row, index) => ({ ...row, tier: index + 1 }));
  const fixtures = buildGameDayFixtures(source, ticketing, '2026-10-11');
  assert.equal(fixtures.length, 4);
  assert.deepEqual(fixtures.map(fixture => fixture.tier), [1, 2, 3, 4]);
  const compared = groups(fixtures, ['25-26', '26-27'], 'opponent');
  assert.equal(compared.length, 3);
  assert.deepEqual(compared.map(value => value.fixtureCount), [1, 1, 1]);
  assert.notEqual(compared[1].label, compared[2].label);
  const tiers = groups(fixtures, ['25-26', '26-27'], 'tier', { tier: '3' });
  assert.deepEqual(tiers.map(value => value.fixtureCount), [0, 1]);
});

test('future games are excluded and missing earlier records cannot shift week or YTD comparisons', () => {
  const historical = [
    game('25-26', '05/10/2025', 'Missing'),
    game('25-26', '12/10/2025', 'Bologna'),
    game('25-26', '19/10/2025', 'Trieste'),
  ];
  const current = [
    game('26-27', '27/09/2026', 'Bologna'),
    game('26-27', '04/10/2026', 'Trieste'),
    game('26-27', '11/10/2026', 'Future'),
  ];
  const fixtures = buildGameDayFixtures([...historical.slice(1), ...current], [...historical, ...current].map(row => ({ ...row, tier: 1 })), '2026-10-05');
  assert.equal(fixtures.length, 5);
  const week = groups(fixtures, ['25-26', '26-27'], 'week');
  assert.equal(week[0].missingFixtures, 1);
  assert.equal(week[0].games.length, 0);
  assert.equal(week[1].games[0].opponent, 'Bologna');
  const ytd = groups(fixtures, ['25-26', '26-27'], 'ytd');
  assert.deepEqual(ytd.map(value => value.fixtureCount), [2, 2]);
  assert.equal(ytd[0].missingFixtures, 1);
  assert.equal(ytd[0].games[0].opponent, 'Bologna');
  assert.equal(gameDayMetric(ytd[0], 'revenuePerGame', false), null);
  assert.equal(gameDayMetric(ytd[1], 'revenuePerGame', false), 1000);
});

test('invalid non-consecutive season labels cannot replace the current YTD reference', () => {
  const source = [game('25-26', '05/10/2025', 'Bologna'), game('26-27', '27/09/2026', 'Bologna')];
  const ticketing = [{ ...game('26-28', '28/09/2026', 'Invalid'), tier: 1 }];
  const seasons = gameDaySeasons(source, ticketing);
  assert.deepEqual(seasons, ['25-26', '26-27']);
  const fixtures = buildGameDayFixtures(source, ticketing, '2026-10-05');
  assert.equal(fixtures.length, 2);
  const result = groups(fixtures, seasons, 'ytd');
  assert.deepEqual(result.map(value => value.fixtureCount), [1, 1]);
});

test('Custom A/B filters include exact encounter dates and never interpret missing tiers as matching', () => {
  const source = [game('26-27', '27/09/2026', 'Bologna'), game('26-27', '04/10/2026', 'Bologna')];
  const fixtures = buildGameDayFixtures(source, [{ ...source[0], tier: 1 }], '2026-10-05');
  const result = buildGameDayGroups(fixtures, ['26-27'], 'custom', selection(),
    filters({ dates: ['2026-09-27'] }), filters({ tiers: ['1'] }));
  assert.deepEqual(result.map(value => value.fixtureCount), [1, 1]);
  assert.equal(result[0].games[0].date, '27/09/2026');
  assert.deepEqual(gameDayMetricValues(result, 'cagrRevenue', true, false), [null, null]);
  const identity = gameDayFixtureLabel(fixtures[1]);
  const exact = buildGameDayGroups(fixtures, ['26-27'], 'custom', selection(), filters({ dates: [identity] }), filters());
  assert.equal(exact[0].fixtureCount, 1);
  assert.equal(exact[0].games[0].date, '04/10/2026');
});

test('CSV preserves missing inputs as unknown and actual zeros as zero', () => {
  const parsed = processGameDayData('Date,Season,League,Game,Total #,Tix $,Merch $,Hospitality $,Park $,F&B $,Sponsorship,Exp $\n27/09/2026,26-27,LBA,Bologna,100,1000,0,100,100,,500,100\n04/10/2026,26-27,LBA,Trieste,100,1000,0,100,100,0,500,100');
  assert.equal(parsed[0].reported.fbRevenue, false);
  assert.equal(parsed[1].reported.fbRevenue, true);
  assert.equal(sumGameDay(group([parsed[0]]), ['fbRevenue']), null);
  assert.equal(sumGameDay(group([parsed[1]]), ['fbRevenue']), 0);
  assert.equal(gameDayMetric(group([parsed[0]]), 'revenuePerGame', false), null);
  assert.equal(gameDayMetric(group([parsed[0]]), 'merchPerPerson', false), 0);
  assert.equal(sumGameDay(group(parsed), ['fbRevenue']), null);
});

test('CSV fixture deduplication preserves separate competitions', () => {
  const parsed = processGameDayData('Date,Season,League,Game,Total #\n27/09/2026,26-27,LBA,Bologna,100\n27/09/2026,26-27,FEC,Bologna,200');
  assert.equal(parsed.length, 2);
});

test('CAGR uses elapsed years, averages per game, and rejects same-season duplicates', () => {
  const baseline = { ...group([game('23-24', '01/10/2023', 'Bologna')]), season: '23-24' };
  const current = { ...group([game('25-26', '01/10/2025', 'Bologna', { sponsorshipRevenue: 940 })]), season: '25-26' };
  const values = gameDayMetricValues([baseline, current], 'cagrRevenue', false, true);
  assert.equal(values[0], null);
  assert.ok(Math.abs(values[1] - 20) < 1e-10);
  assert.deepEqual(gameDayMetricValues([baseline, current, current], 'cagrRevenue', false, true), [null, null, null]);
  assert.equal(gameDayDelta(200, 100), 100);
  assert.equal(gameDayDelta(100, 0), null);
});

test('linear trend is regression rather than connecting observed values', () => {
  const trend = gameDayTrend([{ x: 2023, y: 100 }, { x: 2024, y: 300 }, { x: 2025, y: 200 }]);
  assert.equal(Math.round(trend(2023)), 150);
  assert.equal(Math.round(trend(2024)), 200);
  assert.equal(Math.round(trend(2025)), 250);
  assert.equal(gameDayTrend([{ x: 2025, y: 200 }]), null);
});

test('print snapshot includes six selected charts, field coverage, safe labels, and the Ticketing choice', () => {
  let html = '';
  const originalWindow = globalThis.window;
  const popup = {
    document: { open() {}, close() {}, write(value) { html = value; } },
    setTimeout() {},
  };
  globalThis.window = { open: () => popup, alert() {} };
  try {
    const sample = { ...group([game('26-27', '27/09/2026', 'Bologna', { fbRevenue: 0 })]), label: '26-27 · <unsafe>' };
    const metrics = ['revenuePerGame', 'avgAttendance', 'operationalPerPerson', 'fbPerPerson', 'merchPerPerson', 'hospitalityPerGame'];
    assert.equal(printGameDayComparisonReport({
      groups: [sample], metrics, includeTicketing: false, mode: 'custom',
      filterSummary: 'A: test <filter>', newestSeason: '26-27', ytdReferenceCount: 1,
      cagrBaseline: 'Not applicable', excludedRecords: 1,
    }), true);
    assert.equal((html.match(/section class="chart"/g) || []).length, 6);
    assert.ok(html.includes('Attendance coverage'));
    assert.ok(html.includes('&lt;unsafe&gt;'));
    assert.ok(html.includes('&lt;filter&gt;'));
    assert.ok(html.includes('Include ticketing</') || html.includes('Include ticketing: No'));
    assert.ok(html.includes('height="0"'), 'genuine zero must not render a fabricated positive bar');
    assert.ok(html.includes('source records excluded'));
    assert.ok(html.includes('Change in €/game vs prior group'));
    assert.ok(!html.includes('<script'));
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});