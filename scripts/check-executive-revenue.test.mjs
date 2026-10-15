import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getExecutiveRevenue } from '../src/utils/executiveRevenue.ts';
import { compareRevenueForecast } from '../src/utils/revenueForecast.ts';
import { getRevenueSeasonGames, getDefaultRevenueLeagues } from '../src/utils/revenueSeasonGames.ts';
import { isSeason26_27 } from '../src/constants.ts';
import { getSponsorshipSeasonTarget } from '../src/utils/sponsorshipTargets.ts';

const combinations = [
  [['LBA'], 1850000, 1275000, 15],
  [['BCL'], 210000, 180000, 3],
  [['LBA - Pre Season'], 12500, 5000, 1],
  [['LBA', 'BCL'], 2060000, 1455000, 18],
  [['LBA', 'LBA - Pre Season'], 1862500, 1280000, 16],
  [['BCL', 'LBA - Pre Season'], 222500, 185000, 4],
  [['LBA', 'BCL', 'LBA - Pre Season'], 2072500, 1460000, 19],
  [['All'], 2072500, 1460000, 19],
];

const source = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const home = source.slice(source.indexOf('const RevenueHome ='), source.indexOf('const SetupModal ='));
const compiled = ts.transpileModule(home, {
  compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 },
}).outputText;
const icons = source.match(/import \{ (.*?) \} from 'lucide-react'/)[1].split(',').map(s => s.trim());

// Render the real Executive component and capture the same serialized context
// handed to its AI advisor. No provider requests, login bypass or browser needed.
function renderExecutive({ season = '26-27', leagues = ['All'], tix = 100000, tixGames = 1,
  gd = 50000, gdGames = 1, sponsorship = 0, sponsorData = false, sheetState } = {}) {
  let context;
  let hook = 0;
  const effects = [];
  const deps = {
    React, useLanguage: () => ({ t: key => key }),
    useState: initial => [sheetState ? sheetState[hook++] : initial, () => {}],
    useEffect: fn => effects.push(fn),
    compareRevenueForecast, getRevenueSeasonGames, getDefaultRevenueLeagues, isSeason26_27, getSponsorshipSeasonTarget,
    AIAvatar: () => null,
    ...Object.fromEntries(icons.map(name => [name, () => null])),
  };
  const Home = new Function(...Object.keys(deps), `${compiled}; return RevenueHome;`)(...Object.values(deps));
  const html = renderToStaticMarkup(React.createElement(Home, {
    modules: [], ticketingRevenue: tix, gameDayRevenue: gd,
    gameDayTicketing: tix / 2, gameDayViewTicketing: tix / 2,
    sponsorshipRevenue: sponsorship, sponsorshipHasData: sponsorData,
    merchRevenue: 0, merchGameDayRevenue: 0, gamesPlayed: tixGames, seasonFilter: season,
    executiveRevenue: getExecutiveRevenue([season], leagues, tix, tixGames, gd, gdGames),
    activeFilters: { seasons: [season], leagues, opponents: ['All'], zones: ['All'] },
    onNavigate() {}, onAiClick() {}, onSeasonChange() {}, onClearFilters() {},
    onExecutiveContext: value => { context = JSON.parse(value); },
    yoyStats: { seasons: [], chartData: [], corpTixBySeason: {} },
  }));
  // The first effect fetches independent sheets; the second publishes context.
  effects[1]();
  assert.doesNotMatch(html, /NaN|Infinity/);
  return { html, context };
}

for (const [leagues, tixTarget, gdTarget, games] of combinations) {
  test(`Executive display and AI share competition goals: ${leagues.join(' + ')}`, () => {
    const tix = tixTarget / games * 1.1;
    const gd = gdTarget / games * 1.1;
    const { html, context } = renderExecutive({ leagues, tix, gd });
    const [ticketing, gameDay] = context.streams.filter(v => ['ticketing', 'gameday'].includes(v.id));
    assert.equal(ticketing.target, tixTarget);
    assert.equal(gameDay.target, gdTarget);
    assert.equal(ticketing.totalGames, games);
    assert.equal(gameDay.totalGames, games);
    assert.equal(context.totalGames, games);
    assert.ok(Math.abs(context.totals.projectedFinish - (tixTarget + gdTarget) * 1.1) < 1e-6);
    assert.equal(context.totals.target, tixTarget + gdTarget);
    assert.ok(Math.abs(context.totals.forecastVsTarget.percent - 10) < 1e-6);
    assert.ok(Math.abs(context.ticketingAndGameDay.forecast.percent - 10) < 1e-6);
    assert.match(html, /text-green-700[^>]*>\+10\.0%/);
    assert.match(html, new RegExp(`1 of ${games} games played`));
    assert.equal(html.includes('Baseline: 15 LBA'), leagues.includes('All'));
  });
}

