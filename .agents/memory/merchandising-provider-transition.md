---
name: Merchandising provider transition
description: The user reports moving merchandise sales to XShop from the previous Shopify system.
---

The user reports that merchandise sales have moved to XShop and wants the dashboard's sales integration migrated from the previous Shopify source.

**Why:** The user stated the commerce platform had changed and that they have XShop API credentials. This is a business-source change, not a request to build a new storefront or checkout.

**How to apply:** Confirm the exact XShop provider and its documented API before implementing authentication or sales mapping. Treat this as sales analytics integration rather than selecting a replacement payment provider. Request credentials only through the secure secrets flow.

The user believes the store migration is already complete and historical sales are also in XShop. The requested work is to change this dashboard's source, not to migrate the store again.

**Why:** The user corrected the proposed approach of keeping a separate Shopify history alongside XShop; combining both may duplicate the same orders.

**How to apply:** Verify the historical coverage available from XShop and use it as the intended unified sales source. Do not automatically merge Shopify orders with XShop orders. If historical coverage proves incomplete, explain the evidence before introducing a second source.

“XShop” is the user's name for the replacement store, whose public platform is WordPress/WooCommerce.

**Why:** Investigating the user-supplied store revealed WooCommerce's current orders API. Searching only for a separate vendor called XShop did not identify the actual integration.

**How to apply:** Use WooCommerce documentation and read-only consumer-key authentication for this sales connection, while preserving the user's XShop terminology where appropriate. Do not request a WordPress login password for API access.

Imported orders can have a newer WooCommerce creation date than their original sale date. Do not infer historical coverage from the oldest creation date alone.

**Why:** A creation-date lookup suggested history started in October 2025, but the complete snapshot's original payment dates confirmed sales from November 2023. Treating the import timestamp as the sale date would move historical revenue into the wrong seasons.

**How to apply:** Use original payment dates for revenue-season attribution when available, with Rome timezone boundaries, and verify the date span across the complete collection. Keep record-creation timestamps distinct from original sale timestamps.

An older complete merchandising snapshot is acceptable after a restart or during refresh, provided its original date and refresh status remain visible. Failed refreshes must not remove that usable copy.

**Why:** The user explicitly requested faster reopening after restart using a private saved copy, rather than waiting for every resource to download again.

**How to apply:** Preserve stale-while-revalidate behavior even for manual refresh. Do not claim an older copy is current, or introduce partial collections to make cold startup appear faster.

Verify live XShop access separately in preview and production; a working dashboard backed by a saved snapshot does not prove the provider refresh works.

**Why:** The published server received HTML instead of API JSON while a direct preview-side orders request succeeded. The published bundle also lacked the newer saved-snapshot behavior, despite that behavior working in preview.

**How to apply:** Check deployment logs and the actual published version before attributing the failure to credentials or the browser. Distinguish a usable saved snapshot from successful live refresh; do not promise that republishing alone removes a provider-side block.
