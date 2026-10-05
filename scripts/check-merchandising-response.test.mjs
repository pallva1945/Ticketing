import assert from 'node:assert/strict';
import test from 'node:test';
import { readMerchandisingResponse } from '../src/utils/merchandisingResponse.ts';
import { createXShopSnapshotCache } from '../server/xshopSnapshotCache.ts';

const snapshot = {
  source: 'XShop', complete: true, orders: [], products: [], customers: [],
  sourceOrderCount: 0, excludedOrderCount: 0, lastUpdated: '2026-01-01T00:00:00Z',
};
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

test('valid complete XShop data is accepted', async () => {
  assert.deepEqual(await readMerchandisingResponse(json(snapshot)), snapshot);
});

test('HTML success and proxy errors produce a useful message, never a JSON parser error', async () => {
  for (const status of [200, 502, 503]) {
    await assert.rejects(readMerchandisingResponse(new Response('<html><head>private-provider-details</head></html>', {
      status, headers: { 'Content-Type': 'text/html' },
    })), error => /publish the current dashboard version/.test(error.message)
      && !/Unexpected token|private-provider-details|<html>/.test(error.message));
  }
});

test('invalid JSON and incomplete collections are rejected explicitly', async () => {
  await assert.rejects(readMerchandisingResponse(new Response('{bad', {
    headers: { 'Content-Type': 'application/json' },
  })), /invalid merchandising data/);
  await assert.rejects(readMerchandisingResponse(json({ ...snapshot, complete: false })), /incomplete/);
});

test('authentication and provider failures have distinct useful errors', async () => {
  await assert.rejects(readMerchandisingResponse(json({}, 401)), /sign in again/);
  await assert.rejects(readMerchandisingResponse(json({}, 403)), /does not have access/);
  await assert.rejects(readMerchandisingResponse(json({ message: 'XShop could not load a complete snapshot. Please retry.' }, 502)), /XShop could not load/);
});

test('a provider HTML failure cannot remove the complete saved snapshot after restart', async () => {
  let writes = 0;
  const cache = createXShopSnapshotCache(async () => {
    throw new Error('XShop returned a non-JSON response');
  }, { read: async () => snapshot, write: async () => { writes++; } });
  const initial = await readMerchandisingResponse(json(await cache.load()));
  assert.equal(initial.complete, true);
  await new Promise(resolve => setImmediate(resolve));
  const retained = await readMerchandisingResponse(json(await cache.load()));
  assert.equal(retained.lastUpdated, snapshot.lastUpdated);
  assert.match(retained.snapshotStatus.refreshError, /last complete snapshot/);
  assert.equal(writes, 0);
});
