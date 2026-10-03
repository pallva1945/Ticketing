import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixtureDay, isPlayedFixture, isUpcomingFixture, playedFixtures, romeDay } from '../src/utils/fixtureEligibility.ts';
import { buildGameDayFixtures, buildGameDayGroups, gameDayMetric } from '../src/utils/gameDayComparison.ts';
import { buildSeasonComparison, buildTicketingCustomComparison } from '../src/utils/seasonComparison.ts';
import { calculateKPIs } from '../src/components/StatsCards.tsx';

const asOf = '2026-10-03';
const ticket = (date, totalRevenue, attendance = 100) => ({
  id: `26-27|${date}|Bologna`, opponent: 'Bologna', date, season: '26-27', league: 'LBA', tier: 1,
  totalRevenue, attendance, capacity: 1000, zoneCapacities: {}, corpRevenue: 0,
  salesBreakdown: [], pnlBreakdown: {}, oppRank: 1, pvRank: 1,
});
const commercial = (game, revenue) => ({
  ...game, tixRevenue: 0, totalRevenue: revenue, fbRevenue: revenue,
  merchRevenue: 0, hospitalityRevenue: 0, parkingRevenue: 0,
  sponsorshipRevenue: 0, tvRevenue: 0, expRevenue: 0,
});
const tickets = [
  ticket('20/09/2026', 1000, 100), ticket('27/09/2026', 2000, 200),
  ticket('03/10/2026', 30000, 800), ticket('10/10/2026', 50000, 900),
];
const all = { seasons: ['All'], leagues: ['All'], opponents: ['All'], tiers: ['All'], dates: ['All'] };
const selection = { league: 'LBA', opponent: 'Bologna', secondOpponent: '', firstTier: 1, week: 1 };

test('today and future games are excluded from BOTH numerator and denominator', () => {
  const games = playedFixtures(tickets, asOf);
  assert.equal(games.length, 2);
  const kpis = calculateKPIs(games);
  assert.equal(kpis.totalRevenue, 3000);
  assert.equal(kpis.arpg, 1500);
  assert.equal(kpis.totalAttendance / kpis.gameCount, 150);
  assert.equal(kpis.occupancy, 15);
  assert.equal(tickets.length, 4, 'raw fixtures must remain available for inspection');
  assert.deepEqual(tickets.filter(game => isUpcomingFixture(game, asOf)).map(game => game.totalRevenue), [30000, 50000]);
});

test('eligibility changes on the following Rome calendar day, not tipoff or upload', () => {
  assert.equal(isPlayedFixture(tickets[2], '2026-10-03'), false);
  assert.equal(isPlayedFixture(tickets[2], '2026-10-04'), true);
  assert.equal(playedFixtures(tickets, '2026-10-04').length, 3);
  assert.equal(playedFixtures(tickets, '2026-10-11').length, 4);
});

test('Rome midnight cutoff is independent of browser timezone in summer and winter', () => {
  assert.equal(romeDay(new Date('2026-10-03T21:59:59Z')), '2026-10-03');
  assert.equal(romeDay(new Date('2026-10-03T22:00:00Z')), '2026-10-04');
  assert.equal(romeDay(new Date('2026-12-03T22:59:59Z')), '2026-12-03');
  assert.equal(romeDay(new Date('2026-12-03T23:00:00Z')), '2026-12-04');
});

test('DST transitions retain the correct calendar-day rule', () => {
  assert.equal(romeDay(new Date('2026-03-29T21:59:59Z')), '2026-03-29');
  assert.equal(romeDay(new Date('2026-03-29T22:00:00Z')), '2026-03-30');
  assert.equal(romeDay(new Date('2026-10-25T22:59:59Z')), '2026-10-25');
  assert.equal(romeDay(new Date('2026-10-25T23:00:00Z')), '2026-10-26');
});

test('date normalization validates Italian, short-year and ISO fixture dates', () => {
  assert.equal(fixtureDay('3/10/2026'), '2026-10-03');
  assert.equal(fixtureDay('03/10/26 20.00'), '2026-10-03');
  assert.equal(fixtureDay('2026-10-03T20:00:00'), '2026-10-03');
  assert.equal(fixtureDay('29/02/2024'), '2024-02-29');
  for (const value of ['', 'unknown', '31/02/2026', '2026-13-01']) {
    assert.equal(fixtureDay(value), '');
    assert.equal(isPlayedFixture({ date: value }, asOf), false);
    assert.equal(isUpcomingFixture({ date: value }, asOf), false);
  }
});

test('real zero-revenue played games count; postponed dates and missing dates do not', () => {
  const games = [ticket('01/10/2026', 0), ticket('10/10/2026', 1000), ticket('', 1000)];
  const played = playedFixtures(games, asOf);
  assert.equal(played.length, 1);
  assert.equal(calculateKPIs(played).arpg, 0);
  assert.equal(calculateKPIs(playedFixtures(tickets, '2026-09-20')), null);
});

test('GameDay averages and fixture counts use the same strict played cohort', () => {
  const data = tickets.map((game, index) => commercial(game, [100, 300, 8000, 9000][index]));
  const fixtures = buildGameDayFixtures(data, tickets, asOf);
  const groups = buildGameDayGroups(fixtures, ['26-27'], 'tier',
    { league: 'LBA', opponent: 'Bologna', tier: '1', week: 1 }, all, all);
  assert.equal(groups[0].fixtureCount, 2);
  assert.equal(gameDayMetric(groups[0], 'revenuePerGame', false), 200);
  assert.equal(gameDayMetric(groups[0], 'avgAttendance', false), 150);
  assert.equal(gameDayMetric(groups[0], 'operationalPerPerson', false), 400 / 300);
});

test('all Ticketing preset and custom comparisons exclude today and future fixtures', () => {
  for (const mode of ['opponent', 'week', 'tier', 'ytd', 'ytd-week', 'ytd-opponent']) {
    const result = buildSeasonComparison(tickets, mode, 'total', selection, [], asOf);
    assert.equal(result.currentCount, 2);
    assert.ok(result.groups.flatMap(group => group.games).every(game => isPlayedFixture(game, asOf)));
  }
  const groups = buildTicketingCustomComparison(tickets, 'total', all, all, [], asOf);
  assert.equal(groups[0].fixtureCount, 2);
  assert.equal(calculateKPIs(groups[0].games).arpg, 1500);
  const onlyFuture = { ...all, dates: ['2026-10-10'] };
  assert.equal(buildTicketingCustomComparison(tickets, 'total', onlyFuture, all, [], asOf)[0].fixtureCount, 0);
});

test('missing historical figures retain fixture positions without admitting future records', () => {
  const data = [commercial(tickets[1], 300), commercial(tickets[3], 9000)];
  const fixtures = buildGameDayFixtures(data, tickets, asOf);
  assert.equal(fixtures.length, 2);
  assert.equal(fixtures[0].data, undefined);
  assert.equal(fixtures[1].data.fbRevenue, 300);
});