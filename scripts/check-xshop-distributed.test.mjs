import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { createXShopSnapshotCache, XSHOP_SNAPSHOT_VERSION } from '../server/xshopSnapshotCache.ts';
import { snapshotObject } from './helpers/xshopSnapshotFake.mjs';
import { XShopReadError } from '../server/xshopRead.ts';

const snapshot = (lastUpdated = new Date().toISOString()) => ({
  source: 'XShop', complete: true, orders: [], customers: [], products: [],
  lastUpdated, sourceOrderCount: 0, excludedOrderCount: 0,
});
const old = () => snapshot('2026-01-01T00:00:00Z');
const objectWithOld = () => snapshotObject({ version: XSHOP_SNAPSHOT_VERSION, data: old() });
const deferred = () => {
  let resolve;
  const promise = new Promise(yes => { resolve = yes; });
  return { promise, resolve };
};
const tick = () => new Promise(resolve => setImmediate(resolve));
const until = async condition => {
  for (let i = 0; i < 100 && !condition(); i++) await new Promise(resolve => setTimeout(resolve, 2));
  assert.ok(condition(), 'Condition did not settle');
};
const timing = { leaseTtlMs: 2000, heartbeatMs: 500, followPollMs: 2 };

test('two independent servers share one refresh and both adopt its committed result', async () => {
  const object = objectWithOld(), pending = deferred();
  let downloads = 0;
  const fetch = () => { downloads++; return pending.promise; };
  const a = createXShopSnapshotCache(fetch, object.store(), Date.now, 5, timing);
  const b = createXShopSnapshotCache(fetch, object.store(), Date.now, 5, timing);
  const retained = await Promise.all([a.load(true, true), b.load(true, true)]);
  assert.equal(downloads, 1);
  retained.forEach(data => {
    assert.equal(data.lastUpdated, old().lastUpdated);
    assert.equal(data.snapshotStatus.refreshing, true);
  });
  // A normal read is immediate even while its peer holds the distributed lease.
  assert.equal((await b.load()).lastUpdated, old().lastUpdated);
  const current = snapshot();
  pending.resolve(current);
  await until(() => !a.status().refreshing && !b.status().refreshing);
  assert.equal((await a.load()).lastUpdated, current.lastUpdated);
  assert.equal((await b.load(false, true)).lastUpdated, current.lastUpdated);
  assert.equal(downloads, 1);
  assert.equal(object.content().lease, null);
  const history = await a.history();
  assert.equal(history.attempts.length, 1);
  assert.equal(history.attempts[0].outcome, 'success');
  assert.equal((await b.history()).attempts[0].id, history.attempts[0].id);
});

test('two cold servers without saved data wait for the same complete snapshot', async () => {
  const object = snapshotObject(), pending = deferred();
  let downloads = 0;
  const fetch = () => { downloads++; return pending.promise; };
  const a = createXShopSnapshotCache(fetch, object.store(), Date.now, 5, timing);
  const b = createXShopSnapshotCache(fetch, object.store(), Date.now, 5, timing);
  const results = Promise.all([a.load(), b.load()]);
  await until(() => downloads === 1);
  pending.resolve(snapshot());
  const [first, second] = await results;
  assert.equal(first.lastUpdated, second.lastUpdated);
  assert.equal(downloads, 1);
});

test('two real stores repair an invalid saved payload with one fenced complete replacement', async () => {
  const object = snapshotObject({
    version: XSHOP_SNAPSHOT_VERSION, data: { ...old(), sourceOrderCount: 5 },
    revision: 'damaged-copy', lease: null,
  });
  const pending = deferred();
  let downloads = 0;
  const fetch = () => { downloads++; return pending.promise; };
  const a = createXShopSnapshotCache(fetch, object.store(), Date.now, 5, timing);
  const b = createXShopSnapshotCache(fetch, object.store(), Date.now, 5, timing);
  const results = Promise.all([a.load(true, true), b.load(true, true)]);
  await until(() => downloads === 1);
  const lease = object.content().lease;
  assert.ok(lease);
  assert.equal((await object.store().readState()).data, null);
  assert.notEqual((await object.store().acquire('competing-worker', 2000, null, true)).lease.owner, 'competing-worker');
  assert.equal(await object.store().commit('competing-worker', snapshot()), false);
  const current = snapshot();
  pending.resolve(current);
  for (const result of await results) assert.equal(result.lastUpdated, current.lastUpdated);
  assert.equal(downloads, 1);
  assert.equal(object.content().data.complete, true);
  assert.equal(object.content().data.sourceOrderCount, 0);
  assert.equal(object.content().lease, null);
});

