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

export interface XShopSnapshotStore {
  read(): Promise<MerchandisingData | null>;
  write(data: MerchandisingData): Promise<void>;
  readHistory?(): Promise<MerchRefreshAttempt[]>;
  writeHistory?(attempts: MerchRefreshAttempt[]): Promise<void>;
}

export function createXShopSnapshotCache(
  fetchSnapshot: () => Promise<MerchandisingData>,
  store: XShopSnapshotStore,
  now = Date.now,
  pollWaitMs = 20000,
) {
  let cache: MerchandisingData | null = null;
  let restored = false;
  let hydration: Promise<void> | null = null;
  let inFlight: Promise<MerchandisingData> | null = null;
  let retryAfter = 0;
  let refreshError: string | null = null;
  let refreshErrorCode: MerchRefreshErrorCode | null = null;
  let persistenceError: string | null = null;
  let attempts: MerchRefreshAttempt[] = [];
  let historyPersistenceError = false;
  let historyReadFailed = false;

  const status = (): MerchSnapshotStatus => ({
    stale: !!cache && (restored || now() - Date.parse(cache.lastUpdated) >= XSHOP_SNAPSHOT_TTL),
    restored, refreshing: !!inFlight, refreshError, refreshErrorCode, persistenceError, historyPersistenceError,
  });
  const response = () => ({ ...cache!, snapshotStatus: status() });

  function hydrate() {
    if (!hydration) hydration = Promise.all([store.read().then(snapshot => {
      if (snapshot) {
        validateXShopSnapshot(snapshot);
        cache = snapshot;
        restored = true;
      }
    }).catch(() => {
      persistenceError = 'The saved XShop snapshot could not be read; downloading a complete snapshot.';
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
            retryAfter = Date.parse(latest.finishedAt!) + (permanent ? XSHOP_SNAPSHOT_TTL : 60000);
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
        // Never overwrite unreadable durable history with only this process's rows.
        const saved = sanitizeXShopHistory(await store.readHistory!());
        attempts = [...saved, ...attempts].slice(-XSHOP_HISTORY_LIMIT);
        historyReadFailed = false;
      }
      await store.writeHistory(sanitizeXShopHistory(attempts));
      historyPersistenceError = false;
    } catch {
      historyPersistenceError = true;
      console.warn('XShop private refresh history could not be saved');
    }
  }

  function refresh() {
    if (inFlight) return inFlight;
    refreshError = null;
    refreshErrorCode = null;
    const attempt: MerchRefreshAttempt = {
      id: randomUUID(),
      startedAt: new Date(now()).toISOString(), finishedAt: null, outcome: 'unfinished', failureCode: null,
      lastSuccessfulSnapshotAt: cache?.lastUpdated ?? null, recognizedOrderCount: cache?.orders.length ?? null,
    };
    attempts = [...attempts, attempt].slice(-XSHOP_HISTORY_LIMIT);
    // Persist the start before downloading so a process interruption stays visible.
    inFlight = persistHistory().then(() => fetchSnapshot()).then(async snapshot => {
      validateXShopSnapshot(snapshot);
      // Storage replaces the object atomically. Failed downloads never reach write().
      try {
        await store.write(snapshot);
        persistenceError = null;
        attempt.outcome = 'success';
      } catch {
        persistenceError = 'XShop data is current, but its private copy could not be saved for the next restart.';
        console.warn('XShop complete snapshot could not be persisted');
        attempt.outcome = 'failure';
        attempt.failureCode = 'persistence';
      }
      cache = snapshot;
      restored = false;
      retryAfter = 0;
      attempt.lastSuccessfulSnapshotAt = snapshot.lastUpdated;
      attempt.recognizedOrderCount = snapshot.orders.length;
      return snapshot;
    }).catch(error => {
      // Do not expose provider errors, URLs, storage paths or credentials.
      refreshError = cache
        ? 'XShop could not be updated. The last complete snapshot has been retained.'
        : 'XShop could not be updated. No complete snapshot is available yet.';
      refreshErrorCode = error instanceof XShopReadError ? error.code : null;
      attempt.outcome = 'failure';
      attempt.failureCode = error instanceof XShopReadError ? safeXShopHistoryCode(error.code) : 'unknown';
      console.warn('XShop snapshot refresh failed:', error instanceof XShopReadError
        ? error.message : 'A complete snapshot could not be loaded.');
      // Repeated downloads cannot solve hosting challenges or missing access.
      // Cool down automatic attempts; an explicit retry still works immediately
      // after the shop administrator restores API access.
      const permanent = error instanceof XShopReadError
        && ['blocked', 'access', 'credentials'].includes(error.code);
      retryAfter = now() + (permanent ? XSHOP_SNAPSHOT_TTL : 60000);
      throw new Error('XShop could not load a complete snapshot. Please retry.');
    }).finally(async () => {
      attempt.finishedAt = new Date(now()).toISOString();
      await persistHistory();
      inFlight = null;
    });
    return inFlight;
  }

  return {
    async load(forceRefresh = false, waitForRefresh = false): Promise<MerchandisingData> {
      await hydrate();
      if (cache) {
        if (forceRefresh || (status().stale && now() >= retryAfter)) {
          void refresh().catch(() => {});
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
      await refresh();
      return response();
    },
    status,
    async history(): Promise<MerchRefreshHistory> {
      await hydrate();
      let visible = sanitizeXShopHistory(attempts), unavailable = historyPersistenceError;
      if (store.readHistory) {
        try {
          // Other instances may have added records since this process hydrated.
          // Keep local unsaved entries visible without replacing active references.
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
