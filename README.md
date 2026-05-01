# \_cn

<p align="center"><a href="https://underscore-cn.vercel.app"><img width="2776" height="1596" alt="underscorecn" src="https://github.com/user-attachments/assets/04bbb481-9ca8-49c3-bc83-b7d9a72e4b61" /></a></p>

An intentionally minimal [TanStack Start](https://tanstack.com/start/latest) + [Vite+](https://viteplus.dev/) starter template for publishing a [shadcn-compatible registry](https://ui.shadcn.com/docs/registry) without writing the documentation site and registry plumbing from scratch.

The scaffold contains a typed registry authoring layer, authored docs, live preview pages, syntax-highlighted source snippets, schema validation, package-manager install commands, and TanStack Start server routes. [See a demo here.](https://ui.jarv.is)

> [!TIP]
> `_cn` is pronounced "underscore-cn".

## Quick Start

You can either [create a new repository](https://github.com/new?template_name=_cn&template_owner=jakejarvis) based on this template directly in your GitHub account/organization, or use a tool like [`degit`](https://github.com/Rich-Harris/degit) to scaffold a fresh repo locally with the latest _cn code.

```bash
npx degit jakejarvis/_cn

# or use the "Use this template" button and then clone:
git clone https://github.com/your-username/my-cn.git
```

Once cloned, ensure you have [Vite+](https://viteplus.dev/guide/) (`vp`) installed on your system; this will ensure all other requirements are taken care of for you.

```bash
# Install Vite+
curl -fsSL https://vite.plus | bash

# Setup and start local server
vp install
vp dev
```

Open the localhost URL from the Vite+ output and browse the starter docs, component, block, and utility pages. A good place to start customizing is the [`config.ts`](registry/config.ts) file.

## Agent Skill

This repository includes an installable Agent Skill for authoring `_cn` registry items. Install it into your harness from the upstream template using the [Skills CLI](https://skills.sh/):

```bash
npx skills add jakejarvis/_cn --skill shadcn-registry
```

After installing the skill, ask your agent for registry authoring work directly:

- "add a button component to the registry"
- "adapt this modal from my app to make it reusable via this shadcn registry"
- "add a reusable hook to the registry"
- "turn this dashboard section into a registry block"

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjakejarvis%2F_cn&project-name=my-registry&repository-name=my-registry&demo-title=_cn%20Registry&demo-url=https%3A%2F%2Funderscore-cn.vercel.app)

Above is a one-click button to fork the template and deploy it to Vercel as a platform-agnostic [Nitro server](https://nitro.build/).

You can just as easily use any other platform (Cloudflare Workers, Netlify, etc.) by following the [TanStack Start docs](https://tanstack.com/start/latest/docs/framework/react/guide/hosting#deployment) to make a few adjustments to your `vite.config.ts` file (agents are usually pretty good at this too).

## Usage

### Configuration

Edit `registry/config.ts`.

```ts
export const registryConfig = {
  name: "_cn",
  registryName: "_cn",
  namespace: "@_cn",
  description: "Installable components for your project.",
  homepage: "https://underscore-cn.vercel.app",
  repositoryUrl: "https://github.com/jakejarvis/_cn",
} as const;
```

Set `homepage` before deploying. Install commands and local registry dependency URLs are built from this value.

### Author Docs

Create public documentation pages under `registry/docs/`.

```text
registry/docs/
  index.mdx
  installation.mdx
  registry.mdx
```

Docs render under `/docs`: `registry/docs/index.mdx` becomes `/docs`, and `registry/docs/installation.mdx` becomes `/docs/installation`. Keep docs files directly under `registry/docs` for now; nested docs pages are not supported yet.

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

### Add A Registry Item

#### Automatic

Run `bun --bun ./scripts/new.ts` to interactively scaffold new registry items under `registry/items/**`.

It's always a good idea to also run `bun --bun ./scripts/doctor.ts` after making changes in the `registry` directory; this validates registry metadata and reports ignored or suspicious files within the directory.

#### Manual

Create a folder under `registry/items/<section>/<item-name>/`.

```text
registry/items/components/example-card/
  _registry.mdx
  example-card.tsx
```

Write metadata, usage docs, and the preview together in `_registry.mdx`.

````mdx
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
````

For a one-file component, the catalog infers the published file path from the item root and `name`. List `files` explicitly in frontmatter for hooks, libs, blocks, pages, target paths, or any item with multiple published files; file paths are relative to the item `_registry.mdx` file. Metadata-only styles, themes, fonts, bases, and universal items can omit `files`. Do not publish `_registry.mdx` or other authoring-only files.

The MDX body renders as the optional Usage section on the docs page. Fenced code blocks are syntax highlighted and keep the docs site's copy button. The optional `Preview` export is compiled as a client-only virtual module, so hooks and event handlers are fine there, but server-only logic should stay out of previews. Use `localRegistryDependencies` for dependencies on other local registry items; they are converted into canonical registry URLs in the public JSON.

## Server

The public registry index is available at both the root and `/r` paths, while installable item JSON lives under `/r`:

- `/registry.json` serves the registry index.
- `/r/registry.json` serves the same registry index.
- `/r/<name>.json` serves an item JSON file.
- `/llms.txt` and `/llms-full.txt` are generated from the same Markdown docs and registry item pages used by the site.

> [!TIP]
> _cn validates authored registry metadata against schemas directly from [`shadcn/schema`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/schema.ts) to ensure compatibility.

### Content Negotation

Human-facing registry URLs support the shadcn CLI's request headers. CLI requests with `Accept: application/vnd.shadcn.v1+json` or `User-Agent: shadcn` receive the shadcn-compliant JSON from the same URL as the human-readable docs page:

- `/registry` returns the registry index JSON.
- `/registry/<name>` and section item pages like `/components/<name>` return item JSON.

All pages also support Markdown content negotiation (inspired by [Fumadocs](https://www.fumadocs.dev/docs/headless/utils/negotiation)). AI clients that request `text/markdown`, `text/x-markdown`, or `text/plain` in the `Accept` header receive the Markdown version of the current page directly, while normal browser requests still receive HTML.

## Checklist

- [ ] Choose a registry name, namespace, domain, and repository URL in `registry/config.ts`.
- [ ] Update or replace the starter docs under `registry/docs`.
- [ ] Update or replace the starter registry items in `registry/items`; use `bun --bun ./scripts/new.ts` to generate new stubs.
- [ ] Run `bun --bun ./scripts/doctor.ts` to verify changes.
- [ ] Run `vp check` and `vp build`.
- [ ] Deploy!
- [ ] Test the install commands with npm, pnpm, yarn, and bun.
- [ ] Optionally submit your registry to shadcn's [official directory](https://ui.shadcn.com/docs/directory).

## Gotchas

> [!WARNING]
> The docs site uses the local shadcn UI configuration in [`components.json`](components.json); that styling is for this app shell and does **not** affect the published registry items in any way.

## License

[MIT](LICENSE)
