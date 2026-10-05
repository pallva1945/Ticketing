import type { MerchandisingData } from '../src/types/merchandising';
import { isRecognizedOrder, mapXShopOrder, mapXShopProduct, mapXShopCustomers } from './xshopMapping';
import { createXShopSnapshotCache } from './xshopSnapshotCache';
import { xshopSnapshotStore } from './xshopSnapshotStore';

type Row = Record<string, any>;
const ROOT = 'https://store.pallacanestrovarese.it/wp-json/wc/v3/';

export async function fetchXShopAPI(resource: string, params: Record<string, string> = {}) {
  const key = process.env.XSHOP_CONSUMER_KEY;
  const secret = process.env.XSHOP_CONSUMER_SECRET;
  if (!key || !secret) throw new Error('XShop API credentials are not configured');
  const url = new URL(resource, ROOT);
  if (!url.href.startsWith(ROOT)) throw new Error('Invalid XShop API resource');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, {
      method: 'GET', redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`, Accept: 'application/json' },
    });
    if (response.status === 429 || response.status >= 500) {
      if (attempt < 2) {
        const delay = Math.min(10000, Math.max(1000, Number(response.headers.get('retry-after') || '2') * 1000));
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
    // Never forward raw provider errors, credentials, headers or payment metadata to the browser/logs.
    if (!response.ok) throw new Error(`XShop API ${response.status} while reading ${resource.split('?')[0]}`);
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error(`XShop returned a non-JSON response (HTTP ${response.status}); the API may be blocked by store protection`);
    }
    let data: unknown;
    try { data = await response.json(); }
    catch { throw new Error('XShop returned invalid JSON; no snapshot was published'); }
    if (!Array.isArray(data)) throw new Error('XShop returned an invalid API collection');
    const total = Number(response.headers.get('x-wp-total'));
    const pages = Number(response.headers.get('x-wp-totalpages'));
    if (!response.headers.has('x-wp-total') || !response.headers.has('x-wp-totalpages')
      || !Number.isInteger(total) || !Number.isInteger(pages) || total < 0 || pages < 0) {
      throw new Error('XShop pagination totals are missing or invalid');
    }
    return { data: data as Row[], total, pages };
  }
  throw new Error('XShop API retry limit reached');
}

export async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const result = new Array<R>(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      result[index] = await fn(items[index]);
    }
  }));
  return result;
}

export async function fetchAllXShop(resource: string, request = fetchXShopAPI): Promise<Row[]> {
  const params = { per_page: '100', orderby: 'id', order: 'asc' };
  const first = await request(resource, { ...params, page: '1' });
  if (first.pages > 1000) throw new Error(`XShop ${resource} exceeds the safe pagination limit`);
  const remaining = await mapConcurrent(
    Array.from({ length: Math.max(0, first.pages - 1) }, (_, index) => index + 2), 3,
    page => request(resource, { ...params, page: String(page) }),
  );
  const rows = first.data.concat(...remaining.map(page => page.data));
  const ids = new Set(rows.map(row => row.id));
  if (ids.size !== rows.length || rows.length !== first.total
    || remaining.some(page => page.total !== first.total || page.pages !== first.pages)) {
    throw new Error(`XShop ${resource} changed during pagination; refresh to obtain a complete snapshot`);
  }
  return rows;
}

async function fetchSnapshot(): Promise<MerchandisingData> {
  const started = Date.now();
  // Orders are the financial source; failure of any resource must not publish a partial snapshot.
  const rawOrders = await fetchAllXShop('orders');
  const recognized = rawOrders.filter(isRecognizedOrder);
  const rawProducts = await fetchAllXShop('products');
  const rawCustomers = await fetchAllXShop('customers');
  const refundedOrders = recognized.filter(o => o.refunds?.length);
  const refundRows = await mapConcurrent(refundedOrders, 3, async order => ({
    id: order.id, refunds: await fetchAllXShop(`orders/${order.id}/refunds`),
  }));
  const refunds = new Map(refundRows.map(row => [row.id, row.refunds]));
  const orders = recognized.map(order => mapXShopOrder(order, refunds.get(order.id)));
  if (orders.some(order => order.currency !== 'EUR')) throw new Error('XShop contains non-EUR orders; currency conversion is required');
  const products = await mapConcurrent(rawProducts, 3, async product => mapXShopProduct(
    product, product.type === 'variable' ? await fetchAllXShop(`products/${product.id}/variations`) : [],
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
