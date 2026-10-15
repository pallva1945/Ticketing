import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getGameDaySeasonPlan, getGameDayRevenueForecast } from '../src/utils/gameDayTargets.ts';
import { getTicketingSeasonPlan } from '../src/utils/ticketingTargets.ts';
import { compareRevenueForecast } from '../src/utils/revenueForecast.ts';
import { playedFixtures } from '../src/utils/fixtureEligibility.ts';

const combinations = [
  [['LBA'], 1275000, 3125000, 15],
  [['BCL'], 180000, 390000, 3],
  [['LBA - Pre Season'], 5000, 17500, 1],
  [['LBA', 'BCL'], 1455000, 3515000, 18],
  [['LBA', 'LBA - Pre Season'], 1280000, 3142500, 16],
  [['BCL', 'LBA - Pre Season'], 185000, 407500, 4],
  [['LBA', 'BCL', 'LBA - Pre Season'], 1460000, 3532500, 19],
  [['All'], 1460000, 3532500, 19],
];

for (const [leagues, target, combined, games] of combinations) {
  test(`2026/27 GameDay: ${leagues.join(' + ')} adds goals and counts fixtures only once`, () => {
    assert.deepEqual(getGameDaySeasonPlan(['26-27'], leagues, false), { target, games });
    assert.deepEqual(getGameDaySeasonPlan(['26-27'], leagues, true), { target: combined, games });
    assert.equal(combined - target, getTicketingSeasonPlan(['26-27'], leagues, 'total').target);
  });
}

test('historical GameDay targets remain unchanged with Ticketing both off and on', () => {
  for (const season of ['25-26', '24-25']) {
    for (const leagues of [['LBA'], ['BCL'], ['All']]) {
      assert.deepEqual(getGameDaySeasonPlan([season], leagues, false), { target: 1250000, games: 15 });
      assert.deepEqual(getGameDaySeasonPlan([season], leagues, true), { target: 2900000, games: 15 });
    }
  }
  assert.deepEqual(getGameDaySeasonPlan(['25-26', '26-27'], ['LBA'], false), { target: 2525000, games: 30 });
  assert.deepEqual(getGameDaySeasonPlan(['25-26', '26-27'], ['LBA'], true), { target: 6025000, games: 30 });
});

test('duplicates, season aliases, unknown selections and additional completed games are safe', () => {
  assert.deepEqual(getGameDaySeasonPlan(['26/27', '2026-2027', '2026-27'], ['BCL', 'BCL'], false), { target: 180000, games: 3 });
  for (const leagues of [[], ['Unknown competition']]) {
    assert.deepEqual(getGameDaySeasonPlan(['26-27'], leagues, true), { target: 0, games: 0 });
  }
  assert.deepEqual(getGameDaySeasonPlan(['26-27'], ['BCL'], false, 5), { target: 180000, games: 5 });
});

const widgetSource = fs.readFileSync(new URL('../src/components/PacingWidget.tsx', import.meta.url), 'utf8')
  .replace(/^import .*;$/gm, '')
  .replace('export const PacingWidget', 'const PacingWidget');
const compiled = ts.transpileModule(widgetSource, {
  compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 },
}).outputText;
const Icon = () => null;
const Widget = new Function('React', 'useLanguage', 'compareRevenueForecast', 'Target', 'TrendingUp', 'AlertTriangle',
  `${compiled}; return PacingWidget;`)(React, () => ({ t: key => key }), compareRevenueForecast, Icon, Icon, Icon);

test('visible GameDay goal, projected revenue and pace use the selected competitions and Ticketing toggle', () => {
  for (const [leagues, target, combined, games] of combinations) {
    for (const includeTicketing of [false, true]) {
      const plan = getGameDaySeasonPlan(['26-27'], leagues, includeTicketing);
      const budget = includeTicketing ? combined : target;
      const html = renderToStaticMarkup(React.createElement(Widget, {
        currentRevenue: budget / games, gamesPlayed: 1,
        seasonTarget: plan.target, totalGamesInSeason: plan.games,
      }));
      assert.ok(html.includes(`€${budget.toLocaleString('en-GB')}`));
      assert.match(html, new RegExp(`1 / ${games} Games Played`));
      assert.match(html, /\+0\.0%/);
      assert.doesNotMatch(html, /NaN|Infinity/);
    }
  }
});

test('advance sales do not enter pace; selecting competitions changes both the budget and forecast denominator', () => {
  const fixtures = [
    { season: '26-27', date: '2026-09-19', league: 'LBA - Pre Season', totalRevenue: 5000, tixRevenue: 0 },
    { season: '26-27', date: '2026-09-27', league: 'LBA', totalRevenue: 85000, tixRevenue: 0 },
    { season: '26-27', date: '2026-10-20', league: 'BCL', totalRevenue: 60000, tixRevenue: 0 },
  ];
  const played = playedFixtures(fixtures, '2026-10-15');
  assert.equal(played.length, 2);
  // No completed BCL data means no complete combined projection, not a fabricated red forecast.
  assert.deepEqual(getGameDayRevenueForecast(['26-27'], ['All'], false, played), { projectedRevenue: null, games: 19 });
  const lba = getGameDaySeasonPlan(['26-27'], ['LBA'], false, 1);
  assert.deepEqual(getGameDayRevenueForecast(['26-27'], ['LBA'], false, played), { projectedRevenue: lba.target, games: 15 });
});

