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
