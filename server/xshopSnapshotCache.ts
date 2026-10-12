import type { MerchandisingData, MerchSnapshotStatus, MerchRefreshErrorCode, MerchRefreshAttempt, MerchRefreshHistory } from '../src/types/merchandising';
import { XShopReadError } from './xshopRead';
import { randomUUID } from 'node:crypto';
import { sanitizeXShopHistory, mergeXShopHistory, safeXShopHistoryCode, XSHOP_HISTORY_LIMIT } from './xshopRefreshHistory';

export const XSHOP_SNAPSHOT_VERSION = 2;
export const XSHOP_SNAPSHOT_TTL = 30 * 60 * 1000;

// A restored file must represent the same complete, recognized-order collection
// as the live loader. Version changes invalidate snapshots after mapping changes.
export function validateXShopSnapshot(value: unknown): asserts value is MerchandisingData {
  const data = value as MerchandisingData;
  if (!data || data.source !== 'XShop' || data.complete !== true
    || !Array.isArray(data.orders) || !Array.isArray(data.products) || !Array.isArray(data.customers)
    || !Number.isFinite(Date.parse(data.lastUpdated)) || Date.parse(data.lastUpdated) > Date.now() + 60000
    || !Number.isInteger(data.sourceOrderCount) || !Number.isInteger(data.excludedOrderCount)
    || data.excludedOrderCount < 0 || data.sourceOrderCount !== data.orders.length + data.excludedOrderCount
    || new Set(data.orders.map(order => order.id)).size !== data.orders.length
    || data.orders.some(order => !order.id || order.currency !== 'EUR'
      || !['paid', 'partially_refunded', 'refunded'].includes(order.financialStatus)
      || !Number.isFinite(Date.parse(order.processedAt))
      || !Number.isFinite(order.totalPrice) || !Number.isFinite(order.totalTax)
      || !Array.isArray(order.lineItems))) {
    throw new Error('Invalid or incomplete XShop snapshot');
  }
}

export interface XShopRefreshState {
  data: MerchandisingData | null;
  revision: string | null;
  lease: { owner: string; expiresAt: number } | null;
  retryAfter: number;
}

export interface XShopSnapshotStore {
  readHistory?(): Promise<MerchRefreshAttempt[]>;
  writeHistory?(attempts: MerchRefreshAttempt[]): Promise<void>;
  readState(): Promise<XShopRefreshState>;
  acquire(owner: string, ttl: number, revision: string | null, force: boolean): Promise<XShopRefreshState>;
  renew(owner: string, ttl: number): Promise<boolean>;
  commit(owner: string, data: MerchandisingData): Promise<boolean>;
  release(owner: string, retryAfter?: number): Promise<void>;
}

export const XSHOP_LEASE_TTL = 120000;

