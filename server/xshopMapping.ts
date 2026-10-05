import type { MerchOrder, MerchProduct, MerchCustomer } from '../src/types/merchandising';

type Row = Record<string, any>;
const amount = (value: unknown): number => {
  if (value === undefined || value === null || value === '') return 0;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error('XShop returned an invalid monetary value');
  return number;
};
const money = (value: number) => Math.round(value * 100) / 100;
const meta = (row: Row, key: string) => (row.meta_data || []).find((m: Row) => m.key === key)?.value;

function isoDate(gmt: string | null | undefined): string {
  if (!gmt) throw new Error('XShop returned a record without its original date');
  const date = new Date(gmt.endsWith('Z') ? gmt : `${gmt}Z`);
  if (!Number.isFinite(date.getTime())) throw new Error('XShop returned an invalid date');
  return date.toISOString();
}

export function isRecognizedOrder(order: Row): boolean {
  if (['cancelled', 'failed', 'trash', 'auto-draft', 'checkout-draft'].includes(order.status)) return false;
  const importedStatus = meta(order, '_shopify_financial_status');
  if (importedStatus && ['pending', 'voided', 'authorized', 'unpaid'].includes(importedStatus) && amount(order.total) > 0) return false;
  return ['completed', 'processing', 'refunded'].includes(order.status) || Boolean(order.date_paid_gmt);
}

export function normalizeXShopPayment(method: string): string {
  const value = (method || '').toLowerCase();
  if (value.includes('paypal')) return 'PayPal';
  if (/xpay|nexi|cartasi|stripe|card|credit|visa|mastercard/.test(value)) return 'Card';
  if (/cash|contanti|cod/.test(value)) return 'Cash';
  if (/bacs|bank|bonifico|wire|transfer/.test(value)) return 'Wire Transfer';
  if (/gift.?card/.test(value)) return 'Gift Card';
  if (/pos|manual/.test(value)) return 'Manual/POS';
  return method || 'Unknown';
}

