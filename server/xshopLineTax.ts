type Row = Record<string, any>;
const amount = (value: unknown) => Number(value || 0);
const money = (value: number) => Math.round(value * 100) / 100;

/** Allocate the actual header VAT in cents, not an assumed fixed tax rate. */
export function allocateMoney(total: number, weights: number[]): number[] {
  const cents = Math.round(total * 100);
  const sum = weights.reduce((s, value) => s + value, 0);
  if (!sum) return weights.map(() => 0);
  const exact = weights.map(value => cents * value / sum);
  const parts = exact.map(Math.floor);
  const ranked = exact.map((value, index) => ({ index, remainder: value - parts[index] }))
    .sort((a, b) => b.remainder - a.remainder);
  const remaining = cents - parts.reduce((s, value) => s + value, 0);
  for (let i = 0; i < remaining; i++) parts[ranked[i].index]++;
  return parts.map(value => value / 100);
}

export function normalizeImportedLineTax(order: Row, refunds: Row[]) {
  const lines: Row[] = order.line_items || [];
  const shipping: Row[] = order.shipping_lines || [];
  const fees: Row[] = order.fee_lines || [];
  const all = [...lines, ...shipping, ...fees];
  const weights = all.map(row => amount(row.total));
  const components = weights.reduce((sum, value) => sum + value, 0);
  const gross = amount(order.total), tax = amount(order.total_tax);
  const eligible = order.created_via === 'shopify-import' && order.prices_include_tax === true
    && gross > 0 && tax > 0 && tax <= gross && weights.every(value => value >= 0)
    && all.every(row => amount(row.total_tax) === 0)
    && Math.abs(gross - components) <= 0.02;
  if (!eligible) return { order, refunds, allocated: false };
  const taxes = allocateMoney(tax, weights);
  let index = 0;
  const normalized = (rows: Row[]) => rows.map(row => {
    const totalTax = taxes[index++];
    return { ...row, total: money(amount(row.total) - totalTax), total_tax: totalTax };
  });
  const line_items = normalized(lines), shipping_lines = normalized(shipping), fee_lines = normalized(fees);
  const normalizedRefunds = refunds.map(refund => {
    // Never replace explicit refund taxes. Only gross imported details with missing taxes need allocation.
    const rows = [...(refund.line_items || []), ...(refund.shipping_lines || []), ...(refund.fee_lines || [])];
    if (!rows.length || rows.some(row => amount(row.total_tax) !== 0) || refund.tax_lines?.length) return refund;
    return {
      ...refund,
      line_items: (refund.line_items || []).map(refundLine),
      shipping_lines: (refund.shipping_lines || []).map(refundLine),
      fee_lines: (refund.fee_lines || []).map(refundLine),
    };
  });
  function refundLine(row: Row) {
    const refundTax = money(Math.abs(amount(row.total)) * tax / gross);
    return { ...row, total: -money(Math.abs(amount(row.total)) - refundTax), total_tax: -refundTax };
  }
  return {
    order: { ...order, line_items, shipping_lines, fee_lines,
      shipping_total: money(shipping_lines.reduce((sum, row) => sum + amount(row.total), 0)),
      shipping_tax: money(shipping_lines.reduce((sum, row) => sum + amount(row.total_tax), 0)) },
    refunds: normalizedRefunds, allocated: true,
  };
}

/** WooCommerce POS records some order discounts as negative fees, not discounted item totals. */
export function normalizeOrderDiscounts(order: Row) {
  const fees: Row[] = order.fee_lines || [];
  const negativeFees = fees.filter(row => amount(row.total) < 0);
  const lines: Row[] = order.line_items || [];
  const discount = -negativeFees.reduce((sum, row) => sum + amount(row.total), 0);
  const discountTax = -negativeFees.reduce((sum, row) => sum + amount(row.total_tax), 0);
  const weights = lines.map(row => amount(row.total));
  const taxes = lines.map(row => amount(row.total_tax));
  // Do not guess where an unrelated credit or a discount larger than the merchandise belongs.
  if (!discount || amount(order.shipping_total) !== 0 || weights.some(value => value < 0)
    || discount > weights.reduce((sum, value) => sum + value, 0)
    || discountTax > taxes.reduce((sum, value) => sum + value, 0)) {
    return { order, allocated: false };
  }
  const discounts = allocateMoney(discount, weights);
  const taxDiscounts = allocateMoney(discountTax, taxes);
  return {
    allocated: true,
    order: { ...order,
      fee_lines: fees.filter(row => amount(row.total) >= 0),
      line_items: lines.map((row, index) => ({ ...row,
        total: money(amount(row.total) - discounts[index]),
        total_tax: money(amount(row.total_tax) - taxDiscounts[index]),
      })),
    },
  };
}
