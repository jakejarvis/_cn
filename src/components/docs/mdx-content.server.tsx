import { renderServerComponent } from "@tanstack/react-start/rsc";
import * as React from "react";

import { CodeBlock } from "@/components/docs/code-block";
import { highlightCodeToHtml } from "@/lib/registry/highlight.server";
import { cn } from "@/lib/utils";

export type MdxContentModule = {
  default?: React.ComponentType<{
    components?: Record<string, unknown>;
  }>;
};

const baseMdxComponents = {
  a: MarkdownLink,
  code: MarkdownInlineCode,
  pre: MarkdownPre,
};

export async function renderMdxContent({
  Content,
  components,
}: {
  Content: NonNullable<MdxContentModule["default"]>;
  components?: Record<string, unknown>;
}) {
  return renderServerComponent(<MdxContent Content={Content} components={components} />);
}

function MdxContent({
  Content,
  components,
}: {
  Content: NonNullable<MdxContentModule["default"]>;
  components?: Record<string, unknown>;
}) {
  const mdxComponents = components
    ? Object.assign({}, baseMdxComponents, components)
    : baseMdxComponents;

  return (
    <div className="prose max-w-none prose-neutral dark:prose-invert prose-pre:my-0">
      <Content components={mdxComponents} />
    </div>
  );
}

function MarkdownLink({ href, ...props }: React.ComponentProps<"a">) {
  const external = href?.startsWith("http://") || href?.startsWith("https://");

  return (
    <a {...props} href={href} {...(external ? { rel: "noreferrer", target: "_blank" } : {})} />
  );
}

function MarkdownInlineCode({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <code
      className={cn("rounded bg-muted px-1 py-0.5 font-mono text-[0.875em] font-normal", className)}
      {...props}
    />
  );
}

async function MarkdownPre({ children }: React.ComponentProps<"pre">) {
  return renderMarkdownCodeBlock(children);
}

export async function renderMarkdownCodeBlock(children: React.ReactNode) {
  const child = React.Children.toArray(children).find(React.isValidElement);

  if (!React.isValidElement<CodeElementProps>(child)) {
    return <pre>{children}</pre>;
  }

  const code = getCodeText(child.props.children).replace(/\n$/u, "");
  const language = getMarkdownCodeLanguage(child.props.className);

  return (
    <CodeBlock
      code={code}
      highlightedHtml={await highlightCodeToHtml(code, language ?? "text")}
      className="not-prose my-4"
    />
  );
}

export function DocsCallout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: React.ReactNode;
}) {
  return (
    <div className="not-prose my-6 rounded-lg border bg-muted/40 p-4 text-sm">
      {title ? <div className="mb-1 font-medium text-foreground">{title}</div> : null}
      <div className="text-muted-foreground [&_p]:leading-6">{children}</div>
    </div>
  );
}

type CodeElementProps = {
  className?: string;
  children?: React.ReactNode;
};

function getMarkdownCodeLanguage(className: string | undefined): string | null {
  return className?.match(/(?:^|\s)language-([^\s]+)/u)?.[1] ?? null;
}

function getCodeText(children: React.ReactNode): string {
  return React.Children.toArray(children).map(getCodeChildText).join("");
}

function getCodeChildText(child: React.ReactNode): string {
  return typeof child === "string" || typeof child === "number" ? String(child) : "";
}
