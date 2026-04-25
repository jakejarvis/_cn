# Adaptation Workflow

Use this workflow when a user asks to adapt UI from an app into an installable shadcn registry item.

## Extract The Reusable Unit

1. Identify whether the source is a component, block, hook, helper, page, or file.
2. For new items, scaffold the target registry folder first with `bun --bun ./scripts/new.ts --type <type> --name <kebab-name> --description "<description>"`; include `--target` for pages/files and `--file-extension` for non-`ts` file items.
3. Copy only the reusable code into the scaffolded `registry/items/**` files.
4. Remove direct dependencies on app routing, auth, database clients, analytics, environment variables, and server-only helpers unless the item explicitly installs those integrations.
5. Replace app data access with props, local sample data, or small exported fixtures.
6. Keep visual behavior and interaction model intact unless the user asks for a redesign.

## Normalize The Public API

Prefer a simple component API:

- Props for text, links, data, callbacks, and mode flags.
- Exported sample data for complex blocks.
- Named exports that match the installed file name.
- No hidden dependency on the source app's global providers unless those providers are listed as registry dependencies or documented as required setup.

For blocks, keep internal subcomponents private unless they are likely to be reused independently. Publish shared helpers as separate `registry:lib` files only when that improves install clarity.

## Preserve Dependencies

Classify dependencies before writing frontmatter:

- shadcn primitives go in `registryDependencies`.
- Other local registry items go in `localRegistryDependencies`.
- NPM packages go in the registry metadata fields supported by the local template and shadcn schema.
- Relative imports between files in the same item should stay relative.

Do not duplicate a shadcn primitive under `registry/items/**`.

## Write A Useful Preview

The `Preview` export should show the real reusable item with realistic static data.

Good previews:

- Demonstrate default and important variant states.
- Use sample data from the item folder for blocks.
- Keep layout bounded so the docs page can render it cleanly.
- Avoid network calls, app-specific providers, auth state, server functions, and environment reads.

If the original UI needs unavailable app context, make a small preview adapter in `_registry.mdx` that supplies props or sample data to the reusable component.

## Write Usage Docs

Use the MDX body for install-time documentation that users need after adding the item:

- Include the import path users should copy after install.
- Show one realistic usage snippet.
- Mention required shadcn dependencies only when the setup is not obvious from the install command.
- Keep app-specific migration notes out of public Usage unless they apply to all consumers.

## Validate The Adaptation

Before handoff:

- Confirm no published source imports from the source app outside the item folder unless that import is intentionally installed.
- Confirm `_registry.mdx` is not listed in `files`.
- Confirm multi-file items, hooks, libs, pages, files, and target paths have explicit `files`.
- Run `vp check --fix` on touched files and `vp build` when docs, catalog, registry JSON, routes, or source loading changed.
