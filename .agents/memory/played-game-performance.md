---
name: Played-game performance
description: Business requirement separating advance game sales from completed-game performance.
---

Games are uploaded in advance when they go on sale. In Ticketing, GameDay, and Executive Overview, upcoming games must not affect performance averages, trends, or similar completed-game measures. They must remain accessible when explicitly selected to inspect sales progress.

**Why:** The user explained that uploading upcoming games currently distorts the averages; a game being available for sale does not mean it has happened.

**How to apply:** Separate access to all uploaded fixtures from eligibility for completed-game performance. Exclude upcoming games from both the totals feeding these measures and their denominators, without deleting their sales data. The precise completion cutoff and treatment of advance-sales totals still need agreement; do not treat a proposed cutoff as an approved business rule.