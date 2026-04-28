import type {
  RegistryBaseItem as ShadcnRegistryBaseItem,
  RegistryFontItem as ShadcnRegistryFontItem,
  RegistryItem as ShadcnRegistryItem,
} from "shadcn/schema";

import { siteConfig } from "../site-config";
import type { PrivateRegistryItemType, RegistryItemType } from "./item-types";

export const registryConfig = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: siteConfig.registryName,
  homepage: siteConfig.homepage,
} as const;

export const registryItemSchema = "https://ui.shadcn.com/schema/registry-item.json";

type ShadcnRegistryFile = NonNullable<ShadcnRegistryItem["files"]>[number];
type PublicRegistryFileDefinition<T extends ShadcnRegistryFile> = T extends unknown
  ? Omit<T, "content" | "type"> & { type: Exclude<T["type"], PrivateRegistryItemType> }
  : never;

export type RegistryFileDefinition = PublicRegistryFileDefinition<ShadcnRegistryFile>;

export type RegistrySourceFileDefinition = RegistryFileDefinition & {
  sourcePath?: string;
};

export type RegistryFileType = RegistryFileDefinition["type"];

export type RegistryItemDefinition = Omit<
  ShadcnRegistryItem,
  "$schema" | "files" | "type" | "title" | "description"
> & {
  type: RegistryItemType;
  title?: string;
  description?: string;
  files?: RegistryFileDefinition[];
  config?: ShadcnRegistryBaseItem["config"];
  font?: ShadcnRegistryFontItem["font"];
};

export type RegistryItemAuthoringDefinition = Omit<RegistryItemDefinition, "files"> & {
  files?: RegistrySourceFileDefinition[];
};
