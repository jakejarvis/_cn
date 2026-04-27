---
name: shadcn-registry
description: Add or adapt installable shadcn registry items in _cn template repos.
---

# Shadcn Registry

Use this skill for installable registry items: UI components, blocks, hooks, helpers, pages, files, previews, usage docs, and registry dependency metadata. Local `AGENTS.md` and `README.md` override this file.

## Workflow

1. Inspect the local repo instructions first.
2. Put published item source under `registry/items/**`. Do not put installable item source under `src/components/ui`; that folder is only for the docs app shell.
3. For new items, scaffold before editing:

```sh
bun --bun ./scripts/new.ts --type registry:ui --name example-card --description "A compact card component."
```

Use `--target` for `registry:page` and `registry:file`; use `--file-extension` for non-`ts` file items.

## Type Map

| User intent               | Type                 | Folder                              |
| ------------------------- | -------------------- | ----------------------------------- |
| shadcn-style UI component | `registry:ui`        | `registry/items/components/<name>/` |
| non-UI component          | `registry:component` | `registry/items/components/<name>/` |
| composed UI pattern       | `registry:block`     | `registry/items/blocks/<name>/`     |
| React hook                | `registry:hook`      | `registry/items/hooks/<name>/`      |
| helper module             | `registry:lib`       | `registry/items/lib/<name>/`        |
| app page                  | `registry:page`      | `registry/items/pages/<name>/`      |
| explicit target file      | `registry:file`      | `registry/items/files/<name>/`      |

Use kebab-case folder and file names.

## `_registry.mdx`

Each item uses `_registry.mdx` for YAML frontmatter, optional public MDX Usage, and a named `Preview` export. Never list `_registry.mdx` in `files`.

Required frontmatter:

```yaml
---
name: example-card
type: registry:ui
title: Example Card
description: A compact card component.
---
```

Dependency fields:

- `registryDependencies`: shadcn primitive names such as `button`, `card`, `badge`, `dialog`, or `input`.
- `localRegistryDependencies`: other local registry item names.
- `files`: required for hooks, libs, blocks, pages, target paths, and multi-file items. One-file `registry:ui` items may omit it only when the published source is `<item-name>.tsx` in the item folder.

Minimal usage and preview:

````mdx
import { ExampleCard } from "./example-card";

```tsx
import { ExampleCard } from "@/components/ui/example-card";
```

export function Preview() {
  return <ExampleCard />;
}
````

Keep previews client-safe: static data, local state, and events are fine; avoid network calls, auth, server functions, env reads, and app-only providers.

## Adaptation Rules

- Extract only the reusable unit into the scaffolded item folder.
- Replace app data access with props, sample data, or small exported fixtures.
- Remove dependencies on app routing, auth, database clients, analytics, env vars, and server-only helpers unless the item intentionally installs those integrations.
- Preserve visual behavior unless the user asks for a redesign.
- Keep relative imports inside the item folder relative.
- Publish shared helpers as separate `registry:lib` files only when that improves install clarity.

## Verification

- Run `vp check --fix <touched-files>`.
- Run `bun --bun ./scripts/doctor.ts` after registry item changes when Bun is available.
- Run focused tests when catalog, JSON, source loading, or docs rendering changed.
- Run `vp build` before handoff when docs, routes, registry JSON, catalog loading, or source loading changed.
