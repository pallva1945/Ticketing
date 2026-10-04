import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { compareRevenueForecast } from '../src/utils/revenueForecast.ts';
import { getRevenueSeasonGames, getDefaultRevenueLeagues } from '../src/utils/revenueSeasonGames.ts';
import { playedFixtures } from '../src/utils/fixtureEligibility.ts';

test('an above-budget forecast has a positive currency and percentage variance', () => {
  const forecast = compareRevenueForecast(7170000, 6720000);
  assert.equal(forecast.difference, 450000);
  assert.ok(Math.abs(forecast.percent - 6.696428571428571) < 1e-9);
  assert.equal(forecast.onTarget, true);
});

test('26/27 Ticketing and GameDay forecasts use 19 games, without changing historical seasons', () => {
  for (const season of ['26-27', '26/27', '2026-2027']) {
    assert.equal(getRevenueSeasonGames(season), 19);
    assert.equal(100000 / 2 * getRevenueSeasonGames(season), 950000);
    assert.equal(50000 / 2 * getRevenueSeasonGames(season), 475000);
  }
  assert.equal(getRevenueSeasonGames('25-26'), 15);
  assert.equal(getRevenueSeasonGames('24/25'), 15);
  assert.equal(getRevenueSeasonGames('26-27', 20), 20);
});

test('the completed friendly and LBA match count together, without future BCL/LBA sales', () => {
  const games = [
    { date: '19/09/2026', league: 'LBA - Pre Season', season: '26-27', revenue: 20000 },
    { date: '27/09/2026', league: 'LBA', season: '26-27', revenue: 100000 },
    { date: '10/10/2026', league: 'LBA', season: '26-27', revenue: 90000 },
    { date: '13/10/2026', league: 'BCL', season: '26-27', revenue: 60000 },
  ];
  const leagues = getDefaultRevenueLeagues('26-27');
  const completed = playedFixtures(games.filter(g => leagues.includes('All') || leagues.includes(g.league)), '2026-10-04');
  assert.equal(completed.length, 2);
  assert.equal(completed.reduce((sum, g) => sum + g.revenue, 0), 120000);
  assert.equal(120000 / completed.length * getRevenueSeasonGames('26-27'), 1140000);
  assert.deepEqual(getDefaultRevenueLeagues('26/27'), ['All']);
  assert.deepEqual(getDefaultRevenueLeagues('25-26'), ['LBA']);
  assert.equal(playedFixtures(games.filter(g => g.league === 'LBA'), '2026-10-04').length, 1);
});

test('below-budget and exactly on-budget forecasts use consistent signs', () => {
  const below = compareRevenueForecast(6000000, 6720000);
  assert.equal(below.difference, -720000);
  assert.ok(below.percent < 0);
  assert.equal(below.onTarget, false);
  assert.deepEqual(compareRevenueForecast(6720000, 6720000), {
    available: true, difference: 0, percent: 0, onTarget: true,
  });
});

test('missing data and invalid budgets do not fabricate a forecast status', () => {
  for (const args of [[0, 100, false], [10, 0], [NaN, 100], [10, Infinity]]) {
    const result = compareRevenueForecast(...args);
    assert.equal(result.available, false);
    assert.equal(result.difference, null);
    assert.equal(result.percent, null);
  }
  assert.equal(compareRevenueForecast(0, 100).percent, -100);
});

test('aggregate forecast variance equals the sum of individual currency variances', () => {
  const verticals = [[3000000, 2500000], [4170000, 4220000]];
  const aggregate = compareRevenueForecast(
    verticals.reduce((sum, [forecast]) => sum + forecast, 0),
    verticals.reduce((sum, [, target]) => sum + target, 0),
  );
  assert.equal(aggregate.difference, verticals.reduce((sum, [forecast, target]) => sum + compareRevenueForecast(forecast, target).difference, 0));
  assert.equal(aggregate.onTarget, true);
});

const source = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
function compileMarkup(jsx, names) {
  const compiled = ts.transpileModule(`return (<>${jsx}</>);`, {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  return new Function('React', ...names, compiled);
}
const formatCompact = new Function(
  source.slice(source.indexOf('const formatCompact = (val: number)'), source.indexOf('    return (', source.indexOf('const formatCompact = (val: number)')))
    .replace('(val: number)', '(val)') + '\nreturn formatCompact;',
)();

test('Season Pacing is green and +6.7% for 7.17M forecast against 6.72M, despite a YTD shortfall', () => {
  const start = source.indexOf('<div className="flex flex-wrap justify-between items-end gap-3 mb-4">');
  const jsx = source.slice(start, source.indexOf('{/* Stacked Progress Bar */}', start));
  const render = compileMarkup(jsx, ['t', 'formatCompact', 'totalRevenueYTD', 'totalTarget', 'ytdDifference', 'seasonForecast', 'totalRevenueProjected', 'projectionDiff']);
  const forecast = compareRevenueForecast(7170000, 6720000);
  const html = renderToStaticMarkup(render(React, key => key, formatCompact, 600000, 6720000, -164000, forecast, 7170000, forecast.difference));
  assert.match(html, /YTD vs Expected.*-€164k/);
  assert.match(html, /Forecast vs Target/);
  assert.match(html, /text-green-700[^>]*>\+6\.7%/);
  assert.match(html, /€7\.17M/);
  assert.match(html, /\+€450k vs season target/);
  assert.doesNotMatch(html, /Behind Pace/);
  const missing = compareRevenueForecast(0, 6720000, false);
  const empty = renderToStaticMarkup(render(React, key => key, formatCompact, 0, 6720000, 0, missing, 0, 0));
  assert.match(empty, /No revenue projection available/);
  assert.doesNotMatch(empty, /text-green-700|text-red-700/);
});

test('vertical percentages and colors follow their forecast, not their YTD pace', () => {
  const jsx = source.slice(source.indexOf('{/* 7 VERTICAL SCORE CARDS */}'), source.indexOf('{/* STRATEGIC SIGNALS */}'));
  const render = compileMarkup(jsx, ['t', 'verticalsWithPacing', 'onNavigate', 'formatCompact']);
  const Icon = () => React.createElement('svg');
  const base = { id: 'ticketing', name: 'Ticketing', hasData: true, current: 600000, target: 6720000, projectedFinish: 7170000, pacePct: -20, paceMarkerPct: 10, isVariable: true, isProrated: false, icon: Icon, bgClass: '', colorClass: '', barClass: '' };
  const card = (values) => renderToStaticMarkup(render(React, key => key, [{ ...base, ...values }], () => {}, formatCompact));
  assert.match(card({ forecast: compareRevenueForecast(7170000, 6720000) }), /text-green-600[^>]*>\+6\.7%/);
  assert.match(card({ projectedFinish: 6000000, pacePct: 20, forecast: compareRevenueForecast(6000000, 6720000) }), /text-red-600[^>]*>-10\.7%/);
  assert.match(card({ hasData: false, forecast: compareRevenueForecast(0, 6720000, false) }), /Projected Revenue.*>—</);
});