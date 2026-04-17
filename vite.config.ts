import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite-plus";

import { registryMetadata } from "./src/lib/registry/metadata-plugin.ts";

const config = defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    sortImports: {
      groups: [
        "builtin",
        "external",
        ["internal", "subpath"],
        ["parent", "sibling", "index"],
        "style",
        "unknown",
      ],
      internalPattern: ["@/"],
      newlinesBetween: true,
      order: "asc",
    },
    sortTailwindcss: {
      stylesheet: "src/styles.css",
      functions: ["clsx", "cn", "cva", "classList"],
    },
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
      "react/react-in-jsx-scope": "off",
      "jsx-a11y/anchor-has-content": "off",
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
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: true,
  },
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
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    registryMetadata(),
    tailwindcss(),
    tanstackStart({
      rsc: {
        enabled: true,
      },
    }),
    rsc(),
    viteReact(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    nitro(),
  ],
});

export default config;
