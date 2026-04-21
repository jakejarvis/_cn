<!-- intent-skills:start -->
# Skill mappings - when working in these areas, load the linked skill file into context.
skills:
  - task: "add or change pages in src/routes and navigation links"
    load: "node_modules/@tanstack/router-core/skills/router-core/SKILL.md"
  - task: "add route loaders, pending states, errors, or route-based data fetching"
    load: "node_modules/@tanstack/router-core/skills/router-core/data-loading/SKILL.md"
  - task: "add server functions for forms, mutations, or server-only logic"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/server-functions/SKILL.md"
  - task: "add API endpoints or server route handlers"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/server-routes/SKILL.md"
  - task: "change the TanStack Start, Vite, or Devtools setup"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/SKILL.md"
  - task: "work on Vite+ development workflow or CLI operations"
    load: "node_modules/vite-plus/skills/vite-plus/SKILL.md"
<!-- intent-skills:end -->

# Agent Instructions

## Package Manager

Use **Vite+**: `vp install`, `vp dev`, `vp build`, `vp test`

## File-Scoped Commands

| Task                | Command                            |
| ------------------- | ---------------------------------- |
| Check               | `vp check path/to/file.tsx`        |
| Check with auto-fix | `vp check --fix path/to/file.tsx`  |
| Test                | `vp test run path/to/file.test.ts` |

## Registry Requests

- Treat short prompts like "add a button component to the registry" as implementation requests.
- Default mappings:
  - component/ui: `registry:ui` in `registry/items/components/<kebab-name>/`
  - block: `registry:block` in `registry/items/blocks/<kebab-name>/`
  - hook: `registry:hook` in `registry/items/hooks/<kebab-name>/`
  - lib/helper: `registry:lib` in `registry/items/lib/<kebab-name>/`
- Use `registry:component` only when the item is not intended for `components/ui`.
- Put published registry source under `registry/items/**`, never under `src/components/ui`.
- `src/components/ui` is for the docs app shell shadcn components only.
- Put public documentation pages directly under `registry/docs/`; they render at `/docs`.
- `registry/docs/**` is documentation-only and must not be listed as item source.

## Registry Item Pattern

- Each item folder has `_registry.mdx` with YAML frontmatter metadata, an optional MDX Usage body, and a named `Preview` export.
- One-file `registry:ui` items can omit `files`; the catalog infers `<item-name>.tsx`.
- Hooks, libs, blocks, pages, target paths, and multi-file items must list `files` explicitly.
- Do not publish `_registry.mdx` or any file whose basename starts with `_`.
- The MDX body renders as the optional Usage section; fenced code blocks keep highlighting and copy buttons.
- The `Preview` export is compiled as a client-only virtual module; keep server-only logic out of previews.
- Use `localRegistryDependencies` in frontmatter for dependencies on other local registry items.
- Use shadcn item names like `"button"`, `"card"`, `"badge"` in `registryDependencies` for shadcn primitives.

## \_registry.mdx Template

````mdx
---
name: button-demo
type: registry:ui
title: Button Demo
description: A short public description.
registryDependencies:
  - button
---

import { ButtonDemo } from "./button-demo";

Use the component in any client or server component.

```tsx
import { ButtonDemo } from "@/components/ui/button-demo";

export function Example() {
  return <ButtonDemo />;
}
```

export function Preview() {
  return <ButtonDemo />;
}
````

## Key Conventions

- Routes: `src/routes/`; do not edit `src/routeTree.gen.ts` by hand.
- Registry site config: `registry/config.ts` controls public copy, links, registry name, namespace, homepage, and repository URL.
- Registry URL helpers and route path policy stay in `src/lib/site-config.ts`.
- Authored docs: direct `registry/docs/*.mdx` or `registry/docs/*.md` files with optional `title`, `description`, `order`, and `group` frontmatter. Nested docs pages are not supported yet.
- Registry catalog: `src/lib/registry/catalog.ts`; JSON output: `src/lib/registry/json.server.ts`.
- Registry JSON routes: `/registry.json` and `/r/registry.json` serve the index; item JSON routes live under `/r/<name>.json`.
- Docs sections: components and blocks plus utilities for `registry:hook` and `registry:lib`.
- Docs chrome: `src/components/docs/`; theme/CSS: `src/styles.css`.
- See `README.md` for the registry authoring workflow.

## Verification

- After registry edits, run `vp check --fix` on touched files.
- For route/docs changes, run `vp build` so `src/routeTree.gen.ts` updates.
- Build before handoff when registry JSON, routes, or source loading changed: `vp build`.
