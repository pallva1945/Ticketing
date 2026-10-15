import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getTicketingSeasonPlan } from '../src/utils/ticketingTargets.ts';
import { compareRevenueForecast } from '../src/utils/revenueForecast.ts';
import { playedFixtures } from '../src/utils/fixtureEligibility.ts';

const combinations = [
  [['LBA'], 1850000, 15],
  [['BCL'], 585000, 3],
  [['LBA - Pre Season'], 12500, 1],
  [['LBA', 'BCL'], 2435000, 18],
  [['LBA', 'LBA - Pre Season'], 1862500, 16],
  [['BCL', 'LBA - Pre Season'], 597500, 4],
  [['LBA', 'BCL', 'LBA - Pre Season'], 2447500, 19],
  [['All'], 2447500, 19],
];
for (const [leagues, target, games] of combinations) {
  test(`2026/27 ${leagues.join(' + ')} uses the matching target and fixture count`, () => {
    for (const mode of ['total', 'gameday']) {
      assert.deepEqual(getTicketingSeasonPlan(['26-27'], leagues, mode), { target, games });
    }
  });
}

test('historical targets are not rebased to this year, in either view or report', () => {
  for (const season of ['25-26', '24-25']) {
    for (const leagues of [['LBA'], ['BCL'], ['All']]) {
      assert.deepEqual(getTicketingSeasonPlan([season], leagues, 'total'), { target: 1650000, games: 15 });
      assert.deepEqual(getTicketingSeasonPlan([season], leagues, 'gameday'), { target: 495000, games: 15 });
    }
  }
  assert.deepEqual(getTicketingSeasonPlan(['25-26', '26-27'], ['LBA'], 'total'), { target: 3500000, games: 30 });
});

test('aliases, duplicate selections and absent budgets never duplicate or invent targets', () => {
  assert.deepEqual(getTicketingSeasonPlan(['26/27', '2026-2027', '26-27'], ['LBA', 'LBA'], 'total'), { target: 1850000, games: 15 });
  assert.deepEqual(getTicketingSeasonPlan(['26-27'], [], 'total'), { target: 0, games: 0 });
  assert.deepEqual(getTicketingSeasonPlan(['26-27'], ['Unknown competition'], 'total'), { target: 0, games: 0 });
  assert.deepEqual(getTicketingSeasonPlan(['26-27'], ['BCL'], 'total', 5), { target: 585000, games: 5 });
});

// Render the actual widget source, stubbing only translations and icon components.
const widgetSource = fs.readFileSync(new URL('../src/components/PacingWidget.tsx', import.meta.url), 'utf8')
  .replace(/^import .*;$/gm, '')
  .replace('export const PacingWidget', 'const PacingWidget');
const compiled = ts.transpileModule(widgetSource, {
  compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 },
}).outputText;
const Icon = () => null;
const Widget = new Function('React', 'useLanguage', 'compareRevenueForecast', 'Target', 'TrendingUp', 'AlertTriangle',
  `${compiled}; return PacingWidget;`)(React, () => ({ t: key => key }), compareRevenueForecast, Icon, Icon, Icon);
const render = (revenue, played, plan) => renderToStaticMarkup(React.createElement(Widget, {
  currentRevenue: revenue, gamesPlayed: played, seasonTarget: plan.target, totalGamesInSeason: plan.games,
}));

test('changing competition recalculates the visible goal, games, forecast and pace together', () => {
  for (const [leagues, target, games] of combinations) {
    const plan = getTicketingSeasonPlan(['26-27'], leagues, 'total', 1);
    const html = render(target / games, 1, plan);
    assert.ok(html.includes(`€${target.toLocaleString('en-GB')}`), html);
    assert.match(html, new RegExp(`1 / ${games} Games Played`));
    assert.match(html, /\+0\.0%/);
    assert.doesNotMatch(html, /NaN|Infinity/);
  }
});

test('preseason budget stays exact; no games and unknown competitions do not invent a projection', () => {
  const plan = getTicketingSeasonPlan(['26-27'], ['LBA - Pre Season'], 'total');
  assert.match(render(0, 0, plan), /€12,500/);
  assert.match(render(0, 0, plan), /Projection unavailable/);
  assert.doesNotMatch(render(0, 0, plan), /0\.0M|NaN|Infinity/);
  assert.match(render(0, 0, { target: 0, games: 0 }), /No target configured/);
});

test('upcoming sales stay outside performance pace and do not change the configured game count', () => {
  const fixtures = [
    { season: '26-27', league: 'LBA', date: '2026-10-01', revenue: 100000 },
    { season: '26-27', league: 'LBA', date: '2026-10-20', revenue: 900000 },
  ];
  const played = playedFixtures(fixtures, '2026-10-15');
  const plan = getTicketingSeasonPlan(['26-27'], ['LBA'], 'total', played.length);
  const html = render(played.reduce((sum, game) => sum + game.revenue, 0), played.length, plan);
  assert.match(html, /€1,500,000/);
  assert.match(html, /-18\.9%/);
  assert.match(html, /1 \/ 15 Games Played/);
});
