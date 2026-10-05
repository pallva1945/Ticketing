import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { mapXShopOrder, mapXShopProduct, mapXShopCustomers, isRecognizedOrder } from '../server/xshopMapping.ts';
import { fetchAllXShop } from '../server/xshopApi.ts';
import { getMerchSeason, isMerchSale, isMerchGiveaway, merchLineNetRevenue } from '../src/types/merchandising.ts';

const order = (extra = {}) => ({
  id: 1, number: '10', status: 'completed', currency: 'EUR', created_via: 'checkout',
  date_created_gmt: '2026-09-01T10:00:00', date_paid_gmt: '2026-09-01T10:01:00',
  total: '122.00', total_tax: '22.00', billing: { first_name: 'Example', email: 'EXAMPLE@example.test' },
  meta_data: [], refunds: [], line_items: [{
    id: 10, product_id: 2, name: 'Shirt', quantity: 2, subtotal: '120.00', total: '100.00',
    total_tax: '22.00', sku: 'TEST', meta_data: [],
  }], ...extra,
});

test('imported Shopify history keeps original paid dates, numbers and WooCommerce identifiers', () => {
  const normalized = mapXShopOrder(order({ created_via: 'shopify-import',
    date_created_gmt: '2025-10-17T09:15:02', date_paid_gmt: '2025-10-17T09:14:59',
    meta_data: [{ key: '_shopify_order_number', value: '#1234' }] }));
  assert.equal(normalized.orderNumber, '1234');
  assert.equal(normalized.processedAt, '2025-10-17T09:14:59.000Z');
  assert.equal(getMerchSeason(normalized.processedAt), '25/26');
  assert.equal(normalized.sourceName, 'shopify-import');
  assert.equal(normalized.id, '1');
  assert.equal(normalized.lineItems[0].productId, '2');
});

test('discounted line revenue is after discounts, excluding exact line VAT', () => {
  const mapped = mapXShopOrder(order());
  assert.equal(mapped.totalPrice - mapped.totalTax, 100);
  assert.equal(mapped.lineItems[0].price, 61);
  assert.equal(merchLineNetRevenue(mapped, mapped.lineItems[0]), 100);
});

test('partial refunds reduce header revenue, item units and exact VAT once', () => {
  const mapped = mapXShopOrder(order({ refunds: [{ total: '-61.00' }] }), [{
    line_items: [{ total: '-50.00', total_tax: '-11.00', quantity: -1, meta_data: [{ key: '_refunded_item_id', value: 10 }] }],
    tax_lines: [{ tax_total: '-11.00', shipping_tax_total: '0' }],
  }]);
  assert.equal(mapped.totalPrice, 61);
  assert.equal(mapped.totalTax, 11);
  assert.equal(mapped.itemCount, 1);
  assert.equal(mapped.lineItems[0].netRevenue, 50);
  assert.equal(mapped.financialStatus, 'partially_refunded');
});

test('refunded shipping VAT is deducted without reducing unrelated product sales', () => {
  const mapped = mapXShopOrder(order({ total: '134.20', total_tax: '24.20', refunds: [{ total: '-12.20' }] }), [{
    line_items: [], shipping_lines: [{ total: '-10', total_tax: '-2.20' }],
    tax_lines: [{ tax_total: '0', shipping_tax_total: '-2.20' }],
  }]);
  assert.equal(mapped.totalPrice, 122);
  assert.equal(mapped.totalTax, 22);
  assert.equal(mapped.lineItems[0].netRevenue, 100);
});

test('full refunds cannot become giveaways or sales', () => {
  const mapped = mapXShopOrder(order({ status: 'refunded', refunds: [{ total: '-122' }] }));
  assert.equal(mapped.totalPrice, 0);
  assert.equal(mapped.totalTax, 0);
  assert.equal(mapped.itemCount, 0);
  assert.equal(isMerchGiveaway(mapped), false);
  assert.equal(isMerchSale(mapped), false);
  assert.equal(isMerchGiveaway(mapXShopOrder(order({ total: '0', total_tax: '0',
    line_items: [{ id: 10, product_id: 2, quantity: 1, total: '0', total_tax: '0' }] }))), true);
});

