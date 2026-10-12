import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMerchCustomers, merchCustomerKey } from '../src/utils/merchandisingCustomers.ts';
import { mapXShopCustomers } from '../server/xshopMapping.ts';

const order = (id, extra = {}) => ({
  id, customerEmail: 'same@example.test', customerName: 'First Name',
  totalPrice: 122, totalTax: 22, financialStatus: 'paid', sourceName: 'web',
  createdAt: '2026-10-01T12:00:00Z', processedAt: '2026-10-01T12:00:00Z', ...extra,
});
const row = (id, extra = {}) => ({
  id, email: 'same@example.test', firstName: 'Account', lastName: 'Name',
  ordersCount: 100, totalSpent: 9999, createdAt: '2025-01-01T00:00:00Z', tags: [], ...extra,
});

test('one normalized email unifies different account and billing names without duplicating totals', () => {
  const rows = [row('a'), row('b', { email: ' SAME@EXAMPLE.TEST ', firstName: 'Alias', tags: ['VIP'] })];
  const orders = [order('1'), order('2', { customerEmail: ' Same@example.test ', customerName: 'Different Person' })];
  const result = buildMerchCustomers(rows, orders);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'email:same@example.test');
  assert.equal(result[0].ordersCount, 2);
  assert.equal(result[0].totalSpent, 200);
  assert.deepEqual(result[0].tags, ['VIP']);
  for (const alias of ['Account Name', 'Alias Name', 'First Name', 'Different Person']) {
    assert.ok(result[0].nameAliases.includes(alias));
  }
  assert.ok(orders.every(o => merchCustomerKey(o) === result[0].id));
});

test('anonymous purchasers are separate even when names match and each detail key opens its own order', () => {
  const orders = [
    order('1', { customerEmail: '', customerName: 'Named Guest', totalPrice: 35, totalTax: 0 }),
    order('2', { customerEmail: '  ', customerName: 'Named Guest', totalPrice: 6000, totalTax: 0 }),
  ];
  const customers = buildMerchCustomers([], orders);
  assert.equal(customers.length, 2);
  assert.deepEqual(customers.map(c => c.totalSpent), [35, 6000]);
  for (const c of customers) {
    const details = orders.filter(o => merchCustomerKey(o) === c.id);
    assert.equal(details.length, 1);
    assert.equal(details[0].totalPrice, c.totalSpent);
  }
});

test('similar names with distinct emails and plus aliases are not silently merged', () => {
  const customers = buildMerchCustomers([], [
    order('1'), order('2', { customerEmail: 'same+tag@example.test' }),
    order('3', { customerEmail: 's.ame@example.test' }),
  ]);
  assert.equal(customers.length, 3);
});

test('totals use net-of-tax retained sales, zero-price orders count, and refunds stay accessible', () => {
  const orders = [
    order('1'), order('2', { totalPrice: 61, totalTax: 11, financialStatus: 'partially_refunded' }),
    order('3', { totalPrice: 0, totalTax: 0 }),
    order('4', { totalPrice: 0, totalTax: 0, financialStatus: 'refunded' }),
    order('5', { totalPrice: 0, totalTax: 0, sourceName: 'shopify_draft_order' }),
  ];
  const [customer] = buildMerchCustomers([], orders);
  assert.equal(customer.totalSpent, 150);
  assert.equal(customer.ordersCount, 3);
  assert.equal(orders.filter(o => merchCustomerKey(o) === customer.id).length, 5);
});

test('rebuilding a saved snapshot is idempotent and family/season scoping reconciles to the selected orders', () => {
  const orders = [order('1'), order('2'), order('3', { customerEmail: '' })];
  const customers = buildMerchCustomers([row('a')], orders);
  assert.deepEqual(buildMerchCustomers(customers, orders), customers);
  assert.equal(customers.reduce((s, c) => s + c.totalSpent, 0), 300);
  const scoped = buildMerchCustomers(customers, orders.slice(1));
  assert.equal(scoped.reduce((s, c) => s + c.totalSpent, 0), 200);
});

test('provider mapping also unifies email aliases and includes anonymous order details', () => {
  const customers = mapXShopCustomers([
    { id: 1, email: 'same@example.test', first_name: 'Account', date_created_gmt: '2025-01-01T00:00:00' },
    { id: 2, email: ' SAME@EXAMPLE.TEST ', first_name: 'Alias', date_created_gmt: '2026-01-01T00:00:00' },
    { id: 3, email: '' },
  ], [order('1'), order('2', { customerEmail: '' })]);
  assert.equal(customers.length, 2);
  assert.equal(customers[0].ordersCount, 1);
  assert.equal(customers[1].id, 'guest:2');
});
