# Item Authoring

Use these rules when creating or changing `_cn` registry items.

## Item Types

| User intent                                | Item type            | Folder                                    |
| ------------------------------------------ | -------------------- | ----------------------------------------- |
| Reusable shadcn-style UI component         | `registry:ui`        | `registry/items/components/<kebab-name>/` |
| Component not intended for `components/ui` | `registry:component` | `registry/items/components/<kebab-name>/` |
| Larger composed UI pattern                 | `registry:block`     | `registry/items/blocks/<kebab-name>/`     |
| React hook                                 | `registry:hook`      | `registry/items/hooks/<kebab-name>/`      |
| Utility/helper module                      | `registry:lib`       | `registry/items/lib/<kebab-name>/`        |
| App page                                   | `registry:page`      | `registry/items/pages/<kebab-name>/`      |
| Other file                                 | `registry:file`      | `registry/items/files/<kebab-name>/`      |

Use kebab-case folder and file names. Keep `_registry.mdx` private to authoring; never list it in `files`.

## Scaffold New Items

For new items, create the starter files with the non-interactive scaffold command before editing source, metadata, preview, and usage docs:

```sh
bun --bun ./scripts/new.ts --type registry:ui --name example-card --description "A compact card component."
```

Use these flags:

- `--type`: one of the item types above. Defaults to `registry:ui` when omitted.
- `--name`: required kebab-case item name.
- `--title`: optional public title. Defaults from `--name`.
- `--description`: required public description.
- `--target`: required for `registry:page` and `registry:file`.
- `--file-extension`: only for `registry:file`; defaults to `ts`.

Examples:

```sh
bun --bun ./scripts/new.ts --type registry:block --name stats-panel --description "A metrics panel with reusable sample data."
bun --bun ./scripts/new.ts --type registry:page --name dashboard-page --description "A starter dashboard page." --target app/dashboard/page.tsx
bun --bun ./scripts/new.ts --type registry:file --name chart-theme --description "Shared chart theme tokens." --target styles/chart-theme.css --file-extension css
```

Run `bun --bun ./scripts/new.ts` with no flags only when an interactive prompt is appropriate.

## Frontmatter

Every `_registry.mdx` needs:

```yaml
---
name: item-name
type: registry:ui
title: Item Name
description: A short public description.
---
```

Optional fields usually needed:

- `registryDependencies`: shadcn item names such as `button`, `card`, `badge`, `dialog`, or `input`.
- `localRegistryDependencies`: local registry item names. The template converts them into canonical registry URLs.
- `files`: required for hooks, libs, blocks, pages, target paths, and any multi-file item.

Do not put documentation-only files from `registry/docs/**` in item `files`.

## Usage Body And Preview

After frontmatter, import the item source, write optional public usage docs, then export `Preview`.

````mdx
---
name: example-card
type: registry:ui
title: Example Card
description: A compact card component.
registryDependencies:
  - card
---

import { ExampleCard } from "./example-card";

Use the component anywhere you need a compact content summary.

```tsx
import { ExampleCard } from "@/components/ui/example-card";

export function Example() {
  return <ExampleCard />;
}
```

export function Preview() {
  return <ExampleCard />;
}
````

Keep preview code client-safe. Hooks, events, and local state are fine; server-only logic is not.

## Templates

### `registry:ui`

Use this for components that install into `components/ui`.

```text
registry/items/components/button-demo/
  _registry.mdx
  button-demo.tsx
```

````mdx
---
name: button-demo
type: registry:ui
title: Button Demo
description: A button variant for common actions.
registryDependencies:
  - button
---

import { ButtonDemo } from "./button-demo";

```tsx
import { ButtonDemo } from "@/components/ui/button-demo";
```

export function Preview() {
  return <ButtonDemo />;
}
````

### `registry:block`

Blocks should list every published file explicitly.

```text
registry/items/blocks/stats-panel/
  _registry.mdx
  stats-panel.tsx
  stats-data.ts
```

```yaml
---
name: stats-panel
type: registry:block
title: Stats Panel
description: A metrics panel with reusable sample data.
registryDependencies:
  - badge
  - card
localRegistryDependencies:
  - use-copy-to-clipboard
files:
  - path: registry/items/blocks/stats-panel/stats-panel.tsx
    type: registry:block
  - path: registry/items/blocks/stats-panel/stats-data.ts
    type: registry:lib
---
```

### `registry:hook`

Hooks should list `files` explicitly and usually publish a `.ts` file.

```yaml
---
name: use-copy-to-clipboard
type: registry:hook
title: useCopyToClipboard
description: A hook for copying text to the clipboard.
files:
  - path: registry/items/hooks/use-copy-to-clipboard/use-copy-to-clipboard.ts
    type: registry:hook
---
```

### `registry:lib`

Use this for reusable helpers that are not React components or hooks.

```yaml
---
name: format-currency
type: registry:lib
title: Format Currency
description: A small helper for locale-aware currency formatting.
files:
  - path: registry/items/lib/format-currency/format-currency.ts
    type: registry:lib
---
```

### `registry:page`

Use this only when the registry item should install a route/page file. Always set `target`.

```yaml
---
name: dashboard-page
type: registry:page
title: Dashboard Page
description: A starter dashboard page.
files:
  - path: registry/items/pages/dashboard-page/page.tsx
    type: registry:page
    target: app/dashboard/page.tsx
---
```

### `registry:file`

Use this for supporting files that need an explicit install target.

```yaml
---
name: chart-theme
type: registry:file
title: Chart Theme
description: Shared chart theme tokens.
files:
  - path: registry/items/files/chart-theme/chart-theme.css
    type: registry:file
    target: styles/chart-theme.css
---
```

## Verification

After registry item changes:

- Run `vp check --fix <touched-files>`.
- Run focused tests when catalog, JSON, source loading, or docs rendering behavior changed.
- Run `vp build` before handoff when registry JSON, routes, docs, or source loading changed.
