import type { MerchandisingData } from '../src/types/merchandising';
import { isRecognizedOrder, mapXShopOrder, mapXShopProduct, mapXShopCustomers } from './xshopMapping';
import { createXShopSnapshotCache } from './xshopSnapshotCache';
import { xshopSnapshotStore } from './xshopSnapshotStore';
import { XShopReadError, withXShopRetries, xshopRetryDelay, xshopHttpError } from './xshopRead';

type Row = Record<string, any>;
const ROOT = 'https://store.pallacanestrovarese.it/wp-json/wc/v3/';

export async function fetchXShopAPI(resource: string, params: Record<string, string> = {}, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const key = process.env.XSHOP_CONSUMER_KEY;
  const secret = process.env.XSHOP_CONSUMER_SECRET;
  if (!key || !secret) throw new XShopReadError('credentials');
  const url = new URL(resource, ROOT);
  if (!url.href.startsWith(ROOT)) throw new Error('Invalid XShop API resource');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return withXShopRetries(async () => {
    const response = await fetch(url, {
      method: 'GET', redirect: 'error',
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000),
      headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`, Accept: 'application/json' },
    });
    const httpError = xshopHttpError(response.status, response.headers.get('content-type'));
    // Never forward raw provider errors, credentials, headers or payment metadata to the browser/logs.
    if (httpError) throw new XShopReadError(httpError, xshopRetryDelay(response.headers.get('retry-after')));
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new XShopReadError('response');
    }
    let data: unknown;
    try { data = await response.json(); }
    catch (error) {
      if (error instanceof TypeError || (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name))) throw error;
      throw new XShopReadError('response');
    }
    if (!Array.isArray(data)) throw new XShopReadError('response');
    const total = Number(response.headers.get('x-wp-total'));
    const pages = Number(response.headers.get('x-wp-totalpages'));
    if (!response.headers.has('x-wp-total') || !response.headers.has('x-wp-totalpages')
      || !Number.isInteger(total) || !Number.isInteger(pages) || total < 0 || pages < 0) {
      throw new XShopReadError('response');
    }
    return { data: data as Row[], total, pages };
  }, undefined, signal);
}

export async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const result = new Array<R>(items.length);
  let next = 0;
  let failed = false;
  const workers = await Promise.allSettled(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (!failed && next < items.length) {
      const index = next++;
      try {
        result[index] = await fn(items[index]);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  }));
  // Drain outstanding reads before another refresh can start; failed workers
  // must not keep downloading while a new request starts a second snapshot.
  const rejection = workers.find(worker => worker.status === 'rejected');
  if (rejection?.status === 'rejected') throw rejection.reason;
  return result;
}

export async function fetchAllXShop(resource: string, request = fetchXShopAPI, signal?: AbortSignal): Promise<Row[]> {
  signal?.throwIfAborted();
  const params = { per_page: '100', orderby: 'id', order: 'asc' };
  const first = await request(resource, { ...params, page: '1' }, signal);
  if (first.pages > 1000) throw new Error(`XShop ${resource} exceeds the safe pagination limit`);
  const remaining = await mapConcurrent(
    Array.from({ length: Math.max(0, first.pages - 1) }, (_, index) => index + 2), 3,
    page => request(resource, { ...params, page: String(page) }, signal),
  );
  const rows = first.data.concat(...remaining.map(page => page.data));
  const ids = new Set(rows.map(row => row.id));
  if (ids.size !== rows.length || rows.length !== first.total
    || remaining.some(page => page.total !== first.total || page.pages !== first.pages)) {
    throw new XShopReadError('pagination');
  }
  return rows;
}

async function fetchSnapshot(signal?: AbortSignal): Promise<MerchandisingData> {
  const started = Date.now();
  // Orders are the financial source; failure of any resource must not publish a partial snapshot.
  const rawOrders = await fetchAllXShop('orders', fetchXShopAPI, signal);
  const recognized = rawOrders.filter(isRecognizedOrder);
  const rawProducts = await fetchAllXShop('products', fetchXShopAPI, signal);
  const rawCustomers = await fetchAllXShop('customers', fetchXShopAPI, signal);
  const refundedOrders = recognized.filter(o => o.refunds?.length);
  const refundRows = await mapConcurrent(refundedOrders, 3, async order => ({
    id: order.id, refunds: await fetchAllXShop(`orders/${order.id}/refunds`, fetchXShopAPI, signal),
  }));
  const refunds = new Map(refundRows.map(row => [row.id, row.refunds]));
  const orders = recognized.map(order => mapXShopOrder(order, refunds.get(order.id)));
  if (orders.some(order => order.currency !== 'EUR')) throw new Error('XShop contains non-EUR orders; currency conversion is required');
  const products = await mapConcurrent(rawProducts, 3, async product => mapXShopProduct(
    product, product.type === 'variable' ? await fetchAllXShop(`products/${product.id}/variations`, fetchXShopAPI, signal) : [],
  ));
  const snapshot: MerchandisingData = {
    orders, products, customers: mapXShopCustomers(rawCustomers, orders),
    lastUpdated: new Date().toISOString(), source: 'XShop', complete: true,
    sourceOrderCount: rawOrders.length, excludedOrderCount: rawOrders.length - orders.length,
  };
  const dates = orders.map(order => order.processedAt).sort();
  console.log(`XShop snapshot ready: ${orders.length}/${rawOrders.length} recognized orders, ${products.length} products, ${snapshot.customers.length} customers; ${dates[0]?.slice(0, 10)} to ${dates[dates.length - 1]?.slice(0, 10)}; ${Math.round((Date.now() - started) / 1000)}s`);
  return snapshot;
}

const snapshotCache = createXShopSnapshotCache(fetchSnapshot, xshopSnapshotStore);
export const loadXShopData = snapshotCache.load;
export const clearXShopCache = snapshotCache.clear;
export const getXShopCacheStatus = snapshotCache.status;
export const getXShopRefreshHistory = snapshotCache.history;