export function createXShopSnapshotCache(
  fetchSnapshot: () => Promise<MerchandisingData>,
  store: XShopSnapshotStore,
  now = Date.now,
  pollWaitMs = 20000,
  coordination = { leaseTtlMs: XSHOP_LEASE_TTL, heartbeatMs: 30000, followPollMs: 1000 },
) {
  let cache: MerchandisingData | null = null;
  let restored = false;
  let hydration: Promise<void> | null = null;
  let inFlight: Promise<MerchandisingData> | null = null;
  let retryAfter = 0;
  let refreshError: string | null = null;
  let refreshErrorCode: MerchRefreshErrorCode | null = null;
  let persistenceError: string | null = null;
  let revision: string | null = null;
  let lastCoordinationCheck = -Infinity;
  let attempts: MerchRefreshAttempt[] = [];
  let historyPersistenceError = false;
  let historyReadFailed = false;

  const status = (): MerchSnapshotStatus => ({
    stale: !!cache && (restored || now() - Date.parse(cache.lastUpdated) >= XSHOP_SNAPSHOT_TTL),
    restored, refreshing: !!inFlight, refreshError, refreshErrorCode, persistenceError, historyPersistenceError,
  });
  const response = () => ({ ...cache!, snapshotStatus: status() });

  function hydrate() {
    if (!hydration) hydration = Promise.all([store.readState().then(state => {
      const snapshot = state.data;
      revision = state.revision;
      retryAfter = Math.max(retryAfter, state.retryAfter);
      if (snapshot) {
        validateXShopSnapshot(snapshot);
        cache = snapshot;
        restored = true;
      }
    }).catch(() => {
      persistenceError = 'The saved XShop snapshot could not be read. Please retry.';
      console.warn('XShop private snapshot could not be restored');
    }), (async () => {
      if (!store.readHistory) return;
      try {
        attempts = sanitizeXShopHistory(await store.readHistory());
        const latest = attempts[attempts.length - 1];
        if (latest?.outcome === 'failure') {
          if (latest.failureCode === 'persistence') {
            persistenceError = 'The last XShop snapshot could not be saved.';
          } else {
            refreshError = 'The last XShop refresh failed. The last complete snapshot has been retained if available.';
            refreshErrorCode = latest.failureCode === 'unknown' ? null : latest.failureCode as MerchRefreshErrorCode;
            const permanent = ['blocked', 'access', 'credentials'].includes(latest.failureCode!);
            retryAfter = Math.max(retryAfter, Date.parse(latest.finishedAt!) + (permanent ? XSHOP_SNAPSHOT_TTL : 60000));
          }
        }
      } catch {
        historyPersistenceError = true;
        historyReadFailed = true;
        console.warn('XShop private refresh history could not be restored');
      }
    })()]).then(() => {});
    return hydration;
  }

  async function persistHistory() {
    if (!store.writeHistory) return;
    try {
      if (historyReadFailed) {
        // Do not replace unreadable durable history with only local records.
        attempts = mergeXShopHistory(await store.readHistory!(), attempts);
        historyReadFailed = false;
      }
      await store.writeHistory(sanitizeXShopHistory(attempts));
      historyPersistenceError = false;
    } catch {
      historyPersistenceError = true;
      console.warn('XShop private refresh history could not be saved');
    }
  }

  function refresh(force = false) {
    if (inFlight) return inFlight;
    refreshError = null;
    refreshErrorCode = null;
    lastCoordinationCheck = now();
    const owner = randomUUID();
    let attempt: MerchRefreshAttempt | null = null;
    let persistenceFailed = false;
    inFlight = (async () => {
      // Followers keep active bounded poll requests, never download independently.
      const baseline = revision;
      while (true) {
        const state = await store.acquire(owner, coordination.leaseTtlMs, baseline, force);
        if (state.data && (state.revision !== revision || !state.lease)) {
          validateXShopSnapshot(state.data);
          cache = state.data;
          restored = false;
          revision = state.revision;
          persistenceError = null;
        }
        if (state.lease?.owner === owner) break;
        retryAfter = state.retryAfter;
        if (!state.lease || state.lease.expiresAt <= now()) {
          if (cache) return cache;
          throw new Error('No complete XShop snapshot available');
        }
        await new Promise(resolve => setTimeout(resolve, coordination.followPollMs));
      }

      // Only the distributed lease owner records an actual provider attempt.
      // Followers and fresh-cache no-ops must not create fabricated history.
      attempt = {
        id: owner, startedAt: new Date(now()).toISOString(), finishedAt: null,
        outcome: 'unfinished', failureCode: null,
        lastSuccessfulSnapshotAt: cache?.lastUpdated ?? null,
        recognizedOrderCount: cache?.orders.length ?? null,
      };
      attempts = [...attempts, attempt].slice(-XSHOP_HISTORY_LIMIT);
      let lostLease = false;
      let heartbeat: Promise<void> | null = null;
      const timer = setInterval(() => {
        if (heartbeat) return;
        heartbeat = store.renew(owner, coordination.leaseTtlMs).then(owned => {
          if (!owned) lostLease = true;
        }).catch(() => { lostLease = true; }).finally(() => { heartbeat = null; });
      }, coordination.heartbeatMs);
      timer.unref?.();
      try {
        await persistHistory();
        const snapshot = await fetchSnapshot();
        validateXShopSnapshot(snapshot);
        clearInterval(timer);
        if (heartbeat) await heartbeat;
        // Fencing is checked atomically by storage, not only by the heartbeat.
        let committed = false;
        try {
          committed = !lostLease && await store.commit(owner, snapshot);
        } catch {
          persistenceFailed = true;
          persistenceError = 'The XShop snapshot could not be saved. The last complete snapshot has been retained.';
          throw new Error('XShop snapshot persistence failed');
        }
        if (!committed) {
          persistenceFailed = true;
          const latest = await store.readState();
          if (latest.data) {
            cache = latest.data;
            revision = latest.revision;
          }
          throw new Error('XShop refresh lease expired or was superseded');
        }
        cache = snapshot;
        revision = owner;
        restored = false;
        retryAfter = 0;
        persistenceError = null;
        attempt.outcome = 'success';
        attempt.lastSuccessfulSnapshotAt = snapshot.lastUpdated;
        attempt.recognizedOrderCount = snapshot.orders.length;
        return snapshot;
      } finally {
        clearInterval(timer);
        if (heartbeat) await heartbeat;
      }
    })().catch(async error => {
      // Do not expose provider errors, URLs, storage paths or credentials.
      refreshError = cache
        ? 'XShop could not be updated. The last complete snapshot has been retained.'
        : 'XShop could not be updated. No complete snapshot is available yet.';
      refreshErrorCode = error instanceof XShopReadError ? error.code : null;
      if (attempt) {
        attempt.outcome = 'failure';
        attempt.failureCode = persistenceFailed ? 'persistence'
          : error instanceof XShopReadError ? safeXShopHistoryCode(error.code) : 'unknown';
      }
      console.warn('XShop snapshot refresh failed:', error instanceof XShopReadError
        ? error.message : 'A complete snapshot could not be loaded.');
      // Repeated downloads cannot solve hosting challenges or missing access.
      // Cool down automatic attempts; an explicit retry still works immediately
      // after the shop administrator restores API access.
      const permanent = error instanceof XShopReadError
        && ['blocked', 'access', 'credentials'].includes(error.code);
      retryAfter = now() + (permanent ? XSHOP_SNAPSHOT_TTL : 60000);
      try {
        await store.release(owner, retryAfter);
      } catch {
        persistenceError = 'XShop refresh coordination could not be saved. The last complete snapshot has been retained.';
      }
      throw new Error('XShop could not load a complete snapshot. Please retry.');
    }).finally(async () => {
      if (attempt) {
        attempt.finishedAt = new Date(now()).toISOString();
        await persistHistory();
      }
      inFlight = null;
    });
    return inFlight;
  }

  return {
    async load(forceRefresh = false, waitForRefresh = false): Promise<MerchandisingData> {
      await hydrate();
      if (cache) {
        if (forceRefresh || waitForRefresh || (now() >= retryAfter
          && (status().stale || now() - lastCoordinationCheck >= 5000))) {
          void refresh(forceRefresh).catch(() => {});
        }
        // Normal dashboards remain immediate. Explicit refresh/poll requests hold
        // the connection for a bounded interval so Autoscale has active requests
        // while the complete download runs; the client continues polling if needed.
        if (waitForRefresh && inFlight) {
          let timer: ReturnType<typeof setTimeout> | undefined;
          try {
            await Promise.race([
              inFlight.catch(() => {}),
              new Promise<void>(resolve => { timer = setTimeout(resolve, pollWaitMs); }),
            ]);
          } finally {
            if (timer) clearTimeout(timer);
          }
        }
        return response();
      }
      await refresh(forceRefresh);
      return response();
    },
    status,
    async history(): Promise<MerchRefreshHistory> {
      await hydrate();
      let visible = sanitizeXShopHistory(attempts), unavailable = historyPersistenceError;
      if (store.readHistory) {
        try {
          visible = mergeXShopHistory(await store.readHistory(), attempts);
        } catch {
          unavailable = true;
        }
      }
      return { attempts: visible.reverse(), persistenceUnavailable: unavailable, refreshing: !!inFlight };
    },
    clear() {
      // Retain the last good snapshot for stale-while-revalidate, even on manual refresh.
      restored = !!cache;
      retryAfter = 0;
    },
  };
}
