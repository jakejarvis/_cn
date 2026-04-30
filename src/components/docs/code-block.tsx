import type { ReactNode } from "react";

import { cn } from "../../lib/utils";
import { CopyButton } from "../ui/copy-button";

type CodeBlockProps = {
  code: string;
  highlightedHtml?: string;
  header?: ReactNode;
  className?: string;
};

export function CodeBlock({ code, highlightedHtml, header, className }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "group/code-block relative min-w-0 overflow-hidden rounded-lg border bg-muted/40",
        className,
      )}
    >
      {header ? (
        <div className="flex min-h-10 items-center justify-between gap-3 border-b px-3">
          <div className="min-w-0">{header}</div>
          <CopyButton
            value={code}
            copyLabel="Copy contents"
            copiedLabel="Copied"
            resetDelay={1200}
            variant="ghost"
            size="icon-sm"
          />
        </div>
      ) : (
        <CopyButton
          value={code}
          copyLabel="Copy contents"
          copiedLabel="Copied"
          resetDelay={1200}
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2 z-10 bg-muted/90 group-hover/code-block:opacity-100 sm:opacity-0"
        />
      )}
      {highlightedHtml ? (
        <div
          className={cn(
            "overflow-x-auto py-3 pl-4 text-[13px] has-[pre[style*='--line-number-width']]:pl-6",
            header ? "pr-4" : "pr-12",
          )}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className={cn("overflow-x-auto py-3 pl-4 text-[13px]", header ? "pr-4" : "pr-12")}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
