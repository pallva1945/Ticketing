import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { createXShopSnapshotCache, validateXShopSnapshot, XSHOP_SNAPSHOT_TTL } from '../server/xshopSnapshotCache.ts';
import { mapXShopOrder } from '../server/xshopMapping.ts';
import { fetchAllXShop } from '../server/xshopApi.ts';
import { createXShopSnapshotStore } from '../server/xshopSnapshotStore.ts';

const snapshot = (extra = {}) => ({
  source: 'XShop', complete: true, orders: [], customers: [], products: [],
  lastUpdated: new Date().toISOString(), sourceOrderCount: 0, excludedOrderCount: 0, ...extra,
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const tick = () => new Promise(resolve => setImmediate(resolve));

test('restart serves a saved snapshot immediately while one complete update runs in background', async () => {
  const old = snapshot({ lastUpdated: '2026-01-01T00:00:00Z' });
  const pending = deferred();
  let downloads = 0, reads = 0, writes = 0;
  const cache = createXShopSnapshotCache(() => { downloads++; return pending.promise; }, {
    read: async () => { reads++; return old; },
    write: async () => { writes++; },
  });
  const responses = await Promise.all(Array.from({ length: 10 }, () => cache.load()));
  assert.equal(reads, 1);
  assert.equal(downloads, 1);
  assert.equal(writes, 0);
  for (const response of responses) {
    assert.equal(response.lastUpdated, old.lastUpdated);
    assert.deepEqual(response.snapshotStatus, {
      stale: true, restored: true, refreshing: true, refreshError: null, persistenceError: null,
    });
  }
  const current = snapshot();
  pending.resolve(current);
  await tick();
  assert.equal(writes, 1);
  const fresh = await cache.load();
  assert.equal(fresh.lastUpdated, current.lastUpdated);
  assert.equal(fresh.snapshotStatus.stale, false);
  assert.equal(fresh.snapshotStatus.refreshing, false);
});

test('without a saved copy, concurrent requests wait for the same validated complete download', async () => {
  const pending = deferred();
  let downloads = 0, saved = null;
  const cache = createXShopSnapshotCache(() => { downloads++; return pending.promise; }, {
    read: async () => null, write: async data => { saved = data; },
  });
  const a = cache.load(), b = cache.load();
  await tick();
  assert.equal(downloads, 1);
  const current = snapshot();
  pending.resolve(current);
  const results = await Promise.all([a, b]);
  assert.equal(saved, current);
  assert.equal(results[0].lastUpdated, results[1].lastUpdated);
});

test('failed refresh keeps the old snapshot and backs off automatic retries; manual retry works', async () => {
  let clock = Date.now(), attempts = 0, writes = 0;
  const old = snapshot();
  const cache = createXShopSnapshotCache(async () => {
    attempts++;
    if (attempts === 1) throw new Error('private-provider-details');
    return snapshot();
  }, { read: async () => old, write: async () => { writes++; } }, () => clock);
  await cache.load();
  await tick();
  const response = await cache.load();
  assert.equal(response.lastUpdated, old.lastUpdated);
  assert.match(response.snapshotStatus.refreshError, /last complete snapshot/);
  assert.doesNotMatch(JSON.stringify(response), /private-provider-details/);
  assert.equal(attempts, 1);
  assert.equal(writes, 0);
  await cache.load(true);
  await tick();
  assert.equal(attempts, 2);
  assert.equal(writes, 1);
  assert.equal((await cache.load()).snapshotStatus.refreshError, null);
});

test('incomplete refresh is never persisted or published over a complete snapshot', async () => {
  const old = snapshot();
  let writes = 0;
  const cache = createXShopSnapshotCache(async () => snapshot({ complete: false }), {
    read: async () => old, write: async () => { writes++; },
  });
  await cache.load();
  await tick();
  const response = await cache.load();
  assert.equal(response.complete, true);
  assert.equal(response.lastUpdated, old.lastUpdated);
  assert.equal(writes, 0);
  assert.ok(response.snapshotStatus.refreshError);
});

test('broken saved copy is rejected and replaced only by a complete live snapshot', async () => {
  const current = snapshot();
  const cache = createXShopSnapshotCache(async () => current, {
    read: async () => snapshot({ sourceOrderCount: 5 }), write: async () => {},
  });
  assert.equal((await cache.load()).lastUpdated, current.lastUpdated);
  assert.equal(cache.status().restored, false);
});

test('storage failure is visible without losing current data or leaking storage errors', async () => {
  const current = snapshot();
  const cache = createXShopSnapshotCache(async () => current, {
    read: async () => { throw new Error('private-bucket-name'); },
    write: async () => { throw new Error('private-bucket-name'); },
  });
  const response = await cache.load();
  assert.equal(response.lastUpdated, current.lastUpdated);
  assert.ok(response.snapshotStatus.persistenceError);
  assert.doesNotMatch(JSON.stringify(response), /private-bucket-name/);
});

test('TTL uses original snapshot time; manual clear preserves usable old data', async () => {
  const current = snapshot();
  let clock = Date.parse(current.lastUpdated), downloads = 0;
  const cache = createXShopSnapshotCache(async () => { downloads++; return current; }, {
    read: async () => null, write: async () => {},
  }, () => clock);
  await cache.load();
  await cache.load();
  assert.equal(downloads, 1);
  clock += XSHOP_SNAPSHOT_TTL + 1;
  assert.equal((await cache.load()).snapshotStatus.refreshing, true);
  await tick();
  cache.clear();
  const response = await cache.load();
  assert.equal(response.complete, true);
  assert.equal(response.snapshotStatus.refreshing, true);
  await tick();
});

test('unpaid orders, non-EUR amounts and invalid persisted metadata cannot pass validation', () => {
  const paid = mapXShopOrder({
    id: 1, number: '1', status: 'completed', currency: 'EUR',
    date_created_gmt: '2026-01-01T00:00:00', total: '10', total_tax: '2', line_items: [],
  });
  validateXShopSnapshot(snapshot({ orders: [paid], sourceOrderCount: 1 }));
  for (const extra of [{ financialStatus: 'pending' }, { currency: 'USD' }, { totalPrice: NaN }]) {
    assert.throws(() => validateXShopSnapshot(snapshot({ orders: [{ ...paid, ...extra }], sourceOrderCount: 1 })));
  }
  assert.throws(() => validateXShopSnapshot(snapshot({ lastUpdated: 'invalid' })));
  assert.throws(() => validateXShopSnapshot(snapshot({ orders: [paid, paid], sourceOrderCount: 2 })));
});

test('page-count drift also prevents publishing a complete collection', async () => {
  await assert.rejects(fetchAllXShop('orders', async (_resource, params) => ({
    data: [{ id: Number(params.page) }], total: 2, pages: params.page === '1' ? 2 : 3,
  })), /changed during pagination/);
});

test('snapshots are private, versioned and inaccessible through generic object delivery', () => {
  const store = fs.readFileSync('server/xshopSnapshotStore.ts', 'utf8');
  const routes = fs.readFileSync('server/replit_integrations/object_storage/routes.ts', 'utf8');
  assert.match(store, /getPrivateObjectDir/);
  assert.match(store, /visibility: 'private'/);
  assert.match(store, /envelope.version !== XSHOP_SNAPSHOT_VERSION/);
  assert.match(routes, /includes\('server-snapshots'\)/);
  assert.doesNotMatch(store, /writeFile|publicRead|public-read/);
  const app = fs.readFileSync('src/App.tsx', 'utf8');
  assert.doesNotMatch(app, /await merchRevenuePromise|fetch\(`\/api\/merch\/data/);
  assert.match(app, /void loadMerchRevenue\(forceRefresh\)/);
});

test('storage writes only the versioned complete payload with private metadata and restores it', async () => {
  let content, options;
  const store = createXShopSnapshotStore(() => ({
    save: async (data, settings) => { content = data; options = settings; },
    download: async () => [Buffer.from(content)],
  }));
  const current = snapshot({ snapshotStatus: { stale: true, refreshing: true } });
  await store.write(current);
  assert.equal(JSON.parse(content).version, 1);
  assert.equal(JSON.parse(content).data.snapshotStatus, undefined);
  assert.equal(options.metadata.cacheControl, 'private, no-store');
  assert.equal(JSON.parse(options.metadata.metadata['custom:aclPolicy']).visibility, 'private');
  assert.equal((await store.read()).lastUpdated, current.lastUpdated);
  content = JSON.stringify({ version: 0, data: current });
  await assert.rejects(store.read(), /Unsupported/);
  content = '{"version":1,"data":{"complete":true}}';
  await assert.rejects(store.read(), /incomplete/);
});
