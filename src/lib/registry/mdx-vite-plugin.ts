import createMdx, { type Options } from "@mdx-js/rollup";
import type { Plugin } from "vite";

type MdxTransformResult = ReturnType<ReturnType<typeof createMdx>["transform"]> | undefined;
type MdxQueryBypassPlugin = Omit<Plugin, "transform"> & {
  transform: (code: string, id: string) => MdxTransformResult;
};

export function mdxWithQueryBypass(options?: Readonly<Options> | null): MdxQueryBypassPlugin {
  const delegate = createMdx(options);

  return {
    ...delegate,
    name: "underscore-cn:mdx",
    enforce: "pre",
    transform: (code, id) => {
      if (id.includes("?")) {
        return undefined;
      }

      return delegate.transform(code, id);
    },
  };
}
