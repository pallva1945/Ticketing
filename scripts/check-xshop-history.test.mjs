import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createXShopSnapshotCache } from '../server/xshopSnapshotCache.ts';
import { createXShopSnapshotStore } from '../server/xshopSnapshotStore.ts';
import { sanitizeXShopHistory, mergeXShopHistory, XSHOP_HISTORY_LIMIT } from '../server/xshopRefreshHistory.ts';
import { XShopReadError } from '../server/xshopRead.ts';
import { hasMerchandisingAccess, registerXShopRoutes } from '../server/xshopRoutes.ts';

const old = {
  source: 'XShop', complete: true, orders: [], products: [], customers: [],
  lastUpdated: '2026-01-01T00:00:00Z', sourceOrderCount: 0, excludedOrderCount: 0,
};
const row = (extra = {}) => ({
  id: randomUUID(),
  startedAt: '2026-01-01T01:00:00Z', finishedAt: '2026-01-01T01:01:00Z',
  outcome: 'failure', failureCode: 'blocked', lastSuccessfulSnapshotAt: old.lastUpdated,
  recognizedOrderCount: 0, ...extra,
});
function memoryStore() {
  let snapshot = old, attempts = [];
  return {
    read: async () => snapshot,
    write: async data => { snapshot = data; },
    readHistory: async () => structuredClone(attempts),
    writeHistory: async data => { attempts = structuredClone(data); },
  };
}

test('refresh start and safe failure survive restart; history reads never download', async () => {
  const store = memoryStore();
  let reject;
  const cache = createXShopSnapshotCache(() => new Promise((_, no) => { reject = no; }), store);
  assert.equal((await cache.history()).attempts.length, 0);
  const refresh = cache.load(true, true);
  await new Promise(resolve => setImmediate(resolve));
  const started = await store.readHistory();
  assert.equal(started[0].outcome, 'unfinished');
  assert.equal(started[0].finishedAt, null);
  reject(new XShopReadError('blocked'));
  await refresh;
  let downloads = 0;
  const restarted = createXShopSnapshotCache(async () => { downloads++; return old; }, store);
  const history = await restarted.history();
  assert.equal(downloads, 0);
  assert.equal(history.attempts[0].outcome, 'failure');
  assert.equal(history.attempts[0].failureCode, 'blocked');
  assert.ok(history.attempts[0].finishedAt);
  assert.equal(history.attempts[0].lastSuccessfulSnapshotAt, new Date(old.lastUpdated).toISOString());
  assert.equal(history.attempts[0].recognizedOrderCount, 0);
  const retained = await restarted.load();
  assert.equal(downloads, 0);
  assert.equal(retained.snapshotStatus.refreshErrorCode, 'blocked');
});

test('unfinished attempts remain unfinished after restart, without fabricated failure causes', async () => {
  const store = memoryStore();
  await store.writeHistory([row({ outcome: 'unfinished', finishedAt: null, failureCode: null })]);
  const cache = createXShopSnapshotCache(async () => { throw new Error('Must not download'); }, store);
  const history = await cache.history();
  assert.equal(history.attempts[0].outcome, 'unfinished');
  assert.equal(history.attempts[0].failureCode, null);
  assert.equal(history.refreshing, false);
});

test('history reads see attempts from other instances without starting downloads', async () => {
  const store = memoryStore();
  const cache = createXShopSnapshotCache(async () => { throw new Error('Must not download'); }, store);
  await cache.history();
  await store.writeHistory([row()]);
  assert.equal((await cache.history()).attempts.length, 1);
});

test('successful refresh records time and recognized count; retention is bounded across restarts', async () => {
  const store = memoryStore();
  await store.writeHistory(Array.from({ length: 75 }, () => row()));
  const current = { ...old, lastUpdated: new Date().toISOString() };
  const cache = createXShopSnapshotCache(async () => current, store);
  await cache.load(true, true);
  const history = await cache.history();
  assert.equal(history.attempts.length, XSHOP_HISTORY_LIMIT);
  assert.equal((await store.readHistory()).length, XSHOP_HISTORY_LIMIT);
  assert.equal(history.attempts[0].outcome, 'success');
  assert.equal(history.attempts[0].failureCode, null);
  assert.equal(history.attempts[0].lastSuccessfulSnapshotAt, current.lastUpdated);
});

test('unknown failures and persistence failures retain only safe codes, not raw errors', async () => {
  for (const code of ['unknown', 'persistence', 'timeout', 'credentials', 'access', 'connection']) {
    const store = memoryStore();
    if (code === 'persistence') store.write = async () => { throw new Error('sensitive-storage-body'); };
    const cache = createXShopSnapshotCache(async () => {
      if (code === 'persistence') return { ...old, lastUpdated: new Date().toISOString() };
      if (code === 'unknown') throw new Error('sensitive-provider-body https://provider?key=private');
      throw new XShopReadError(code);
    }, store);
    await cache.load(true, true);
    const history = await cache.history();
    assert.equal(history.attempts[0].failureCode, code);
    assert.doesNotMatch(JSON.stringify(history), /sensitive|https:|key=private/);
  }
});

