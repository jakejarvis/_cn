export function normalizeGlobFiles<T>(files: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(files).map(([path, source]) => [normalizeGlobPath(path), source]),
  );
}

function normalizeGlobPath(path: string): string {
  return path.replace(/^(?:\.\.\/){3}/u, "");
}
