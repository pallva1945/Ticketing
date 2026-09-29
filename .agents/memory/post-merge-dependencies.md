---
name: Post-merge dependency safety
description: Why clean reinstalls are unsafe with the current dependency tree.
---

Avoid unconditional clean dependency installs in post-merge setup. Use incremental installation with a lockfile that passes Replit's package firewall, then build; fail explicitly if installation or compilation fails. Keep development tooling compatible with the workspace's Node runtime.

**Why:** A clean install removes existing modules before downloading replacements. Multiple unrelated transitive downloads were blocked by the security policy, so a failed install left the development workspace without its prior dependency tree. The app only needed Firebase App and Firestore, while the all-in-one Firebase package also pulled an unused database client with a blocked transitive dependency. Do not bypass the firewall.

**How to apply:** Keep dependency manifests and lockfiles in sync. Prefer the required Firebase modules over the all-in-one wrapper unless new features need its other APIs; select compatible patched transitive versions within the parent dependency's supported range. Check the Node engine before upgrading development tools. Run the post-merge setup and inspect a fresh preview after dependency changes.