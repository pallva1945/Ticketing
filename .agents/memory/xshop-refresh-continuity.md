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
