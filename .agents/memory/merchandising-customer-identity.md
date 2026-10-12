---
name: Merchandising customer identity
description: Business identity rules for merging buyers and handling unidentified purchases.
---

Different billing names must not create separate buyers when they share the same email. Match emails without surrounding whitespace or case differences; do not rewrite provider-specific aliases.

**Why:** The user explicitly requested a single buyer per email even when names differ.

**How to apply:** Keep identity matching consistent between customer lists, rankings, search and purchase details. Retain alternate names for searching the unified buyer.

Purchases without an email must not be attributed collectively to the first named guest, or merged by name alone.

**Why:** The dashboard incorrectly attributed the total of unrelated unidentified purchases to one buyer, producing an inflated spending figure and an unopenable detail view. A shared missing identifier is not evidence of a shared person.

**How to apply:** Preserve separate identifiable purchase records until a trustworthy shared identity is available. Do not invent emails, modify store accounts, or alter order amounts to resolve analytics grouping.
