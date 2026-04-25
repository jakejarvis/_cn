---
name: shadcn-registry
description: Author and adapt installable shadcn-compatible registry items in _cn template repositories. Use when asked to add a component such as "add a button component to the registry", adapt app UI into a reusable registry component or block, add hooks, libs/helpers, pages/files, previews, usage docs, registry dependencies, local registry dependencies, or validate _cn registry item authoring.
---

# Shadcn Registry

Use this skill to add, adapt, or maintain installable registry items in a `_cn` template repo for a [shadcn/ui registry](https://ui.shadcn.com/docs/registry).

## Workflow

1. Inspect the local `AGENTS.md` and `README.md` first. Treat local repo instructions as the source of truth when they differ from this skill.
2. Put published registry source under `registry/items/**`. Do not put installable registry item source under `src/components/ui`; that folder is for the docs app shell.
3. Author each item with `_registry.mdx`: YAML frontmatter metadata, optional MDX Usage body, and a named `Preview` export.
4. Choose the registry type and folder from the user's intent:
   - component/ui: `registry:ui` in `registry/items/components/<kebab-name>/`
   - non-UI component: `registry:component` in `registry/items/components/<kebab-name>/`
   - block: `registry:block` in `registry/items/blocks/<kebab-name>/`
   - hook: `registry:hook` in `registry/items/hooks/<kebab-name>/`
   - lib/helper: `registry:lib` in `registry/items/lib/<kebab-name>/`
   - page/file: explicit-file item under a clear `registry/items/<section>/<kebab-name>/` folder
5. For new items, prefer the non-interactive scaffold command instead of hand-creating starter files: `bun --bun ./scripts/new.ts --type registry:ui --name <kebab-name> --description "<description>"`. Add `--target` for `registry:page` and `registry:file`; add `--file-extension` for `registry:file` when not using the default `ts`.
6. For one-file `registry:ui` items, omit `files` only when the published source is `<item-name>.tsx` in the item folder. List `files` explicitly for hooks, libs, blocks, pages, target paths, and multi-file items.
7. Use shadcn primitive names such as `button`, `card`, and `badge` in `registryDependencies`. Use `localRegistryDependencies` for other local registry items.
8. Run focused checks on touched files. Run `vp build` when docs, routes, registry JSON, catalog loading, or source loading changed.

## References

- Read [`references/item-authoring.md`](references/item-authoring.md) when creating or changing registry items, metadata, dependency fields, published files, or examples.
- Read [`references/adaptation-workflow.md`](references/adaptation-workflow.md) when adapting UI from an app into reusable registry components, blocks, hooks, or helpers.
