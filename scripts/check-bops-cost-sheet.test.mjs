import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { parseBopsCostSheet, normalizeBopsSheetConfig } from '../src/utils/bopsCostSheet.ts';
import { registerBopsCostRoutes } from '../server/bopsCostRoutes.ts';

const sample = () => [
  [], ['', '25/26*', '% of BOps', '26/27', '% of BOps'],
  ...['Players', 'Coaches', 'Managment', 'Staff'].flatMap(category => [
    [category], ['Salaries', '€ 1.000', '10%', '€ 2.000', '10%'],
    ['Taxes', '€ 100,50', '1%', '€ 200,50', '1%'],
    ['Agents', '€ 0', '0%', '€ 0', '0%'],
    [`${category} Related Cost`, '€ 50', '1%', '€ 75', '1%'],
    [`Total ${category}`, '€ 1.150,50', '10%', '€ 2.275,50', '10%'],
  ]),
  ['AnR'], ['Personnel', '€ 100', '1%', '€ 200', '1%'],
  ['Soft and Services', '€ 50', '1%', '€ 100', '1%'],
  ['Total AnR', '€ 150', '2%', '€ 300', '2%'],
  ['Luxury Tax'], ['Luxury Tax', '€ 0', '0%', '€ 40.000', '0%'],
  ['Total Bops', '€ 4.752', '', '€ 49.402'],
  ['Net Salary to BOps Ratio', '0,30', '', '39%'],
];
test('Financial Format imports season amounts, not intervening percentage columns', () => {
  const data = parseBopsCostSheet(sample());
  assert.deepEqual(data.map(d => d.season), ['25/26', '26/27']);
  assert.equal(data[0].players.salaries, 1000);
  assert.equal(data[0].players.taxes, 100.5);
  assert.equal(data[0].management.agents, 0);
  assert.equal(data[1].luxuryTax, 40000);
  assert.equal(data[1].totalBops, 49402);
  assert.equal(data[0].netSalaryRatio, .3);
  assert.equal(data[1].netSalaryRatio, .39);
});
test('partial or invalid numbers fail explicitly; blank future seasons are omitted', () => {
  const missing = sample(); missing[3][3] = '';
  assert.throws(() => parseBopsCostSheet(missing), /Missing .*26\/27/);
  const invalid = sample(); invalid[3][3] = 'not a number';
  assert.throws(() => parseBopsCostSheet(invalid), /Invalid number/);
  const blank = sample(); blank[1][5] = '27/28';
  assert.equal(parseBopsCostSheet(blank).length, 2);
  const duplicate = sample(); duplicate[1][3] = '25/26';
  assert.throws(() => parseBopsCostSheet(duplicate), /Duplicate season/);
  assert.throws(() => parseBopsCostSheet([]), /No season columns/);
});
test('sheet URLs normalize safely; tab names and IDs are required', () => {
  assert.deepEqual(normalizeBopsSheetConfig('https://docs.google.com/spreadsheets/d/abcdefghijklmnopqrstuvwxyz/edit?gid=123', ' Financial Format '),
    { sheetId: 'abcdefghijklmnopqrstuvwxyz', sheetName: 'Financial Format' });
  assert.throws(() => normalizeBopsSheetConfig('https://evil.example/spreadsheets/d/abcdefghijklmnopqrstuvwxyz', 'Tab'), /Google Sheets/);
  assert.throws(() => normalizeBopsSheetConfig('abcdefghijklmnopqrstuvwxyz', ''), /tab name/);
});
test('owner-only config and refresh persist data, reject other users, and preserve prior snapshots after failed imports', async () => {
  const store = new Map();
  let rows = sample(), providerFailure = false;
  const app = express();
  app.use(express.json());
  registerBopsCostRoutes(app, {
    authenticateAdmin(req, res) {
      if (req.headers['x-test-user'] === 'owner') return { email: 'owner@example.invalid' };
      res.status(403).json({ success: false }); return null;
    },
    authenticateUser(req) { return req.headers['x-test-user'] ? { email: 'reader@example.invalid' } : null; },
    getUserByEmail: async () => ({ id: 1, status: 'active', access_level: 'partial', expires_at: null }),
    getUserPermissions: async () => ['cost'],
    getSetting: async key => store.get(key) || null,
    setSetting: async (key, value) => { store.set(key, value); },
    readRows: async () => { if (providerFailure) throw new Error('provider unavailable'); return rows; },
  });
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const url = `http://127.0.0.1:${server.address().port}/api/costs/bops`;
  const request = (path, method = 'GET', user = 'owner', body) => fetch(`${url}/${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(user ? { 'x-test-user': user } : {}) },
    ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
  });
  try {
    for (const [path, method] of [['sheet-config', 'GET'], ['sheet-config', 'POST'], ['sync-sheet', 'POST']]) {
      assert.equal((await request(path, method, 'reader', {})).status, 403);
    }
    assert.equal((await request('data', 'GET', '')).status, 401);
    assert.equal((await request('sync-sheet', 'POST')).status, 400);
    const config = { sheetId: 'abcdefghijklmnopqrstuvwxyz', sheetName: 'Financial Format' };
    assert.equal((await request('sheet-config', 'POST', 'owner', config)).status, 200);
    assert.equal((await (await request('sheet-config')).json()).sheetName, config.sheetName);
    const synced = await (await request('sync-sheet', 'POST')).json();
    assert.equal(synced.success, true); assert.equal(synced.data[1].totalBops, 49402);
    const read = await (await request('data', 'GET', 'reader')).json();
    assert.deepEqual(read.data, synced.data);
    rows = [['bad sheet']];
    assert.equal((await request('sync-sheet', 'POST')).status, 422);
    assert.deepEqual((await (await request('data')).json()).data, synced.data);
    providerFailure = true;
    assert.equal((await request('sync-sheet', 'POST')).status, 500);
    assert.deepEqual((await (await request('data')).json()).data, synced.data);
  } finally { await new Promise(resolve => server.close(resolve)); }
});