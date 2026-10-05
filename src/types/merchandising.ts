export interface MerchOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  processedAt: string;
  totalPrice: number;
  totalTax: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  paymentMethod: string;
  lineItems: MerchLineItem[];
  financialStatus: string;
  fulfillmentStatus: string;
  sourceName: string;
  tags: string;
}

export interface MerchLineItem {
  title: string;
  quantity: number;
  price: number;
  sku: string;
  productId: string;
  netRevenue?: number;
}

export interface MerchProduct {
  id: string;
  title: string;
  productType: string;
  vendor: string;
  status: string;
  totalInventory: number;
  variants: {
    id: string;
    title: string;
    price: number;
    inventoryQuantity: number;
    inventoryTracked?: boolean;
    sku: string;
  }[];
  images: { src: string }[];
}

export interface MerchCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
  tags: string[];
}

export interface MerchandisingData {
  orders: MerchOrder[];
  products: MerchProduct[];
  customers: MerchCustomer[];
  lastUpdated: string;
  source: 'XShop';
  complete: true;
  sourceOrderCount: number;
  excludedOrderCount: number;
  snapshotStatus?: MerchSnapshotStatus;
}

export interface MerchSnapshotStatus {
  stale: boolean;
  restored: boolean;
  refreshing: boolean;
  refreshError: string | null;
  persistenceError: string | null;
}

export function getMerchSeason(dateStr: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Rome', year: 'numeric', month: 'numeric',
  }).formatToParts(new Date(dateStr));
  let year = Number(parts.find(p => p.type === 'year')?.value);
  if (Number(parts.find(p => p.type === 'month')?.value) < 7) year--;
  return `${String(year).slice(-2)}/${String(year + 1).slice(-2)}`;
}

export function isMerchSale(order: MerchOrder): boolean {
  return order.financialStatus !== 'refunded'
    && !(order.sourceName === 'shopify_draft_order' && order.totalPrice === 0);
}

export function isMerchGiveaway(order: MerchOrder): boolean {
  return isMerchSale(order) && order.totalPrice === 0 && order.itemCount > 0;
}

export function merchLineNetRevenue(order: MerchOrder, item: MerchLineItem): number {
  if (item.netRevenue !== undefined) return item.netRevenue;
  const taxRate = order.totalPrice > 0 ? order.totalTax / order.totalPrice : 0;
  return item.price * item.quantity * (1 - taxRate);
}
