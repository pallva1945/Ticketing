import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyMerchFamily, buildMerchFamilyRevenue, scopeMerchOrders } from '../src/utils/merchandisingFamilies.ts';
import { mapXShopOrder, mapXShopProduct } from '../server/xshopMapping.ts';

const imported = (extra = {}) => ({
  id: 1, number: '1', status: 'completed', currency: 'EUR', created_via: 'shopify-import',
  date_created_gmt: '2026-07-01T09:36:33', date_paid_gmt: '2026-07-01T09:36:29',
  total: '249', total_tax: '44.90', prices_include_tax: true,
  shipping_total: '0', shipping_tax: '0', shipping_lines: [], fee_lines: [], refunds: [], meta_data: [],
  line_items: [{ id: 10, name: 'Canotta', product_id: 2, quantity: 1, total: '249', total_tax: '0' }],
  ...extra,
});
const sum = values => Math.round(values.reduce((total, value) => total + value, 0) * 100) / 100;

test('season-only products get actual families; collections and promotions remain separate', () => {
  assert.equal(classifyMerchFamily('Black Hoodie', ['26/27']), 'Apparel');
  assert.equal(classifyMerchFamily('Polo Travel', ['26/27']), 'Apparel');
  assert.equal(classifyMerchFamily('T-Shirt Nevel Rossa', ['26/27']), 'Apparel');
  assert.equal(classifyMerchFamily('Telo mare', ['Collezione 80° Anniversario']), 'Accessories');
  const product = mapXShopProduct({ id: 1, name: 'Canotta DELLA VALLE', categories: [
    { name: '26/27' }, { name: 'Game Jersey' }, { name: 'Outlet' },
  ] });
  assert.equal(product.productType, 'Game Jerseys');
  assert.deepEqual(product.collections, ['26/27']);
  assert.deepEqual(product.promotions, ['Outlet']);
  assert.equal(product.storeCategories.length, 3);
});

test('packs are exclusive; promotional pack tags do not misclassify individual products', () => {
  assert.equal(classifyMerchFamily('Pack estivo', ['Collezione 80° Anniversario']), 'Bundles');
  assert.equal(classifyMerchFamily('Tazza Nera', ['Pack Festa del papà']), 'Accessories');
  assert.equal(classifyMerchFamily('Member Platinum Shootaround Experience', ['Non categorizzato']), 'Experiences & Services');
  assert.equal(classifyMerchFamily('Unidentified item', ['26/27', 'Outlet']), 'Unclassified');
});

test('real imported gross-line example uses actual €44.90 VAT, not a blanket rate', () => {
  const order = mapXShopOrder(imported());
  assert.equal(order.totalPrice - order.totalTax, 204.1);
  assert.equal(order.lineItems[0].netRevenue, 204.1);
  assert.equal(order.lineItems[0].price, 249);
  assert.equal(order.revenueAllocation, 'order-vat');
  const differentRate = mapXShopOrder(imported({ total: '249', total_tax: '20' }));
  assert.equal(differentRate.lineItems[0].netRevenue, 229);
});

test('imported shipping VAT and discounted zero-price gifts reconcile to the header', () => {
  const order = mapXShopOrder(imported({
    total: '263.40', total_tax: '47.49', shipping_total: '6.90',
    shipping_lines: [{ id: 20, total: '6.90', total_tax: '0' }],
    line_items: [
      { id: 10, product_id: 2, quantity: 1, total: '256.50', total_tax: '0' },
      { id: 11, product_id: 3, quantity: 1, total: '0', total_tax: '0' },
    ],
  }));
  assert.equal(order.lineItems[1].netRevenue, 0);
  assert.equal(sum([order.shippingRevenue, ...order.lineItems.map(l => l.netRevenue)]), 215.91);
  assert.equal(order.shippingRevenue, 5.66);
});

test('cent allocation conserves the actual tax across several equal components', () => {
  const order = mapXShopOrder(imported({ total: '3', total_tax: '.02', line_items: [1, 2, 3].map(id => ({
    id, product_id: id, quantity: 1, total: '1', total_tax: '0',
  })) }));
  assert.equal(sum(order.lineItems.map(l => l.netRevenue)), 2.98);
});

