# \_cn

<p align="center"><a href="https://underscore-cn.vercel.app"><img width="2178" height="1448" alt="Screenshot 2026-04-16 at 1 12 48 PM" src="https://github.com/user-attachments/assets/e5fffac0-1a09-4e1d-b604-10752de7320c" /></a></p>

An intentionally minimal [TanStack Start](https://tanstack.com/start/latest) + [Vite+](https://viteplus.dev/) starter template for publishing a [shadcn-compatible registry](https://ui.shadcn.com/docs/registry) without writing the documentation site and registry plumbing from scratch.

The scaffold contains a typed registry authoring layer, authored docs, live preview pages, syntax-highlighted source snippets, schema validation, package-manager install commands, and TanStack Start server routes. [See a demo here.](https://ui.jarv.is)

> [!NOTE]
> `_cn` is pronounced "underscore-cn".

## Quick Start

```bash
vp install
vp dev
```

Open the local URL from Vite+ and browse the starter docs, component, block, and utility pages.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjakejarvis%2F_cn&project-name=my-registry&repository-name=my-registry&demo-title=_cn%20Registry&demo-url=https%3A%2F%2Funderscore-cn.vercel.app)

## Build

```bash
vp check
vp build
```

Registry tests live under `src/lib/registry/*.test.ts` and `src/components/docs/*.test.ts`.

## Configure The Registry

Edit `src/lib/site-config.ts`.

```ts
export const siteConfig = {
  name: "_cn",
  registryName: "_cn",
  namespace: "@_cn",
  description: "Installable components for your project.",
  homepage: "https://underscore-cn.vercel.app",
  repositoryUrl: "https://github.com/jakejarvis/_cn",
  registry: {
    canonicalBasePath: "",
    indexPath: "/registry.json",
    itemPathPattern: "/{name}.json",
    aliasBasePaths: ["/r"],
  },
} as const;
```

Set `homepage` before deploying. Install commands and local registry dependency URLs are built from this value.

## Registry Endpoints

The public registry is flat by default:

- `/registry.json` serves the registry index.
- `/<name>.json` serves an item JSON file.
- `/r/registry.json` and `/r/<name>.json` remain aliases.

This matches the public shadcn registry shape while keeping the old `/r` route family available.

Install command URLs are generated from `siteConfig.registry.canonicalBasePath` and
`siteConfig.registry.itemPathPattern`. Keep the default root-flat shape for public registry
submission, or point commands at an alias path if you deliberately want that policy.

## Author Docs

Create public documentation pages under `registry/docs/`.

```text
registry/docs/
  index.mdx
  installation.mdx
  registry.mdx
```

Docs render under `/docs`: `registry/docs/index.mdx` becomes `/docs`, and
`registry/docs/installation.mdx` becomes `/docs/installation`. Keep docs files directly under
`registry/docs` for now; nested docs pages are not supported yet.

Docs files support optional YAML frontmatter:

```mdx
---
title: Installation
description: Install and run this registry.
order: 1
group: Getting Started
---

# Installation

Use Markdown or MDX with the built-in docs components.
```

Use `registry/docs/*` for documentation only. Installable registry item source must stay under
`registry/items/**`.

## Add A Registry Item

Create a folder under `registry/items/<section>/<item-name>/`.

```text
registry/items/components/example-card/
  _registry.mdx
  example-card.tsx
```

Keep item source under `registry/items`. The Vite `import.meta.glob` paths are intentionally static.

Write metadata, usage docs, and the preview together in `_registry.mdx`.

~~~mdx
---
name: example-card
type: registry:ui
title: Example Card
description: A compact card component.
registryDependencies:
  - card
localRegistryDependencies:
  - other-local-item
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
~~~

For a one-file component, the catalog infers the published file path from the item root and `name`. List `files` explicitly in frontmatter for hooks, libs, blocks, pages, target paths, or any item with multiple published files. Do not publish `_registry.mdx` or other authoring-only files.

The MDX body renders as the optional Usage section on the docs page. Fenced code blocks are syntax highlighted and keep the docs site's copy button. The `Preview` export is compiled as a client-only virtual module, so hooks and event handlers are fine there, but server-only logic should stay out of previews. Use `localRegistryDependencies` for dependencies on other local registry items; they are converted into canonical registry URLs in the public JSON.

## Starter Content

The template ships three plain examples:

- `example-card`: a `registry:ui` item with shadcn dependencies.
- `use-copy-to-clipboard`: a `registry:hook` item that publishes a non-component file.
- `stats-panel`: a multi-file `registry:block` item that uses a local registry dependency.
- `registry/docs`: starter public docs for installation, theming, CLI, registry authoring, and changelog notes.

Replace them with your own registry items before publishing.

The docs site renders non-empty `Components`, `Blocks`, and `Utilities` sections. Utility items
cover `registry:hook` and `registry:lib` entries so non-component registry items remain
discoverable before installation.

## Checklist

- [ ] Choose a registry name, namespace, domain, and repository URL.
- [ ] Update or replace the starter docs under `registry/docs`.
- [ ] Replace the starter registry items.
- [ ] Verify `/registry.json` and at least one `/<name>.json` item URL.
- [ ] Update `package.json` metadata, `README.md` details, `LICENSE` owner, etc.
- [ ] Run `vp check` and `vp build`.
- [ ] Deploy and test install commands with npm, pnpm, yarn, and bun.
- [ ] Optionally submit your registry to shadcn's [official directory](https://ui.shadcn.com/docs/directory).

## Compatibility Notes

The registry JSON uses shadcn schemas directly from [`shadcn/schema`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/schema.ts). Public item files include file contents in each item JSON response, and local registry dependencies should use `localRegistryDependencies` in `_registry.mdx` frontmatter so generated URLs follow `siteConfig.homepage`.

The docs site uses the local shadcn UI configuration in `components.json`; that styling is for this app shell and does **not** define the identity of published registry items.

## License

[MIT](LICENSE)
