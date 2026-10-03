---
name: CRM fixture scope
description: Repeated opponents represent distinct encounters, and ticketing season belongs to the encounter.
---

Treat recurring opponent names as different fixtures when their season or match date differs. CRM season filters must apply to match season, not the date when a ticket was bought.

**Why:** The user identified Bologna and Trieste from different seasons being added together as though each opponent represented one match, then confirmed the season filter and fixture separation worked well. Purchases can precede the season they cover, especially subscriptions.

**How to apply:** Preserve fixture identity when simplifying data or aggregating customer, corporate, and seat histories. Show dates and seasons so users can distinguish repeated opponents, including when viewing all seasons.