test('failed, cancelled and unpaid orders never enter sales; real zero-price completed orders remain', () => {
  for (const status of ['failed', 'cancelled', 'pending', 'on-hold', 'checkout-draft']) {
    assert.equal(isRecognizedOrder(order({ status, date_paid_gmt: null })), false, status);
  }
  assert.equal(isRecognizedOrder(order({ meta_data: [{ key: '_shopify_financial_status', value: 'pending' }] })), false);
  assert.equal(isRecognizedOrder(order({ total: '0', date_paid_gmt: null })), true);
});

test('customer totals use paid net-of-tax sales and include guest purchasers', () => {
  const customers = mapXShopCustomers([], [
    mapXShopOrder(order()), mapXShopOrder(order({ id: 2 })),
    mapXShopOrder(order({ id: 3, status: 'refunded' })),
  ]);
  assert.equal(customers.length, 1);
  assert.equal(customers[0].email, 'example@example.test');
  assert.equal(customers[0].ordersCount, 2);
  assert.equal(customers[0].totalSpent, 200);
});

test('variation stock is loaded, and untracked stock is not treated as known zero', () => {
  const product = mapXShopProduct({ id: 1, name: 'Shirt', status: 'publish', categories: [{ name: 'Apparel' }] }, [
    { id: 2, price: '15.00', stock_quantity: 7, attributes: [{ option: 'M' }] },
    { id: 3, price: '15.00', stock_quantity: 0 },
    { id: 4, price: '15.00', stock_quantity: null },
  ]);
  assert.equal(product.totalInventory, 7);
  assert.equal(product.variants[0].title, 'M');
  assert.equal(product.variants[1].inventoryTracked, true);
  assert.equal(product.variants[2].inventoryTracked, false);
});

test('seasons use Rome midnight at the July boundary', () => {
  assert.equal(getMerchSeason('2026-06-30T21:59:59Z'), '25/26');
  assert.equal(getMerchSeason('2026-06-30T22:00:00Z'), '26/27');
});

test('pagination returns every page without arbitrary silent truncation', async () => {
  const calls = [];
  const rows = await fetchAllXShop('orders', async (resource, params) => {
    calls.push(params.page);
    return { data: [{ id: Number(params.page) }], total: 3, pages: 3 };
  });
  assert.equal(rows.length, 3);
  assert.deepEqual(new Set(calls), new Set(['1', '2', '3']));
});

test('changing, truncated and duplicate pagination snapshots fail explicitly', async () => {
  await assert.rejects(fetchAllXShop('orders', async () => ({ data: [{ id: 1 }], total: 3, pages: 2 })), /complete snapshot/);
  await assert.rejects(fetchAllXShop('orders', async (_, params) => ({
    data: [{ id: Number(params.page) }], total: Number(params.page) === 1 ? 2 : 3, pages: 2,
  })), /complete snapshot/);
});

test('invalid figures fail explicitly, and only safe normalized fields are exposed', () => {
  assert.throws(() => mapXShopOrder(order({ total: 'not-a-number' })), /monetary value/);
  assert.throws(() => mapXShopOrder(order({ date_created_gmt: null })), /original date/);
  const mapped = mapXShopOrder(order({ order_key: 'private-order-key', customer_ip_address: 'private-ip',
    meta_data: [{ key: '_xpay_alias', value: 'private-payment-reference' }] }));
  assert.doesNotMatch(JSON.stringify(mapped), /private-/);
});

test('all active frontend data calls and refresh events use merchandising, not Shopify', () => {
  for (const path of ['src/App.tsx', 'src/components/MerchandisingView.tsx']) {
    const source = fs.readFileSync(path, 'utf8');
    assert.doesNotMatch(source, /\/api\/shopify\/|shopify-refresh|Live from Shopify|Loading Shopify|Refresh Shopify|\bSHOPIFY\b/);
  }
  const app = fs.readFileSync('src/App.tsx', 'utf8');
  assert.doesNotMatch(app, /['"]merch-26-27['"]/);
  assert.match(app, /merch-xshop-26-27/);
});
