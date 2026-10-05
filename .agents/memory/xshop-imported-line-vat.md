---
name: Imported XShop line VAT
description: Live imported-order evidence that WooCommerce line totals are not consistently tax-exclusive.
---

Do not assume every WooCommerce line total is tax-exclusive in this migrated store. Imported Shopify orders can contain gross line totals with zero line tax, while their order header has nonzero VAT.

**Why:** Read-only inspection of real imported orders found a no-shipping, no-fee, no-refund sale with a €249 line total and zero line tax, but an order total of €249 and header VAT of €44.90. Treating the line as net revenue overstates product/category revenue, even though the order-level net figure is correct. A broader season check also found line totals exceeding order-level net totals.

**How to apply:** Reconcile line revenue with order totals, actual VAT, shipping, fees, discounts and refunds before reporting category or product revenue. Do not apply a blanket 22% adjustment to all orders or infer that zero line tax proves a tax-free sale. Preserve the distinction between native and imported data, and flag unresolved allocations rather than inventing them.

The store's product categories mix product types with seasons, collections, promotions and services. Some products have only a collection/season category; original Shopify product-type metadata was not present in the inspected catalog.

**Why:** Live catalog examples placed hoodies, polos and T-shirts exclusively under “26/27”; anniversary collections contained towels, bundles and swimwear; uncategorized products included both merchandise and experiences.

**How to apply:** Do not infer a commercial product type from the first store category or concatenate categories into a financial classification. Agree on an exclusive analytics taxonomy with the user; keep collection/promotion dimensions separate and preserve an explicit unresolved category where classification is uncertain.
