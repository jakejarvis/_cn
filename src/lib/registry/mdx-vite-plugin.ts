import { readFile } from "node:fs/promises";

import createMdx, { type Options } from "@mdx-js/rollup";
import { transformWithOxc, type Plugin } from "vite";

import { getMdxEsmSource, parseRegistryMdxAst } from "./mdx-ast.ts";

const REGISTRY_PREVIEW_QUERY = "registry-preview";
const VITE_FILE_SYSTEM_PREFIX = "/@fs/";

type MdxTransformResult = ReturnType<ReturnType<typeof createMdx>["transform"]> | undefined;
type MdxLoadResult = Awaited<ReturnType<typeof transformWithOxc>> | undefined;
type MdxQueryBypassPlugin = Omit<Plugin, "load" | "transform"> & {
  load: (id: string) => Promise<MdxLoadResult>;
  transform: (code: string, id: string) => MdxTransformResult;
};

export function mdxWithQueryBypass(options?: Readonly<Options> | null): MdxQueryBypassPlugin {
  const delegate = createMdx(options);

  return {
    ...delegate,
    name: "underscore-cn:mdx",
    enforce: "pre",
    async load(id: string) {
      if (!isRegistryPreviewModule(id)) {
        return undefined;
      }

      const path = getFilePathFromModuleId(id);
      const source = await readFile(path, "utf8");
      const previewSource = getMdxEsmSource(parseRegistryMdxAst(path, source));

      return transformWithOxc(`"use client";\n\n${previewSource}\n`, `${path}.tsx`);
    },
    transform: (code, id) => {
      if (shouldBypassMdxTransform(id)) {
        return undefined;
      }

      return delegate.transform(code, id);
    },
  };
}

function isRegistryPreviewModule(id: string): boolean {
  return getQueryParams(id)?.has(REGISTRY_PREVIEW_QUERY) ?? false;
}

function shouldBypassMdxTransform(id: string): boolean {
  const params = getQueryParams(id);

  if (!params) {
    return false;
  }

  return params.has("raw") || params.has("url") || params.has(REGISTRY_PREVIEW_QUERY);
}

function getQueryParams(id: string): URLSearchParams | null {
  const queryStart = id.indexOf("?");

  if (queryStart === -1) {
    return null;
  }

  const queryEnd = id.indexOf("#", queryStart);
  const query = id.slice(queryStart + 1, queryEnd === -1 ? undefined : queryEnd);

  return new URLSearchParams(query);
}

function getFilePathFromModuleId(id: string): string {
  const queryStart = id.indexOf("?");
  const path = queryStart === -1 ? id : id.slice(0, queryStart);

  return path.startsWith(VITE_FILE_SYSTEM_PREFIX)
    ? path.slice(VITE_FILE_SYSTEM_PREFIX.length)
    : path;
}
