---
name: XShop refresh continuity
description: Autoscale constraints and verification boundaries for complete merchandising refreshes.
---

Do not rely solely on background-only work to finish a complete XShop refresh on the published Autoscale deployment. Background pre-warming is best effort; preserve fast ordinary dashboard reads.

**Why:** Official Replit guidance says Autoscale can scale to zero without active HTTP requests and is not intended for independent long-running background jobs. A complete XShop download needs more than connectivity checks: refund details and product variations must also finish. Preview successfully downloaded a complete snapshot while the published instance still reported an older failed refresh; these are separate observations, not proof of the same root cause.

**How to apply:** Keep explicit refresh and progress-poll requests active for bounded intervals, share a single download, and preserve the last validated complete copy until the replacement finishes. Retry transient transport failures, drain outstanding parallel reads on failure, and expose only fixed safe diagnostic reasons—not provider bodies, URLs or credentials.

Do not describe a preview fix as already applied to production, or browser-only authentication fixtures as real signed-in API verification.

**Why:** Published code only changes after the user republishes. Simulated authentication can validate interface behavior but cannot prove a real session or production refresh works.

**How to apply:** State which environment and layer were verified; confirm a fresh complete live snapshot before claiming the published refresh is resolved.

## Hosting bot challenges

The shop's hosting protection can answer WooCommerce API calls with HTTP 202 and an HTML JavaScript challenge, rather than JSON. This is distinct from API credential denial and from Autoscale interruptions.

**Why:** Both preview and published refreshes failed after earlier complete downloads; a direct read-only probe confirmed the HTML challenge on all three primary API resources.

**How to apply:** Preserve the last complete snapshot, identify the protection block explicitly, and avoid aggressive automatic retries. Ask the shop/hosting administrator to allow authenticated WooCommerce API traffic while retaining API authentication and other store protections. Do not treat the challenge as financial data or attempt to circumvent it.


## Multi-worker coordination safety

Do not fall back to uncoordinated provider downloads when shared coordination storage is unavailable. An expired worker must be unable to publish or clear a successor's lease.

**Why:** Published servers can run concurrently or pause independently. A process-local promise cannot prevent duplicate downloads, and checking lease ownership separately from snapshot publication leaves a race where a resumed old worker can overwrite newer data.

**How to apply:** Keep ownership checks and snapshot publication in one atomic persistence operation. Preserve last complete data on coordination failure; allow recovery only through a newly acquired expiring lease. Any future separation of lease metadata and payload must retain this fencing guarantee.
## Interpreting refresh history

An attempt with no recorded finish is not proof of a timeout or an interrupted download. Report it as unfinished, not as a fabricated provider failure.

**Why:** Another server instance may still be downloading, or a completed download may have been unable to persist its result. Durable diagnostic records must not imply more certainty than they provide.

**How to apply:** Distinguish fixed provider failures, snapshot persistence failures, history-storage unavailability, and unfinished records. Never infer a specific cause solely from a restart or elapsed time.