test('invalid payload does not clear an active lease or permit a competing repair worker', async () => {
  const object = snapshotObject({
    version: XSHOP_SNAPSHOT_VERSION, data: { complete: true }, revision: 'previous',
    lease: { owner: 'repair-worker', expiresAt: Date.now() + 10000 },
  });
  const state = await object.store().acquire('peer', 1000, 'previous', true);
  assert.equal(state.data, null);
  assert.equal(state.lease.owner, 'repair-worker');
  assert.equal(await object.store().commit('peer', snapshot()), false);
  assert.equal(await object.store().commit('repair-worker', snapshot()), true);
});

test('a warm server polls a peer refresh even when its own snapshot is still fresh', async () => {
  const original = snapshot(new Date(Date.now() - 10000).toISOString());
  const object = snapshotObject({ version: XSHOP_SNAPSHOT_VERSION, data: original });
  const pending = deferred();
  let downloads = 0;
  const fetch = () => { downloads++; return pending.promise; };
  const a = createXShopSnapshotCache(fetch, object.store(), Date.now, 5, timing);
  const b = createXShopSnapshotCache(fetch, object.store(), Date.now, 5, timing);
  await Promise.all([a.load(false, true), b.load(false, true)]);
  assert.equal(downloads, 0);
  await a.load(true, true);
  const waiting = await b.load(false, true);
  assert.equal(waiting.snapshotStatus.refreshing, true);
  assert.equal(waiting.lastUpdated, original.lastUpdated);
  pending.resolve(snapshot());
  await until(() => !a.status().refreshing && !b.status().refreshing);
  assert.equal((await b.load()).lastUpdated, object.content().data.lastUpdated);
  assert.equal(downloads, 1);
});

test('generation removed during a pinned read is retried without treating saved data as missing', async () => {
  const object = objectWithOld();
  const current = snapshot();
  object.beforeDownload(() => object.replace({ version: XSHOP_SNAPSHOT_VERSION, data: current }));
  const state = await object.store().readState();
  assert.equal(state.data.lastUpdated, current.lastUpdated);
});

test('abandoned lease expires; late old worker cannot commit, renew, or release its successor', async () => {
  let clock = Date.now();
  const object = objectWithOld(), a = object.store(() => clock), b = object.store(() => clock);
  await a.acquire('abandoned', 100, null, true);
  clock += 101;
  await b.acquire('replacement', 100, null, true);
  assert.equal(await a.renew('abandoned', 100), false);
  assert.equal(await a.commit('abandoned', snapshot()), false);
  await a.release('abandoned', clock + 99999);
  assert.equal((await b.readState()).lease.owner, 'replacement');
  const current = snapshot();
  assert.equal(await b.commit('replacement', current), true);
  assert.equal(await a.commit('abandoned', old()), false);
  assert.equal((await a.readState()).data.lastUpdated, current.lastUpdated);
});

test('a follower takes over an expired worker lease and publishes safely', async () => {
  let clock = Date.now(), downloads = 0;
  const object = objectWithOld(), abandoned = object.store(() => clock);
  await abandoned.acquire('crashed-process', 100, null, true);
  const current = snapshot();
  const follower = createXShopSnapshotCache(async () => { downloads++; return current; },
    object.store(() => clock), () => clock, 5, timing);
  const response = await follower.load(true, true);
  assert.equal(response.snapshotStatus.refreshing, true);
  assert.equal(downloads, 0);
  clock += 101;
  await until(() => !follower.status().refreshing);
  assert.equal(downloads, 1);
  assert.equal(object.content().data.lastUpdated, current.lastUpdated);
});

