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

type SupportedLanguage = "ts" | "tsx";

let highlighterPromise: Promise<HighlighterCore> | undefined;

export function getCodeLanguage(path: string): SupportedLanguage | "text" {
  const extension = path.split(".").at(-1);

  if (extension === "ts" || extension === "tsx") {
    return extension;
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
    ],
  });

  return highlighterPromise;
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
