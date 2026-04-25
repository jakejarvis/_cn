import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { nitro } from "nitro/vite";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { defineConfig } from "vite-plus";

import { getPrerenderPages } from "./src/lib/prerender-pages.ts";
import { mdxWithQueryBypass } from "./src/lib/registry/mdx-vite-plugin.ts";
import { shouldExcludeFromSitemap } from "./src/lib/seo.ts";
import { siteConfig } from "./src/lib/site-config.ts";

const config = defineConfig({
  run: {
    tasks: {
      "registry:new": {
        // TODO: fix TTY weirdness -- for now, run `./scripts/new.ts` from the command line directly.
        command: "bun --bun ./scripts/new.ts",
      },
      "registry:doctor": {
        command: "bun --bun ./scripts/doctor.ts",
      },
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    sortImports: {},
    sortTailwindcss: {
      stylesheet: "src/styles.css",
      functions: ["clsx", "cn", "cva", "tw"],
      preserveDuplicates: false,
      preserveWhitespace: false,
    },
    sortPackageJson: true,
    overrides: [
      {
        files: ["**/*.json", "**/*.jsonc"],
        options: {
          trailingComma: "none",
        },
      },
    ],
    ignorePatterns: [
      "**/.nitro/**",
      "**/.output/**",
      "**/.tanstack/**",
      "**/dist/**",
      "**/node_modules/**",
      "registry/items/**/_registry.mdx",
      "src/routeTree.gen.ts",
      "AGENTS.md",
      "README.md",
    ],
  },
  lint: {
    plugins: ["oxc", "eslint", "typescript", "react", "import", "unicorn", "vitest", "jsx-a11y"],
    options: { typeAware: true, typeCheck: true },
    env: {
      builtin: true,
    },
    categories: {
      correctness: "error",
      suspicious: "warn",
      perf: "warn",
    },
    rules: {
      "no-dupe-else-if": "error",
      "no-empty": "error",
      "no-restricted-globals": "error",
      "react/exhaustive-deps": "error",
      "react/rules-of-hooks": "error",
      "typescript/array-type": "error",
      "typescript/consistent-type-exports": "error",
      "typescript/no-floating-promises": "error",
      "typescript/no-misused-promises": "error",
      "typescript/no-namespace": "error",
      "typescript/prefer-for-of": "error",
      "typescript/require-await": "error",
      "unicorn/no-new-buffer": "error",
      "jsx-a11y/anchor-has-content": "off",
      "react/react-in-jsx-scope": "off",
    },
    overrides: [
      {
        files: ["**/*.test.ts", "**/*.test.tsx"],
        rules: {
          "typescript/no-unused-vars": "off",
        },
      },
    ],
    ignorePatterns: [
      "**/.nitro/**",
      "**/.output/**",
      "**/.tanstack/**",
      "**/dist/**",
      "**/node_modules/**",
      "src/routeTree.gen.ts",
    ],
  },
  test: {
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: true,
  },
  clearScreen: false,
  server: {
    watch: {
      ignored: [
        "**/.nitro/**",
        "**/.output/**",
        "**/.tanstack/**",
        "**/dist/**",
        "**/node_modules/**",
      ],
    },
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      // tslib's CJS UMD sets __esModule: true without providing a default
      // export, which breaks Vite 8 / Rolldown's consistent CJS interop.
      // Alias to the native ESM build to avoid the interop entirely.
      tslib: "tslib/tslib.es6.js",
    },
  },
  plugins: [
    devtools(),
    mdxWithQueryBypass({
      remarkPlugins: [remarkFrontmatter, remarkGfm],
    }),
    tailwindcss(),
    ...(process.env.VITEST === "true"
      ? []
      : [
          tanstackStart({
            rsc: {
              enabled: true,
            },
            pages: getPrerenderPages(),
            prerender: {
              enabled: true,
              autoStaticPathsDiscovery: false,
              crawlLinks: false,
              onSuccess: ({ page }) => {
                if (!shouldExcludeFromSitemap(page.path)) {
                  return undefined;
                }

                return {
                  sitemap: {
                    ...page.sitemap,
                    exclude: true,
                  },
                };
              },
            },
            sitemap: {
              enabled: true,
              host: siteConfig.homepage,
            },
          }),
          rsc(),
        ]),
    viteReact(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    ...(process.env.VITEST === "true" ? [] : [nitro()]),
  ],
});

export default config;
