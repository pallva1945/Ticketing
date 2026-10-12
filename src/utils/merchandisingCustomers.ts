import { isMerchSale, type MerchCustomer, type MerchOrder } from '../types/merchandising';

export const normalizeMerchEmail = (email: string) => email.trim().toLowerCase();

// A missing email is not evidence that two orders belong to the same person.
export const merchCustomerKey = (order: Pick<MerchOrder, 'id' | 'customerEmail'>) => {
  const email = normalizeMerchEmail(order.customerEmail);
  return email ? `email:${email}` : `guest:${order.id}`;
};

export function buildMerchCustomers(rows: MerchCustomer[], orders: MerchOrder[]): MerchCustomer[] {
  const customers = new Map<string, MerchCustomer>();
  const add = (id: string, row: MerchCustomer) => {
    const existing = customers.get(id);
    const aliases = [...(row.nameAliases || []), `${row.firstName} ${row.lastName}`.trim()].filter(Boolean);
    if (!existing) {
      customers.set(id, { ...row, id, email: normalizeMerchEmail(row.email),
        ordersCount: 0, totalSpent: 0, tags: [...new Set(row.tags)], nameAliases: [...new Set(aliases)] });
    } else {
      existing.nameAliases = [...new Set([...(existing.nameAliases || []), ...aliases])];
      existing.tags = [...new Set([...existing.tags, ...row.tags])];
      if (!existing.firstName && !existing.lastName) {
        existing.firstName = row.firstName;
        existing.lastName = row.lastName;
      }
      if (row.createdAt && (!existing.createdAt || row.createdAt < existing.createdAt)) existing.createdAt = row.createdAt;
    }
    return customers.get(id)!;
  };
  for (const row of rows) {
    const email = normalizeMerchEmail(row.email);
    // Anonymous snapshot rows cannot be safely matched to orders.
    if (email) add(`email:${email}`, row);
  }
  for (const order of orders) {
    const [firstName = '', ...rest] = order.customerName.trim().split(/\s+/);
    const customer = add(merchCustomerKey(order), {
      id: '', email: order.customerEmail, firstName, lastName: rest.join(' '),
      ordersCount: 0, totalSpent: 0, createdAt: order.createdAt, tags: [],
    });
    if (isMerchSale(order)) {
      customer.ordersCount++;
      customer.totalSpent += order.totalPrice - order.totalTax;
    }
  }
  return [...customers.values()].map(customer => ({
    ...customer, totalSpent: Math.round((customer.totalSpent + Number.EPSILON) * 100) / 100,
  }));
}
