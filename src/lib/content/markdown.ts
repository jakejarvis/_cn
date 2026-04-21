export const sharedCacheControlHeader =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

export const markdownResponseHeaders = {
  "Cache-Control": sharedCacheControlHeader,
  "Content-Type": "text/markdown; charset=utf-8",
} as const;

export const plainTextResponseHeaders = {
  "Cache-Control": sharedCacheControlHeader,
  "Content-Type": "text/plain; charset=utf-8",
} as const;

export function joinMarkdownBlocks(blocks: readonly string[]): string {
  return `${blocks.filter((block) => block.trim().length > 0).join("\n\n")}\n`;
}

export function escapeMarkdownLinkText(value: string): string {
  return value.replace(/[[\]\\]/gu, "\\$&");
}

export function formatCodeBlock(code: string, language: string): string {
  const fence = getCodeFence(code);

  return `${fence}${language}\n${code}\n${fence}`;
}

export function getMarkdownLanguage(path: string): string {
  const extension = path.split(".").at(-1);

  switch (extension) {
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
    case "css":
    case "json":
      return extension;
    default:
      return "text";
  }
}

function getCodeFence(code: string): string {
  const backtickRuns = code.match(/`+/gu) ?? [];
  const longestRunLength = Math.max(0, ...backtickRuns.map((run) => run.length));

  return "`".repeat(Math.max(3, longestRunLength + 1));
}