export function mapXShopOrder(order: Row, refunds: Row[] = []): MerchOrder {
  const originalTotal = amount(order.total);
  const refunded = (order.refunds || []).reduce((sum: number, r: Row) => sum + Math.abs(amount(r.total)), 0);
  const fullyRefunded = order.status === 'refunded' || meta(order, '_shopify_financial_status') === 'refunded'
    || (refunded > 0 && refunded >= originalTotal);
  const totalPrice = fullyRefunded ? 0 : money(Math.max(0, originalTotal - refunded));
  const refundItems = refunds.flatMap(r => r.line_items || []);
  // WooCommerce refund line totals/taxes are negative; item IDs reference the original order lines.
  const refundForLine = (id: number) => refundItems.filter((li: Row) =>
    Number((li.meta_data || []).find((m: Row) => m.key === '_refunded_item_id')?.value) === id);
  const taxLines = refunds.flatMap(r => r.tax_lines || []);
  const refundTax = taxLines.length
    ? taxLines.reduce((sum: number, li: Row) => sum + Math.abs(amount(li.tax_total)) + Math.abs(amount(li.shipping_tax_total)), 0)
    : refunds.flatMap(r => [...(r.line_items || []), ...(r.shipping_lines || []), ...(r.fee_lines || [])])
      .reduce((sum: number, li: Row) => sum + Math.abs(amount(li.total_tax)), 0);
  const originalTax = amount(order.total_tax);
  const totalTax = fullyRefunded ? 0 : money(Math.max(0, originalTax - (
    refunds.some(r => (r.line_items?.length || r.shipping_lines?.length || r.fee_lines?.length || r.tax_lines?.length))
      ? refundTax : originalTotal > 0 ? originalTax * refunded / originalTotal : 0
  )));
  const unallocatedRefund = refunded > 0 && !refunds.some(r =>
    r.line_items?.length || r.shipping_lines?.length || r.fee_lines?.length);
  const remainingRatio = originalTotal > 0 ? totalPrice / originalTotal : 1;
  const lineItems = (order.line_items || []).map((li: Row) => {
    const lineRefunds = refundForLine(Number(li.id));
    const returnedQty = lineRefunds.reduce((sum: number, r: Row) => sum + Math.abs(amount(r.quantity)), 0);
    const quantity = fullyRefunded ? 0 : Math.max(0, amount(li.quantity) - returnedQty);
    const discountAdjustedNet = amount(li.total);
    const netRevenue = fullyRefunded ? 0 : money(Math.max(0, unallocatedRefund
      ? discountAdjustedNet * remainingRatio
      : discountAdjustedNet - lineRefunds.reduce((sum: number, r: Row) => sum + Math.abs(amount(r.total)), 0)));
    const tax = fullyRefunded ? 0 : Math.max(0, unallocatedRefund
      ? amount(li.total_tax) * remainingRatio
      : amount(li.total_tax) - lineRefunds.reduce((sum: number, r: Row) => sum + Math.abs(amount(r.total_tax)), 0));
    return {
      title: String(li.name || ''), quantity, price: quantity > 0 ? (netRevenue + tax) / quantity : 0,
      sku: String(li.sku || ''), productId: String(li.product_id || ''), netRevenue,
    };
  });
  const tags = meta(order, '_shopify_order_tags') || meta(order, '_shopify_tags') || meta(order, 'tags') || '';
  return {
    id: String(order.id),
    orderNumber: String(meta(order, '_shopify_order_number') || order.number || order.id).replace(/^#/, ''),
    createdAt: isoDate(order.date_created_gmt),
    processedAt: isoDate(order.date_paid_gmt || order.date_created_gmt),
    totalPrice, totalTax, currency: String(order.currency || 'EUR'),
    customerName: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim() || order.billing?.company || 'Guest',
    customerEmail: String(order.billing?.email || '').trim().toLowerCase(),
    itemCount: lineItems.reduce((sum: number, li: Row) => sum + li.quantity, 0),
    paymentMethod: normalizeXShopPayment(order.payment_method || order.payment_method_title),
    lineItems,
    financialStatus: fullyRefunded ? 'refunded' : refunded > 0 ? 'partially_refunded' : 'paid',
    fulfillmentStatus: order.status === 'completed' ? 'fulfilled' : 'unfulfilled',
    sourceName: String(order.created_via || 'woocommerce'),
    tags: Array.isArray(tags) ? tags.join(', ') : String(tags),
  };
}

export function mapXShopProduct(product: Row, variations: Row[] = []): MerchProduct {
  const variants = (variations.length ? variations : [product]).map(v => ({
    id: String(v.id), title: (v.attributes || []).map((a: Row) => a.option).filter(Boolean).join(' / ') || 'Default',
    price: amount(v.price), inventoryQuantity: v.stock_quantity === null ? 0 : amount(v.stock_quantity),
    inventoryTracked: v.stock_quantity !== null && v.stock_quantity !== undefined,
    sku: String(v.sku || ''),
  }));
  return {
    id: String(product.id), title: String(product.name || ''),
    productType: (product.categories || []).map((c: Row) => c.name).join(', '),
    vendor: (product.brands || []).map((b: Row) => b.name).join(', ') || String(meta(product, '_shopify_vendor') || ''),
    status: product.status === 'publish' ? 'active' : product.status === 'draft' ? 'draft' : 'archived',
    totalInventory: variants.reduce((sum, v) => sum + v.inventoryQuantity, 0),
    variants, images: (product.images || []).map((i: Row) => ({ src: String(i.src) })),
  };
}

export function mapXShopCustomers(rows: Row[], orders: MerchOrder[]): MerchCustomer[] {
  const customers = new Map<string, MerchCustomer>();
  for (const row of rows) {
    const email = String(row.email || '').trim().toLowerCase();
    if (!email) continue;
    customers.set(email, {
      id: String(row.id), email, firstName: row.first_name || '', lastName: row.last_name || '',
      ordersCount: 0, totalSpent: 0, createdAt: isoDate(row.date_created_gmt), tags: [],
    });
  }
  for (const order of orders) {
    if (!order.customerEmail || order.financialStatus === 'refunded') continue;
    let customer = customers.get(order.customerEmail);
    if (!customer) {
      const [firstName, ...rest] = order.customerName.split(' ');
      customer = { id: `guest-${order.id}`, email: order.customerEmail, firstName, lastName: rest.join(' '),
        ordersCount: 0, totalSpent: 0, createdAt: order.createdAt, tags: [] };
      customers.set(order.customerEmail, customer);
    }
    customer.ordersCount++;
    customer.totalSpent = money(customer.totalSpent + order.totalPrice - order.totalTax);
    if (order.createdAt < customer.createdAt) customer.createdAt = order.createdAt;
  }
  return [...customers.values()];
}
