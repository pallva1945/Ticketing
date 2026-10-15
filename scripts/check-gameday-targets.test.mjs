import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getGameDaySeasonPlan } from '../src/utils/gameDayTargets.ts';
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
    { date: '2026-09-19', league: 'LBA - Pre Season', revenue: 5000 },
    { date: '2026-09-27', league: 'LBA', revenue: 85000 },
    { date: '2026-10-20', league: 'BCL', revenue: 60000 },
  ];
  const played = playedFixtures(fixtures, '2026-10-15');
  const all = getGameDaySeasonPlan(['26-27'], ['All'], false, played.length);
  assert.equal(played.length, 2);
  assert.equal(played.reduce((sum, game) => sum + game.revenue, 0) / played.length * all.games, 855000);
  const lba = getGameDaySeasonPlan(['26-27'], ['LBA'], false, 1);
  assert.equal(85000 * lba.games, lba.target);
});
