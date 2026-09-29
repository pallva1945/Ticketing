---
name: Post-merge dependency safety
description: Why clean reinstalls are unsafe with the current dependency tree.
---

Do not make a clean dependency install an unconditional post-merge step until the locked dependencies can pass Replit's package firewall. Prefer checking the existing installation and failing explicitly when dependencies need repair, rather than deleting working modules first.

**Why:** A clean install removes existing modules before downloading replacements. Multiple unrelated transitive downloads were blocked by the security policy, so a failed install left the development workspace without its prior dependency tree. Do not bypass the firewall.

**How to apply:** Validate a proposed dependency update against the package firewall before making clean installation mandatory; stop and seek a safe recovery path after several distinct blocked packages instead of chasing them indefinitely.