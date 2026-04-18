import { createHighlighterCore, type HighlighterCore, type ShikiTransformer } from "@shikijs/core";
import { createOnigurumaEngine } from "@shikijs/engine-oniguruma";

const SHIKI_THEMES = {
  light: "github-light",
  dark: "github-dark",
} as const;

const LINE_NUMBER_WIDTH_TRANSFORMER: ShikiTransformer = {
  pre(hast) {
    const style = typeof hast.properties.style === "string" ? hast.properties.style : "";
    const lineNumberWidth = `${String(this.lines.length).length}ch`;

    hast.properties.style = [style, `--line-number-width:${lineNumberWidth}`]
      .filter(Boolean)
      .join(";");
  },
};

type SupportedLanguage = "bash" | "css" | "html" | "json" | "ts" | "tsx";

let highlighterPromise: Promise<HighlighterCore> | undefined;

export function getCodeLanguage(path: string): SupportedLanguage | "text" {
  const language = normalizeCodeLanguage(path.split(".").at(-1) ?? path);

  if (language) {
    return language;
  }

  return "text";
}

export async function highlightCodeToHtml(code: string, path: string): Promise<string> {
  const language = getCodeLanguage(path);

  if (language === "text") {
    return highlightPlainTextToHtml(code);
  }

  try {
    const highlighter = await getHighlighter();

    return highlighter.codeToHtml(code, {
      lang: language,
      themes: SHIKI_THEMES,
      transformers: [LINE_NUMBER_WIDTH_TRANSFORMER],
    });
  } catch {
    return highlightPlainTextToHtml(code);
  }
}

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    engine: createOnigurumaEngine(import("@shikijs/engine-oniguruma/wasm-inlined")),
    themes: [
      import("@shikijs/themes/github-light").then((module) => module.default),
      import("@shikijs/themes/github-dark").then((module) => module.default),
    ],
    langs: [
      import("@shikijs/langs/ts").then((module) => module.default),
      import("@shikijs/langs/tsx").then((module) => module.default),
      import("@shikijs/langs/bash").then((module) => module.default),
      import("@shikijs/langs/json").then((module) => module.default),
      import("@shikijs/langs/css").then((module) => module.default),
      import("@shikijs/langs/html").then((module) => module.default),
    ],
  });

  return highlighterPromise;
}

function normalizeCodeLanguage(value: string): SupportedLanguage | null {
  switch (value.toLowerCase().replace(/^language-/u, "")) {
    case "bash":
    case "shell":
    case "sh":
    case "zsh":
      return "bash";
    case "css":
      return "css";
    case "html":
    case "markup":
      return "html";
    case "json":
      return "json";
    case "ts":
    case "typescript":
      return "ts";
    case "tsx":
      return "tsx";
    default:
      return null;
  }
}

export function highlightPlainTextToHtml(code: string): string {
  return `<pre class="shiki shiki-plain" tabindex="0"><code>${escapeHtml(code)}</code></pre>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