test('native and older tax-exclusive imported lines are never taxed twice', () => {
  for (const extra of [{ created_via: 'checkout' }, { created_via: 'shopify-import', prices_include_tax: false }]) {
    const order = mapXShopOrder(imported({ ...extra, total: '122', total_tax: '22',
      line_items: [{ id: 10, product_id: 2, quantity: 1, total: '100', total_tax: extra.prices_include_tax === false ? '0' : '22' }],
    }));
    assert.equal(order.lineItems[0].netRevenue, 100);
    assert.equal(order.revenueAllocation, 'exact');
  }
});

test('imported partial monetary refunds reconcile net lines, VAT and shipping', () => {
  const order = mapXShopOrder(imported({ total: '122', total_tax: '22',
    line_items: [{ id: 10, product_id: 2, quantity: 2, total: '122', total_tax: '0' }],
    refunds: [{ total: '-61' }],
  }), [{ line_items: [], shipping_lines: [], fee_lines: [], tax_lines: [] }]);
  assert.equal(order.totalPrice, 61);
  assert.equal(order.totalTax, 11);
  assert.equal(order.lineItems[0].netRevenue, 50);
});

test('gross imported item refunds and shipping-only refunds affect only their actual components', () => {
  const base = imported({
    total: '134.20', total_tax: '24.20', shipping_total: '12.20',
    shipping_lines: [{ id: 20, total: '12.20', total_tax: '0' }],
    line_items: [{ id: 10, product_id: 2, quantity: 2, total: '122', total_tax: '0' }],
  });
  const shippingRefund = mapXShopOrder({ ...base, refunds: [{ total: '-12.20' }] }, [{
    shipping_lines: [{ total: '-12.20', total_tax: '0' }], tax_lines: [],
  }]);
  assert.equal(shippingRefund.lineItems[0].netRevenue, 100);
  assert.equal(shippingRefund.shippingRevenue, 0);
  assert.equal(shippingRefund.totalTax, 22);
  const itemRefund = mapXShopOrder({ ...base, refunds: [{ total: '-61' }] }, [{
    line_items: [{ total: '-61', total_tax: '0', quantity: -1, meta_data: [{ key: '_refunded_item_id', value: 10 }] }],
    tax_lines: [],
  }]);
  assert.equal(itemRefund.lineItems[0].netRevenue, 50);
  assert.equal(itemRefund.lineItems[0].quantity, 1);
  assert.equal(itemRefund.shippingRevenue, 10);
  assert.equal(sum([itemRefund.shippingRevenue, itemRefund.lineItems[0].netRevenue]), itemRefund.totalPrice - itemRefund.totalTax);
});

test('refunds and zero-price giveaways cannot contribute positive category revenue', () => {
  const full = mapXShopOrder(imported({ status: 'refunded', refunds: [{ total: '-249' }] }));
  const gift = mapXShopOrder(imported({ total: '0', total_tax: '0' }));
  assert.equal(full.lineItems[0].netRevenue, 0);
  assert.equal(gift.lineItems[0].netRevenue, 0);
  assert.equal(buildMerchFamilyRevenue([full, gift], []).total, 0);
});

test('real POS negative fees are discounts, not omitted fees or unresolved revenue', () => {
  const order = mapXShopOrder(imported({
    created_via: 'xshop-pos', total: '13.50', total_tax: '2.43',
    line_items: [{ id: 10, product_id: 2, quantity: 1, total: '12.30', total_tax: '2.70' }],
    fee_lines: [{ id: 30, total: '-1.23', total_tax: '-.27' }],
  }));
  assert.equal(order.lineItems[0].netRevenue, 11.07);
  assert.equal(order.lineItems[0].price, 13.5);
  assert.equal(order.feeRevenue, 0);
  assert.equal(order.unallocatedRevenue, 0);
  assert.equal(order.revenueAllocation, 'order-discount');
});

