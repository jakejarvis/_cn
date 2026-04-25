const supportedRegistrySourceExtensions = new Set(["css", "js", "jsx", "json", "ts", "tsx"]);

export function isSupportedRegistrySourcePath(path: string): boolean {
  const extension = path.split(".").at(-1);

  return extension ? supportedRegistrySourceExtensions.has(extension) : false;
}
