import type { MerchFamily, MerchOrder, MerchProduct } from '../types/merchandising';
import { isMerchSale, merchLineNetRevenue } from '../types/merchandising';

export const MERCH_FAMILIES: MerchFamily[] = [
  'Game Jerseys', 'Apparel', 'Accessories', 'Bundles', 'Experiences & Services', 'Unclassified',
];

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Collections and promotions are never used as product families. Ambiguous items stay explicit. */
export function classifyMerchFamily(title: string, categories: string[] = []): MerchFamily {
  const name = normalize(title);
  const types = categories.map(normalize);
  if (types.some(c => /^(experiences|birthday experience|coaches club|elite programs|servizio)$/.test(c))
    || /\b(experience|experiences|shootaround|program|bigliett|panorama lounge|coaches.? club)/.test(name)) {
    return 'Experiences & Services';
  }
  // A Father's Day collection tag on a single mug does not turn the mug into a bundle.
  if (/\b(pack|kit|bundle|set)\b/.test(name)) return 'Bundles';
  if (types.includes('game jersey') || /\b(canott\w*|jersey)\b/.test(name)
    || (/\basta\b/.test(name) && /\bmaglia\b/.test(name))) return 'Game Jerseys';
  if (types.some(c => /^(sciarpe|cappelli|portachiavi|zaini e borse)$/.test(c))
    || /\b(sciarp\w*|cappell\w*|cap|borracc\w*|tazz\w*|telo|asciugaman\w*|zain\w*|bors\w*|bag|tote|portachiav\w*|portafogl\w*|pallon\w*|pallin\w*|ball|canestro|lanyard|penna|libro|poster|magnet\w*|sticker|scud\w*|calzin\w*|sock\w*|braccial\w*)\b/.test(name)) {
    return 'Accessories';
  }
  if (types.some(c => /^(felpa|t-shirt|t-shirt fl|pantaloni e shorts)$/.test(c))
    || /\b(felp\w*|hoodie|polo|t[ -]?shirt|giacc\w*|jacket|panta\w*|short\w*|bermuda|costume|smanicat\w*|coprimaglia|tuta)\b/.test(name)) {
    return 'Apparel';
  }
  return 'Unclassified';
}

export function productFamily(product?: MerchProduct): MerchFamily {
  if (!product) return 'Unclassified';
  if (MERCH_FAMILIES.includes(product.productType as MerchFamily)) return product.productType as MerchFamily;
  return classifyMerchFamily(product.title, product.storeCategories || product.productType.split(',').map(c => c.trim()));
}

/** Scope analytics to matching item revenue, not the whole value of a mixed-family order. */
export function scopeMerchOrders(orders: MerchOrder[], products: MerchProduct[], family: MerchFamily | 'all'): MerchOrder[] {
  if (family === 'all') return orders;
  const catalog = new Map(products.map(product => [product.id, product]));
  return orders.flatMap(order => {
    const lineItems = order.lineItems.filter(item => productFamily(catalog.get(item.productId)) === family);
    const pending = family === 'Unclassified' ? order.unallocatedRevenue || 0 : 0;
    if (!lineItems.length && !pending) return [];
    const net = lineItems.reduce((sum, item) => sum + merchLineNetRevenue(order, item), pending);
    const tax = order.revenueAllocation === 'unreconciled'
      ? family === 'Unclassified' ? order.totalTax : 0
      : Math.min(order.totalTax, Math.max(0, lineItems.reduce((sum, item) =>
        sum + item.price * item.quantity - merchLineNetRevenue(order, item), 0)));
    return [{
      ...order, lineItems,
      itemCount: lineItems.reduce((sum, item) => sum + item.quantity, 0),
      totalTax: Math.round(tax * 100) / 100,
      totalPrice: Math.round((net + tax) * 100) / 100,
      shippingRevenue: 0, feeRevenue: 0, unallocatedRevenue: pending,
    }];
  });
}

export function buildMerchFamilyRevenue(orders: MerchOrder[], products: MerchProduct[]) {
  const catalog = new Map(products.map(p => [p.id, p]));
  const totals = new Map(MERCH_FAMILIES.map(family => [family, 0]));
  let shippingRevenue = 0, feeRevenue = 0, allocatedTaxOrders = 0, allocatedDiscountOrders = 0, unreconciledOrders = 0;
  for (const order of orders.filter(isMerchSale)) {
    shippingRevenue += order.shippingRevenue || 0;
    feeRevenue += order.feeRevenue || 0;
    if (order.revenueAllocation === 'order-vat') allocatedTaxOrders++;
    if (order.revenueAllocation === 'order-discount') allocatedDiscountOrders++;
    if (order.revenueAllocation === 'unreconciled') unreconciledOrders++;
    for (const item of order.lineItems) {
      const family = productFamily(catalog.get(item.productId));
      totals.set(family, totals.get(family)! + merchLineNetRevenue(order, item));
    }
    totals.set('Unclassified', totals.get('Unclassified')! + (order.unallocatedRevenue || 0));
  }
  const categories = [...totals].map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .filter(row => row.value > 0).sort((a, b) => b.value - a.value);
  return {
    categories, total: Math.round(categories.reduce((sum, row) => sum + row.value, 0) * 100) / 100,
    shippingRevenue: Math.round(shippingRevenue * 100) / 100,
    feeRevenue: Math.round(feeRevenue * 100) / 100,
    allocatedTaxOrders, allocatedDiscountOrders, unreconciledOrders,
  };
}
