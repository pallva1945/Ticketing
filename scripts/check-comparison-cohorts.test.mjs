import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { buildGameDayFixtures, buildGameDayGroups, gameDayMetric, gameDayFixtureLabel } from '../src/utils/gameDayComparison.ts';
import { buildSeasonComparison, buildTicketingCustomComparison } from '../src/utils/seasonComparison.ts';
import { getComparisonSeriesValues, getMetricValue } from '../src/components/comparisonMetrics.ts';
import { printComparisonReports } from '../src/components/comparisonReport.ts';

// Keep "played so far" assertions deterministic after the scheduled fixture date.
mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-03T12:00:00Z').getTime() });
const row = (season, date, opponent, revenue = 100, attendance = 100) => ({
  season, date, opponent, league: 'LBA', attendance, totalRevenue: revenue,
  tixRevenue: revenue, merchRevenue: 0, hospitalityRevenue: 0, parkingRevenue: 0,
  fbRevenue: revenue, expRevenue: 0, sponsorshipRevenue: 0, tvRevenue: 0,
});
const source = [
  row('23-24', '20/09/2023', 'Other', 1000),
  row('23-24', '25/09/2023', 'Bologna', 100),
  row('24-25', '20/09/2024', 'Bologna', 200),
  row('24-25', '25/09/2024', 'Trieste', 400),
  row('25-26', '20/09/2025', 'Other', 900),
  row('25-26', '25/09/2025', 'Bologna', 300),
  row('25-26', '30/09/2025', 'Trieste', 500),
  row('26-27', '20/09/2026', 'Bologna', 200, 100),
  row('26-27', '25/09/2026', 'Trieste', 600, 900),
  row('26-27', '20/10/2026', 'Future', 99999),
  row('26-28', '01/09/2026', 'Invalid', 99999),
];
const tickets = source.map((game, index) => ({ ...game, id: `game-${index}`, tier: 1,
  capacity: 1000, zoneCapacities: {},
  salesBreakdown: [{ channel: 'TIX', zone: 'Test', revenue: game.totalRevenue, quantity: game.attendance }] }));
const seasons = ['23-24', '24-25', '25-26', '26-27'];
const selection = { league: 'LBA', opponent: 'Bologna', secondOpponent: '', firstTier: 1, week: 1 };
const gdSelection = { league: 'LBA', opponent: 'Bologna', secondOpponent: '', tier: '1', week: 1 };
const filters = (extra = {}) => ({ seasons: ['All'], leagues: ['LBA'], opponents: ['All'], tiers: ['All'], dates: ['All'], ...extra });
const fixtures = buildGameDayFixtures(source, tickets, '2026-10-03');
const gdGroups = mode => buildGameDayGroups(fixtures, seasons, mode, gdSelection, filters(), filters());