test('historical goals remain 1.65M and 1.25M across competitions', () => {
  for (const season of ['25-26', '24-25', '23-24']) {
    for (const leagues of [['All'], ['LBA'], ['BCL']]) {
      const { context } = renderExecutive({ season, leagues });
      assert.equal(context.totals.target, 2900000);
      assert.equal(context.totalGames, 15);
      assert.equal(context.streams.find(v => v.id === 'ticketing').target, 1650000);
      assert.equal(context.streams.find(v => v.id === 'gameday').target, 1250000);
    }
  }
});

test('separate provider counts, extra played fixtures and zero actuals remain valid', () => {
  const result = getExecutiveRevenue(['26-27'], ['BCL'], 200000, 4, 60000, 2);
  assert.equal(result.ticketing.games, 4);
  assert.equal(result.ticketing.projectedFinish, 200000);
  assert.equal(result.gameDay.projectedFinish, 90000);
  assert.equal(result.combined.projectedFinish, 290000);
  const zero = getExecutiveRevenue(['26-27'], ['All'], 0, 1, 0, 1);
  assert.equal(zero.ticketing.forecast.percent, -100);
  assert.equal(zero.combined.forecast.available, true);
});

test('missing GameDay does not become a zero-revenue forecast or borrow Ticketing counts', () => {
  const { html, context } = renderExecutive({ gd: 0, gdGames: 0 });
  const gd = context.streams.find(v => v.id === 'gameday');
  assert.equal(gd.actual, null);
  assert.equal(gd.projectedFinish, null);
  assert.equal(gd.forecastVsTarget.available, false);
  assert.equal(context.ticketingAndGameDay.forecast.available, false);
  assert.equal(context.ticketingAndGameDay.projectedFinish, null);
  assert.equal(context.totals.target, 2072500);
  assert.match(html, /Projected Revenue.*>—</);
});

test('completely missing data renders safely, with no invented forecast', () => {
  const { html, context } = renderExecutive({ tix: 0, tixGames: 0, gd: 0, gdGames: 0 });
  assert.equal(context.totals.projectedFinish, null);
  assert.equal(context.totals.forecastVsTarget.available, false);
  assert.match(html, /No revenue projection available/);
});

test('annual and independent sheet forecasts survive before the first game without rebasing their budgets', () => {
  const { context } = renderExecutive({ leagues: ['BCL'], tix: 0, tixGames: 0, gd: 0, gdGames: 0,
    sponsorship: 2300000, sponsorData: true,
    sheetState: [true, 100000, 50000, 200000, true, 6] });
  const stream = id => context.streams.find(v => v.id === id);
  assert.equal(stream('sponsorship').target, 2400000);
  assert.equal(stream('sponsorship').projectedFinish, 2300000);
  assert.equal(stream('sponsorship').actual, 0); // Existing recognition, not the signed annual total.
  assert.equal(stream('bops').target, 525000);
  assert.equal(stream('venue_ops').target, 262364);
  assert.equal(stream('sg').target, 930465);
  assert.equal(context.totals.projectedFinish, 3000000);
  assert.equal(context.totals.target, 4117829);
  assert.equal(context.totals.forecastVsTarget.available, true);
});

test('competition goals do not change annual sponsorship recognition', () => {
  const { context } = renderExecutive({ leagues: ['LBA - Pre Season'], sponsorship: 2300000, sponsorData: true });
  const sponsor = context.streams.find(v => v.id === 'sponsorship');
  assert.ok(Math.abs(sponsor.actual - 2300000 / 19) < 1e-6);
  assert.equal(sponsor.projectedFinish, 2300000);
  assert.equal(sponsor.target, 2400000);
});

test('unknown competitions do not fabricate target variance; season aliases share the new plan', () => {
  for (const season of ['26/27', '2026-2027', '2026-27']) {
    assert.equal(getExecutiveRevenue([season], ['All'], 0, 0, 0, 0).combined.target, 3532500);
  }
  const { context } = renderExecutive({ leagues: ['Unknown'] });
  assert.equal(context.totals.forecastVsTarget.available, false);
  assert.equal(context.ticketingAndGameDay.forecast.available, false);
});

test('Executive AI consumes the displayed context, independent of GameDay Ticketing toggle and ticket sales view', () => {
  const start = source.indexOf("if (activeModule === 'home') {");
  const branch = source.slice(start, source.indexOf("if (activeModule === 'gameday')", start));
  assert.match(branch, /return executiveAIContext/);
  assert.doesNotMatch(branch, /filteredGameDayRevForPacing|viewMode|1130000|1650000|1250000/);
});
