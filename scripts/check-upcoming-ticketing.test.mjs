import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SalesChannel, TicketZone } from '../src/types.ts';
import { CAPACITIES_26_27, GAMEDAY_CAPACITIES_26_27 } from '../src/constants.ts';
import { upcomingTicketingSummary } from '../src/utils/upcomingTicketing.ts';
import { UpcomingGames } from '../src/components/UpcomingGames.tsx';

const sale = (channel, revenue, quantity, zone = TicketZone.PAR_O) => ({ zone, channel, revenue, quantity });
const game = {
  id: 'future', date: '10/10/2026', opponent: 'Future Opponent', league: 'LBA', season: '26-27',
  tier: 1, totalRevenue: 1240, attendance: 46, capacity: CAPACITIES_26_27[TicketZone.PAR_O],
  zoneCapacities: { [TicketZone.PAR_O]: CAPACITIES_26_27[TicketZone.PAR_O] },
  corpRevenue: 300, oppRank: 1, pvRank: 1, pnlBreakdown: {},
  salesBreakdown: [
    sale(SalesChannel.ABB, 500, 10), sale(SalesChannel.CORP, 300, 6),
    sale(SalesChannel.PROTOCOL, 0, 8), sale(SalesChannel.GIVEAWAY, 0, 2),
    sale(SalesChannel.TIX, 100, 5), sale(SalesChannel.TIX, 40, 2),
    sale(SalesChannel.MP, 200, 10), sale(SalesChannel.VB, 100, 3),
  ],
};

test('Total view sums repeated channels into one zone row with all channels', () => {
  const result = upcomingTicketingSummary(game, 'total');
  assert.equal(result.rows.length, 1);
  assert.deepEqual(result.rows[0].channels[SalesChannel.TIX], { revenue: 140, quantity: 7 });
  assert.equal(result.revenue, 1240);
  assert.equal(result.quantity, 46);
  assert.equal(result.rows[0].revenue, result.revenue);
  assert.equal(result.rows[0].quantity, result.quantity);
  assert.deepEqual(result.channels, ['ABB', 'Corp', 'Tix', 'MP', 'VB', 'Protocol', 'GA']);
});

test('GameDay view filters both totals and columns, retaining giveaways', () => {
  const result = upcomingTicketingSummary(game, 'gameday');
  assert.deepEqual(result.channels, ['Tix', 'MP', 'VB', 'GA']);
  assert.equal(result.revenue, 440);
  assert.equal(result.quantity, 22);
  assert.equal(result.capacity, GAMEDAY_CAPACITIES_26_27[TicketZone.PAR_O]);
  assert.deepEqual(Object.keys(result.rows[0].channels).sort(), ['GA', 'MP', 'Tix', 'VB']);
  assert.equal(result.rows[0].revenue, 440);
  assert.equal(result.rows[0].quantity, 22);
});

test('zone totals remain distinct and inspecting does not mutate source fixtures', () => {
  const source = { ...game, salesBreakdown: [...game.salesBreakdown, sale(SalesChannel.TIX, 60, 3, TicketZone.TRIB_G)] };
  const before = JSON.stringify(source);
  const result = upcomingTicketingSummary(source, 'gameday');
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[1].zone, TicketZone.TRIB_G);
  assert.equal(result.rows[1].revenue, 60);
  assert.equal(result.revenue, 500);
  assert.equal(result.quantity, 25);
  assert.equal(JSON.stringify(source), before);
});

test('fixed-only allocations mean zero GameDay sales rather than including fixed tickets', () => {
  const result = upcomingTicketingSummary({ ...game, salesBreakdown: game.salesBreakdown.slice(0, 3) }, 'gameday');
  assert.equal(result.revenue, 0);
  assert.equal(result.quantity, 0);
  assert.equal(result.hasBreakdown, true);
  assert.deepEqual(result.rows, []);
});

test('missing breakdown preserves Total totals but never fabricates GameDay figures', () => {
  const source = { ...game, salesBreakdown: [] };
  assert.equal(upcomingTicketingSummary(source, 'total').revenue, 1240);
  assert.equal(upcomingTicketingSummary(source, 'total').quantity, 46);
  assert.equal(upcomingTicketingSummary(source, 'gameday').revenue, null);
  assert.equal(upcomingTicketingSummary(source, 'gameday').quantity, null);
});

const markup = (viewMode, ticketing = [game], module = 'ticketing') =>
  renderToStaticMarkup(React.createElement(UpcomingGames, { ticketing, module, viewMode }));
const totalCurrency = (1240).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

test('Ticketing markup renders one zone row with paired channel columns and final totals', () => {
  const html = markup('total');
  assert.equal((html.match(/Parterre Ovest/g) || []).length, 1);
  assert.match(html, /ABB €/);
  assert.match(html, /ABB #/);
  assert.match(html, /Corp €/);
  assert.match(html, /Corp #/);
  assert.match(html, /Total €/);
  assert.match(html, /Total #/);
  assert.ok(html.includes(totalCurrency));
  assert.match(html, /<strong>46<\/strong>/);
  assert.match(html, /overflow-x-auto/);
});

test('changing data view updates the rendered advance-sales summary and fixture details', () => {
  const html = markup('gameday');
  assert.match(html, /440/);
  assert.ok(!html.includes(totalCurrency));
  assert.match(html, /<strong>22<\/strong>/);
  assert.match(html, /Fixture totals \(GameDay tickets only\)/);
  assert.doesNotMatch(html, /ABB €|Corp €|Protocol €/);
  assert.match(html, /GA #/);
});

test('unavailable and zero GameDay sales have distinct rendered empty states', () => {
  assert.match(markup('gameday', [{ ...game, salesBreakdown: [] }]), /No channel breakdown available/);
  assert.match(markup('gameday', [{ ...game, salesBreakdown: game.salesBreakdown.slice(0, 3) }]), /No GameDay tickets allocated yet/);
});

test('commercial GameDay module does not inherit Ticketing data-view filtering', () => {
  const html = markup('gameday', [game], 'gameday');
  assert.ok(html.includes(totalCurrency));
  assert.doesNotMatch(html, /ABB €|GameDay tickets only/);
});