test('both modules use identical fixture cohorts, labels and count for all seasonal modes', () => {
  for (const mode of ['opponent', 'tier', 'week', 'ytd-week', 'ytd-opponent']) {
    const ticket = buildSeasonComparison(tickets, mode, 'total', selection, source);
    const gd = gdGroups(mode);
    assert.deepEqual(ticket.groups.map(g => g.label), gd.map(g => g.label));
    assert.deepEqual(ticket.groups.map(g => g.fixtureCount), gd.map(g => g.fixtureCount));
    assert.deepEqual(ticket.groups.map(g => g.fixtures.map(f => `${f.season}|${f.date}|${f.opponent}`)),
      gd.map(g => g.fixtures.map(f => `${f.season}|${f.date}|${f.opponent}`)));
    assert.equal(ticket.currentCount, 2);
    assert.deepEqual(ticket.currentOpponents, ['Bologna', 'Trieste']);
  }
});
test('YTD by week matches W1 and W2, not historical opponent positions or full seasons', () => {
  const groups = gdGroups('ytd-week');
  assert.deepEqual(groups.map(g => g.fixtureCount), [2, 2, 2, 2]);
  assert.deepEqual(groups[2].games.map(g => g.opponent), ['Other', 'Bologna']);
  assert.equal(gameDayMetric(groups[2], 'revenuePerGame', false), 600);
  assert.equal(gameDayMetric(groups[3], 'totalRevenue', false), 400);
});
test('YTD by opponent skips absent opponents without zero-padding or dividing by reference count', () => {
  const groups = gdGroups('ytd-opponent');
  assert.deepEqual(groups.map(g => g.fixtureCount), [1, 2, 2, 2]);
  assert.deepEqual(groups[0].games.map(g => g.opponent), ['Bologna']);
  assert.deepEqual(groups[2].games.map(g => g.opponent), ['Bologna', 'Trieste']);
  assert.equal(gameDayMetric(groups[0], 'revenuePerGame', false), 100);
  assert.equal(gameDayMetric(groups[2], 'revenuePerGame', false), 400);
  const ticket = buildSeasonComparison(tickets, 'ytd-opponent', 'total', selection, source);
  assert.deepEqual(getComparisonSeriesValues(ticket.groups, 'revenue', true, true), [100, 300, 400, 400]);
});
test('Custom selects exact fixtures in both modules and averages volumes but weights ratios', () => {
  const a = filters({ seasons: ['23-24'], opponents: ['Bologna'] });
  const b = filters({ seasons: ['26-27'] });
  const gd = buildGameDayGroups(fixtures, seasons, 'custom', gdSelection, a, b);
  const ticket = buildTicketingCustomComparison(tickets, 'total', a, b, source);
  assert.deepEqual(ticket.map(g => g.fixtureCount), [1, 2]);
  assert.deepEqual(ticket.map(g => g.fixtureCount), gd.map(g => g.fixtureCount));
  assert.equal(getMetricValue(ticket[1].games, 'revenue', true), 400);
  assert.equal(getMetricValue(ticket[1].games, 'attendance', true), 500);
  assert.equal(getMetricValue(ticket[1].games, 'yield', true), .8);
  assert.equal(gameDayMetric(gd[1], 'fbPerPerson', false), .8);
  assert.equal(gameDayMetric(gd[1], 'totalRevenue', false), 400);
  const chosen = { ...b, dates: [gameDayFixtureLabel(fixtures.find(f => f.season === '26-27' && f.opponent === 'Trieste'))] };
  assert.equal(buildTicketingCustomComparison(tickets, 'total', a, chosen, source)[1].fixtureCount, 1);
  assert.equal(buildGameDayGroups(fixtures, seasons, 'custom', gdSelection, a, chosen)[1].fixtureCount, 1);
  assert.deepEqual(getComparisonSeriesValues(ticket, 'cagrRevenue', true, false), [null, null]);
});
test('missing commercial data does not shift weeks and missing Ticketing yields dashes, not invented zeros', () => {
  const missingTicket = tickets.filter(g => !(g.season === '25-26' && g.opponent === 'Other'));
  const ticket = buildSeasonComparison(missingTicket, 'ytd-week', 'total', selection, source);
  assert.equal(ticket.groups[2].fixtureCount, 2);
  assert.equal(ticket.groups[2].missingFixtures, 1);
  assert.equal(getComparisonSeriesValues(ticket.groups, 'revenue', true, true)[2], null);
  const missingGD = source.filter(g => !(g.season === '25-26' && g.opponent === 'Other'));
  const gd = buildGameDayGroups(buildGameDayFixtures(missingGD, tickets, '2026-10-03'), seasons, 'ytd-week', gdSelection, filters(), filters());
  assert.equal(gd[2].fixtureCount, 2);
  assert.equal(gd[2].missingFixtures, 1);
  assert.equal(gameDayMetric(gd[2], 'revenuePerGame', false), null);
});
test('optional second opponent and repeated encounters are compared with the same averaging rules', () => {
  const ticket = buildSeasonComparison(tickets, 'opponent', 'total', { ...selection, secondOpponent: 'Trieste' }, source);
  const gd = buildGameDayGroups(fixtures, seasons, 'opponent', { ...gdSelection, secondOpponent: 'Trieste' }, filters(), filters());
  assert.deepEqual(ticket.groups.map(g => g.label), gd.map(g => g.label));
  assert.deepEqual(ticket.groups.map(g => g.fixtureCount), gd.map(g => g.fixtureCount));
});
test('hiding display seasons does not change either YTD reference cohort', () => {
  for (const mode of ['ytd-week', 'ytd-opponent']) {
    const comparison = buildSeasonComparison(tickets, mode, 'total', { ...selection, seasons: ['23-24'] }, source);
    assert.equal(comparison.groups.length, 1);
    assert.equal(comparison.currentCount, 2);
    assert.equal(comparison.groups[0].fixtureCount, mode === 'ytd-week' ? 2 : 1);
  }
});
test('leagues absent this season cannot silently use a historical YTD reference', () => {
  const olderLeague = { ...row('23-24', '21/09/2023', 'Bologna'), league: 'FEC' };
  const mixedSource = [...source, olderLeague];
  const olderTicket = { ...tickets[0], ...olderLeague, id: 'older-fec' };
  const mixedTickets = [...tickets, olderTicket];
  const mixedFixtures = buildGameDayFixtures(mixedSource, mixedTickets, '2026-10-03');
  for (const mode of ['ytd-week', 'ytd-opponent']) {
    const ticket = buildSeasonComparison(mixedTickets, mode, 'total', { ...selection, league: 'FEC' }, mixedSource);
    const gd = buildGameDayGroups(mixedFixtures, seasons, mode, { ...gdSelection, league: 'FEC' }, filters(), filters());
    assert.equal(ticket.currentCount, 0);
    assert.deepEqual(ticket.groups.map(g => g.fixtureCount), [0, 0, 0, 0]);
    assert.deepEqual(ticket.groups.map(g => g.label), gd.map(g => g.label));
  }
});
test('Ticketing PDF keeps averaged titles, chronological values and exact fixture provenance', () => {
  let html = '';
  const originalWindow = globalThis.window;
  globalThis.window = { open: () => ({
    document: { write: value => { html = value; }, close() {} },
    addEventListener() {}, focus() {}, print() {}, setTimeout() {},
  }) };
  try {
    const comparison = buildSeasonComparison(tickets, 'ytd-opponent', 'total', selection, source);
    printComparisonReports([{ title: comparison.title, subtitle: comparison.description, groups: comparison.groups,
      highlightLabels: comparison.currentLabels, showTrend: true, perGame: true, league: 'LBA' }],
      ['revenue', 'attendance', 'yield', 'loadFactor', 'cagrRevenue', 'cagrYield']);
    assert.ok(html.includes('Average revenue / game'));
    assert.ok(html.includes('Average attendance / game'));
    assert.ok(html.includes('Included fixtures'));
    assert.ok(html.includes('20/09/2026 · Bologna · LBA · 26-27'));
    assert.ok(html.includes('1/1 fixtures with data'));
    assert.ok(html.includes('2/2 fixtures with data'));
    assert.ok(!html.includes('Future'));
    assert.ok(!html.includes('26-28'));
    assert.match(html, /58[.,]7(?:4)?%/); // 100 -> 400 across three years.
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});