---
name: Comparison navigation consistency
description: Coaches need consistent terminology, comparison logic, and coordinated changes in Ticketing and GameDay.
---

Keep Ticketing and GameDay comparisons consistent in terminology, selected fixture data, comparison logic, and presentation, not merely in tab appearance. Take Ticketing as the reference. Apply comparison changes to both modules unless the user explicitly requests a module-specific exception; their underlying revenue streams remain domain-specific.

**Why:** The user explicitly said identical tabs are easier for coaches to understand and use, then clarified that terminology and compared data must also match and future changes must apply to both unless specifically excepted.

**How to apply:** When changing comparison modes, selection rules, or presentation, implement the same behavior in both modules. Differences in revenue metrics do not justify different fixture cohorts, mode meanings, names, or ordering.

Approved comparison definitions:
- YTD defaults to the latest season and all eligible played fixtures, but the user approved selecting a reference season and a cutoff home-game week in both modules.
- YTD by week matches the selected reference's chronological home-game prefix (W1, W2, etc.) with the same positions in the displayed seasons.
- YTD by opponent matches the opponents in that reference prefix with those opponents in each other season. An absent opponent is omitted, not assigned a zero or included in the averaging denominator. The reference season itself stays bounded by its cutoff.
- Custom uses freely chosen A/B fixture sets with the same chart information as the preset tabs.
- Multiple selected games use per-game averages for revenue and volume; yield, €/person, and percentages retain their aggregate ratio definitions.

**Why:** The user approved these definitions specifically to make unequal match selections comparable and to distinguish calendar progress from opponent mix.

**How to apply:** Keep selected fixture counts and identities visible, preserve scheduled historical fixtures with missing financial data rather than shifting week positions, and exclude future matches from played-YTD references. Display-season filters must not alter the reference or cutoff. Screen and PDF must use the same cohorts and metric definitions.