test('proportional monetary refunds conserve cents across many product lines', () => {
  const order = mapXShopOrder(imported({
    total: '100', total_tax: '18.03', refunds: [{ total: '-12.34' }],
    line_items: Array.from({ length: 100 }, (_, index) => ({
      id: index + 1, product_id: index + 1, quantity: 1, total: '1', total_tax: '0',
    })),
  }));
  assert.equal(order.revenueAllocation, 'order-vat');
  assert.equal(sum(order.lineItems.map(line => line.netRevenue)), Math.round((order.totalPrice - order.totalTax) * 100) / 100);
});

test('missing products and uncertain financial layouts remain explicit, with no lost or duplicated revenue', () => {
  const uncertain = mapXShopOrder(imported({
    total: '20', total_tax: '0', shipping_total: '6.90',
    shipping_lines: [{ total: '6.90', total_tax: '0' }],
    line_items: [{ id: 10, product_id: 2, quantity: 1, total: '20', total_tax: '0' }],
  }));
  assert.equal(uncertain.revenueAllocation, 'unreconciled');
  assert.equal(uncertain.lineItems[0].netRevenue, 0);
  assert.equal(uncertain.unallocatedRevenue, 20);
  const result = buildMerchFamilyRevenue([mapXShopOrder(imported()), uncertain], []);
  assert.deepEqual(result.categories, [{ name: 'Unclassified', value: 224.1 }]);
  assert.equal(result.unreconciledOrders, 1);
});

test('all families share the whole denominator; no top-eight truncation or multi-category double counting', () => {
  const products = [
    mapXShopProduct({ id: 2, name: 'Canotta', categories: [{ name: '26/27' }, { name: 'Game Jersey' }] }),
    mapXShopProduct({ id: 3, name: 'Black Hoodie', categories: [{ name: '26/27' }] }),
  ];
  const a = mapXShopOrder(imported());
  const b = mapXShopOrder(imported({ id: 2, line_items: [{ id: 20, product_id: 3, quantity: 1, total: '249', total_tax: '0' }] }));
  const result = buildMerchFamilyRevenue([a, b], products);
  assert.equal(result.total, 408.2);
  assert.equal(result.categories.length, 2);
  assert.equal(sum(result.categories.map(c => c.value / result.total * 100)), 100);
  assert.ok(result.categories.every(c => !c.name.includes('26/27')));
});

test('family filtering counts matching items only within mixed orders and preserves original details', () => {
  const products = [
    mapXShopProduct({ id: 2, name: 'Canotta', categories: [{ name: 'Game Jersey' }] }),
    mapXShopProduct({ id: 3, name: 'Black Hoodie', categories: [{ name: '26/27' }] }),
  ];
  const order = mapXShopOrder(imported({
    total: '183', total_tax: '33', line_items: [
      { id: 10, product_id: 2, quantity: 1, total: '122', total_tax: '0' },
      { id: 11, product_id: 3, quantity: 2, total: '61', total_tax: '0' },
    ],
  }));
  const scoped = scopeMerchOrders([order], products, 'Apparel');
  assert.equal(scoped.length, 1);
  assert.equal(scoped[0].lineItems.length, 1);
  assert.equal(scoped[0].itemCount, 2);
  assert.equal(scoped[0].totalPrice - scoped[0].totalTax, 50);
  assert.equal(order.lineItems.length, 2);
  assert.equal(order.totalPrice - order.totalTax, 150);
  assert.deepEqual(scopeMerchOrders([order], products, 'Accessories'), []);
  assert.equal(scopeMerchOrders([order], products, 'all')[0], order);
});

test('unclassified filter includes missing products and unresolved amounts without duplicate attribution', () => {
  const order = mapXShopOrder(imported({ total: '20', total_tax: '0', shipping_total: '6.9',
    line_items: [{ id: 10, product_id: 2, quantity: 1, total: '20', total_tax: '0' }],
  }));
  const products = [mapXShopProduct({ id: 2, name: 'Canotta' })];
  const scoped = scopeMerchOrders([order], products, 'Unclassified');
  assert.equal(scoped[0].totalPrice - scoped[0].totalTax, 20);
  assert.equal(buildMerchFamilyRevenue(scoped, products).total, 20);
  assert.equal(buildMerchFamilyRevenue(scopeMerchOrders([order], products, 'Game Jerseys'), products).total, 0);
});