test('history storage failure is visible but never hides download results or overwrites unreadable history', async () => {
  const store = memoryStore();
  await store.writeHistory([row()]);
  let failRead = true, writes = 0;
  const read = store.readHistory;
  const write = store.writeHistory;
  store.readHistory = async () => {
    if (failRead) throw new Error('private-history-location');
    return read();
  };
  store.writeHistory = async data => { writes++; await write(data); };
  const cache = createXShopSnapshotCache(async () => ({ ...old, lastUpdated: new Date().toISOString() }), store);
  const data = await cache.load(true, true);
  assert.equal(data.complete, true);
  assert.equal(data.snapshotStatus.historyPersistenceError, true);
  assert.equal(writes, 0);
  assert.doesNotMatch(JSON.stringify(await cache.history()), /private-history-location/);
  failRead = false;
  await cache.load(true, true);
  assert.equal((await cache.history()).persistenceUnavailable, false);
  assert.equal((await read()).length, 3);

  store.writeHistory = async () => { throw new Error('sensitive-write-error'); };
  await cache.load(true, true);
  assert.equal((await cache.history()).persistenceUnavailable, true);
});

test('private store roundtrips a bounded, whitelisted history, rejects malformed records and invalid versions', async () => {
  let content, options;
  const store = createXShopSnapshotStore(() => { throw new Error('Snapshot must not be accessed'); }, () => ({
    getMetadata: async () => {
      if (!content) throw Object.assign(new Error('Not found'), { code: 404 });
      return [{ generation: '1' }];
    },
    save: async (data, settings) => { content = data; options = settings; },
    download: async () => [Buffer.from(content)],
  }));
  await store.writeHistory(Array.from({ length: 80 }, () => row({
    body: 'RAW_PROVIDER', requestUrl: 'PRIVATE_URL', customerEmail: 'PII', amount: 999,
    failureCode: 'RAW_ERROR',
  })));
  assert.equal((await store.readHistory()).length, 50);
  assert.equal((await store.readHistory())[0].failureCode, 'unknown');
  assert.doesNotMatch(content, /RAW_|PRIVATE_URL|PII|amount|customer|requestUrl|body/);
  assert.equal(options.metadata.cacheControl, 'private, no-store');
  assert.equal(JSON.parse(options.metadata.metadata['custom:aclPolicy']).visibility, 'private');
  content = JSON.stringify({ version: 999, attempts: [] });
  await assert.rejects(store.readHistory(), /Unsupported/);
  for (const extra of [{ startedAt: 'invalid' }, { recognizedOrderCount: -1 }, { outcome: 'failure', finishedAt: null }]) {
    assert.throws(() => sanitizeXShopHistory([row(extra)]), /Invalid/);
  }
});

test('concurrent history writers merge independent attempts and cannot replace finished results with stale starts', async () => {
  let content, generation = 0, conflicts = 0;
  const file = {
    getMetadata: async () => {
      if (!content) throw Object.assign(new Error('Missing'), { code: 404 });
      return [{ generation: String(generation) }];
    },
    download: async () => [Buffer.from(content)],
    save: async (data, options) => {
      await new Promise(resolve => setImmediate(resolve));
      if (options.preconditionOpts.ifGenerationMatch !== generation) {
        conflicts++;
        throw Object.assign(new Error('Conflict'), { code: 412 });
      }
      content = data;
      generation++;
    },
  };
  const storeA = createXShopSnapshotStore(undefined, () => file);
  const storeB = createXShopSnapshotStore(undefined, () => file);
  const a = row(), b = row({ failureCode: 'timeout' });
  await Promise.all([storeA.writeHistory([a]), storeB.writeHistory([b])]);
  assert.equal((await storeA.readHistory()).length, 2);
  assert.ok(conflicts > 0);
  await storeB.writeHistory([{ ...a, outcome: 'unfinished', finishedAt: null, failureCode: null }]);
  assert.equal((await storeA.readHistory()).find(record => record.id === a.id).failureCode, 'blocked');
  assert.equal(mergeXShopHistory([a], [{ ...a, outcome: 'unfinished', finishedAt: null }])[0].outcome, 'failure');
});

test('history permissions match merchandising; unauthenticated requests cannot restore or refresh', async () => {
  for (const user of [{ role: 'admin' }, { accessLevel: 'full' }, { accessLevel: 'partial', permissions: ['merchandising'] }]) {
    assert.equal(hasMerchandisingAccess(user), true);
  }
  for (const user of [{}, { accessLevel: 'partial' }, { permissions: ['home', 'ticketing'] }]) {
    assert.equal(hasMerchandisingAccess(user), false);
  }
  const handlers = new Map();
  registerXShopRoutes({ get: (path, handler) => handlers.set(path, handler) });
  let status, body, cacheControl;
  const res = {
    setHeader: (_, value) => { cacheControl = value; },
    status: value => { status = value; return res; },
    json: value => { body = value; },
  };
  await handlers.get('/api/merch/refresh-history')({ cookies: {}, query: {} }, res);
  assert.equal(status, 401);
  assert.equal(cacheControl, 'private, no-store');
  assert.equal(body.attempts, undefined);
  const routes = fs.readFileSync('server/xshopRoutes.ts', 'utf8').split("app.get('/api/merch/data'")[0];
  assert.match(routes, /!hasMerchandisingAccess\(user\)/);
  assert.match(routes, /status\(403\)/);
  assert.doesNotMatch(routes, /loadXShopData\(/);
  assert.match(fs.readFileSync('server/replit_integrations/object_storage/routes.ts', 'utf8'), /includes\('server-snapshots'\)/);
});
