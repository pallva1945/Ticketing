import type { MerchandisingData, MerchSnapshotStatus, MerchRefreshErrorCode } from '../src/types/merchandising';
import { XShopReadError } from './xshopRead';

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

  const status = (): MerchSnapshotStatus => ({
    stale: !!cache && (restored || now() - Date.parse(cache.lastUpdated) >= XSHOP_SNAPSHOT_TTL),
    restored, refreshing: !!inFlight, refreshError, refreshErrorCode, persistenceError,
  });
  const response = () => ({ ...cache!, snapshotStatus: status() });

  function hydrate() {
    if (!hydration) hydration = store.read().then(snapshot => {
      if (snapshot) {
        validateXShopSnapshot(snapshot);
        cache = snapshot;
        restored = true;
      }
    }).catch(() => {
      persistenceError = 'The saved XShop snapshot could not be read; downloading a complete snapshot.';
      console.warn('XShop private snapshot could not be restored');
    });
    return hydration;
  }

  function refresh() {
    if (inFlight) return inFlight;
    refreshError = null;
    refreshErrorCode = null;
    inFlight = fetchSnapshot().then(async snapshot => {
      validateXShopSnapshot(snapshot);
      // Storage replaces the object atomically. Failed downloads never reach write().
      try {
        await store.write(snapshot);
        persistenceError = null;
      } catch {
        persistenceError = 'XShop data is current, but its private copy could not be saved for the next restart.';
        console.warn('XShop complete snapshot could not be persisted');
      }
      cache = snapshot;
      restored = false;
      retryAfter = 0;
      return snapshot;
    }).catch(error => {
      // Do not expose provider errors, URLs, storage paths or credentials.
      refreshError = cache
        ? 'XShop could not be updated. The last complete snapshot has been retained.'
        : 'XShop could not be updated. No complete snapshot is available yet.';
      refreshErrorCode = error instanceof XShopReadError ? error.code : null;
      console.warn('XShop snapshot refresh failed:', error instanceof XShopReadError
        ? error.message : 'A complete snapshot could not be loaded.');
      retryAfter = now() + 60000;
      throw new Error('XShop could not load a complete snapshot. Please retry.');
    }).finally(() => { inFlight = null; });
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
    clear() {
      // Retain the last good snapshot for stale-while-revalidate, even on manual refresh.
      restored = !!cache;
      retryAfter = 0;
    },
  };
}