function renderForecast(fixtures, leagues, includeTicketing = false) {
  const selected = fixtures.filter(game => leagues.includes('All') || leagues.includes(game.league));
  const plan = getGameDaySeasonPlan(['26-27'], leagues, includeTicketing, selected.length);
  const forecast = getGameDayRevenueForecast(['26-27'], leagues, includeTicketing, selected);
  const currentRevenue = selected.reduce((sum, game) => sum + game.totalRevenue
    - (includeTicketing ? 0 : game.tixRevenue), 0);
  return {
    plan, forecast, currentRevenue,
    html: renderToStaticMarkup(React.createElement(Widget, {
      currentRevenue, gamesPlayed: selected.length,
      seasonTarget: plan.target, totalGamesInSeason: forecast.games,
      projectedRevenue: forecast.projectedRevenue,
    })),
  };
}

test('regression: three green competitions stay green together despite unequal fixture counts and revenue levels', () => {
  const fixtures = ['LBA', 'BCL', 'BCL', 'LBA - Pre Season'].map(league => {
    const gameDay = getGameDaySeasonPlan(['26-27'], [league], false);
    const ticketing = getTicketingSeasonPlan(['26-27'], [league], 'total');
    const tixRevenue = ticketing.target / ticketing.games * 1.1;
    return {
      season: '26-27', league,
      totalRevenue: gameDay.target / gameDay.games * 1.1 + tixRevenue,
      tixRevenue,
    };
  });
  for (const includeTicketing of [false, true]) {
    const individual = ['LBA', 'BCL', 'LBA - Pre Season'].map(league => renderForecast(fixtures, [league], includeTicketing));
    for (const result of individual) {
      assert.match(result.html, /text-green-400/);
      assert.match(result.html, /\+10\.0%/);
      assert.ok(result.forecast.projectedRevenue > result.plan.target);
    }
    const combined = renderForecast(fixtures, ['All'], includeTicketing);
    // Reproduce the previous pooled-average bug: every league is green but the old total was red.
    assert.ok(combined.currentRevenue / fixtures.length * 19 < combined.plan.target);
    assert.equal(combined.forecast.projectedRevenue,
      Math.round(individual.reduce((sum, result) => sum + result.forecast.projectedRevenue, 0) * 100) / 100);
    assert.match(combined.html, /\+10\.0%/);
    assert.match(combined.html, /text-green-400/);
    assert.doesNotMatch(combined.html, /text-red-400/);
    for (const leagues of [['LBA', 'BCL'], ['LBA', 'LBA - Pre Season'], ['BCL', 'LBA - Pre Season']]) {
      const pair = renderForecast(fixtures, leagues, includeTicketing);
      assert.match(pair.html, /\+10\.0%/);
      assert.match(pair.html, /text-green-400/);
    }
  }
});

test('combined signed forecast gap equals the sum of individual gaps, rather than forcing a green total', () => {
  const fixtures = [
    { season: '26-27', league: 'LBA', totalRevenue: 70000, tixRevenue: 0 },
    { season: '26-27', league: 'BCL', totalRevenue: 70000, tixRevenue: 0 },
    { season: '26-27', league: 'LBA - Pre Season', totalRevenue: 6000, tixRevenue: 0 },
  ];
  const individual = fixtures.map(game => renderForecast(fixtures, [game.league]));
  const combined = renderForecast(fixtures, ['All']);
  assert.equal(combined.forecast.projectedRevenue, 1266000);
  assert.equal(combined.forecast.projectedRevenue - combined.plan.target,
    individual.reduce((sum, result) => sum + result.forecast.projectedRevenue - result.plan.target, 0));
  assert.match(combined.html, /text-red-400/);
  assert.match(combined.html, /-13\.3%/);
});

test('missing competition data shows a neutral forecast while preserving real revenue and the full goal', () => {
  const result = renderForecast([{ season: '26-27', league: 'LBA', totalRevenue: 100000, tixRevenue: 0 }], ['All']);
  assert.equal(result.forecast.projectedRevenue, null);
  assert.match(result.html, /€100,000/);
  assert.match(result.html, /€1,460,000/);
  assert.match(result.html, /1 \/ 19 Games Played/);
  assert.match(result.html, /Projection unavailable/);
  assert.doesNotMatch(result.html, /text-red-400|text-green-400|NaN|Infinity/);
  assert.deepEqual(getGameDayRevenueForecast(['26-27'], ['All'], false, []), { projectedRevenue: null, games: 19 });
  assert.deepEqual(getGameDayRevenueForecast(['26-27'], ['Unknown competition'], false, []), { projectedRevenue: null, games: 0 });
});

test('historical forecast pooling and budgets remain unchanged; current extra games clamp per competition', () => {
  const historical = [
    { season: '25-26', league: 'LBA', totalRevenue: 110000, tixRevenue: 10000 },
    { season: '25-26', league: 'BCL', totalRevenue: 25000, tixRevenue: 5000 },
  ];
  assert.deepEqual(getGameDayRevenueForecast(['25-26'], ['All'], false, historical), { projectedRevenue: 900000, games: 15 });
  assert.deepEqual(getGameDayRevenueForecast(['25-26'], ['All'], true, historical), { projectedRevenue: 1012500, games: 15 });
  const fixtures = [
    { season: '26-27', league: 'LBA', totalRevenue: 85000, tixRevenue: 0 },
    ...Array.from({ length: 5 }, () => ({ season: '26-27', league: 'BCL', totalRevenue: 60000, tixRevenue: 0 })),
    { season: '26-27', league: 'LBA - Pre Season', totalRevenue: 5000, tixRevenue: 0 },
  ];
  assert.deepEqual(getGameDayRevenueForecast(['26/27', '2026-2027'], ['All'], false, fixtures), { projectedRevenue: 1580000, games: 21 });
});