test('cache worker that resumes after takeover adopts newer data without overwriting it', async () => {
  let clock = Date.now(), downloads = 0;
  const object = objectWithOld(), pending = deferred();
  const slow = createXShopSnapshotCache(() => { downloads++; return pending.promise; },
    object.store(() => clock), () => clock, 5, { ...timing, heartbeatMs: 10000, leaseTtlMs: 100 });
  await slow.load(true, true);
  clock += 101;
  const current = snapshot();
  const successor = createXShopSnapshotCache(async () => current, object.store(() => clock), () => clock, 50, timing);
  await successor.load(true, true);
  pending.resolve(old());
  await until(() => !slow.status().refreshing);
  assert.equal(object.content().data.lastUpdated, current.lastUpdated);
  assert.equal((await slow.load()).lastUpdated, current.lastUpdated);
  assert.equal(downloads, 1);
});

test('heartbeat keeps an active download leased beyond its original expiry', async () => {
  let clock = Date.now();
  const object = objectWithOld(), pending = deferred();
  const a = createXShopSnapshotCache(() => pending.promise, object.store(() => clock), () => clock, 5,
    { ...timing, heartbeatMs: 5, leaseTtlMs: 100 });
  await a.load(true, true);
  clock += 50;
  await until(() => object.content().lease.expiresAt === clock + 100);
  clock += 51;
  const state = await object.store(() => clock).acquire('peer', 100, null, true);
  assert.notEqual(state.lease.owner, 'peer');
  pending.resolve(snapshot());
  await until(() => !a.status().refreshing);
  assert.equal(object.content().lease, null);
});

test('even a valid lease cannot replace a newer snapshot with older data', async () => {
  const current = snapshot();
  const object = snapshotObject({ version: XSHOP_SNAPSHOT_VERSION, data: current });
  const store = object.store();
  await store.acquire('worker', 1000, null, true);
  assert.equal(await store.commit('worker', old()), false);
  assert.equal(object.content().data.lastUpdated, current.lastUpdated);
});

test('peer cooldown suppresses automatic bot-challenge retry but permits explicit retry', async () => {
  const object = objectWithOld();
  let downloads = 0;
  const fetch = async () => { downloads++; throw new XShopReadError('blocked'); };
  const a = createXShopSnapshotCache(fetch, object.store(), Date.now, 50, timing);
  await a.load(true, true);
  const b = createXShopSnapshotCache(fetch, object.store(), Date.now, 50, timing);
  await b.load();
  await tick();
  assert.equal(downloads, 1);
  assert.equal(object.content().data.lastUpdated, old().lastUpdated);
  await b.load(true, true);
  assert.equal(downloads, 2);
});

test('storage outage fails closed: no uncoordinated download, no leaked details, old data retained', async () => {
  const object = objectWithOld();
  let downloads = 0;
  const cache = createXShopSnapshotCache(async () => { downloads++; return snapshot(); }, object.store());
  // Hydrate using a currently fresh copy, without starting a provider download.
  object.replace({ version: XSHOP_SNAPSHOT_VERSION, data: snapshot() });
  const initial = await cache.load(false, true);
  object.fail(new Error('private-bucket-details'));
  const response = await cache.load(true, true);
  assert.equal(response.lastUpdated, initial.lastUpdated);
  assert.equal(downloads, 0);
  assert.ok(response.snapshotStatus.persistenceError);
  assert.doesNotMatch(JSON.stringify(response), /private-bucket-details/);
  const cold = createXShopSnapshotCache(async () => { downloads++; return snapshot(); }, object.store());
  await assert.rejects(cold.load(), /Please retry/);
  assert.equal(downloads, 0);
});

test('coordination does not remove merchandising authentication, permissions, or private delivery checks', () => {
  const routes = fs.readFileSync('server/xshopRoutes.ts', 'utf8');
  assert.match(routes, /if \(!user\)/);
  assert.match(routes, /res\.status\(401\)/);
  assert.match(routes, /user\.role === 'admin'.*user\.accessLevel === 'full'.*user\.permissions\?\.includes\('merchandising'\)/);
  assert.match(routes, /if \(!hasMerchandisingAccess\(user\)\)/);
  assert.match(routes, /res\.status\(403\)/);
  assert.match(routes, /Cache-Control', 'private, no-store'/);
  const objectRoutes = fs.readFileSync('server/replit_integrations/object_storage/routes.ts', 'utf8');
  assert.match(objectRoutes, /includes\('server-snapshots'\)/);
});
