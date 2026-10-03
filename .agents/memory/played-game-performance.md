---
name: Played-game performance
description: Business requirement separating advance game sales from completed-game performance.
---

Games are uploaded in advance when they go on sale. In Ticketing, GameDay, and Executive Overview, upcoming games must not affect performance averages, trends, or similar completed-game measures. They must remain accessible when explicitly selected to inspect sales progress.

**Why:** The user explained that uploading upcoming games currently distorts the averages; a game being available for sale does not mean it has happened. They subsequently explicitly approved the separate Upcoming / On sale inspection view. Retain that separation when simplifying the sales presentation.

**How to apply:** Separate access to all uploaded fixtures from eligibility for completed-game performance. Exclude upcoming games from both the totals feeding these measures and their denominators, without deleting their sales data. The user approved the next-day cutoff in Europe/Rome: a fixture dated today remains outside performance until the next calendar day. Preserve advance sales in a separate, clearly labelled inspection view. Apply the same cutoff to historical comparisons, forecasts and AI context.

For the Upcoming / On sale inspection view, display numbers with zero decimal places and thousands separators.

**Why:** The user explicitly corrected the use of two decimal places and requested rounding to whole numbers.

**How to apply:** Keep this presentation rule when modifying the panel, including revenue, yield, and Load Factor. Round only displayed values; retain full precision in calculations and source data. The user explicitly requested the label “Load Factor” without a percent sign, since the displayed value already includes %.