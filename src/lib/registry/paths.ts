export function getFileName(path: string): string {
  return path.split("/").at(-1) ?? path;
}

export function getParentPath(path: string): string {
  return path.split("/").slice(0, -1).join("/");
}

export function normalizePath(segments: readonly string[]): string {
  const normalizedSegments: string[] = [];

  for (const segment of segments) {
    if (segment === "" || segment === ".") {
      continue;
    }

    if (segment === "..") {
      normalizedSegments.pop();
      continue;
    }

    normalizedSegments.push(segment);
  }

  return normalizedSegments.join("/");
}

export function stripCodeExtension(path: string): string {
  return path.replace(/\.[cm]?[jt]sx?$/u, "");
}
