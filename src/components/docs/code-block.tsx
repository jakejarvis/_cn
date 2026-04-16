import type * as React from "react";

import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  highlightedCode?: React.ReactNode;
  className?: string;
};

export function CodeBlock({ code, highlightedCode, className }: CodeBlockProps) {
  return (
    <div
      className={cn("relative min-w-0 overflow-hidden rounded-lg border bg-muted/40", className)}
    >
      <CopyButton
        value={code}
        copyLabel="Copy code"
        copiedLabel="Copied"
        resetDelay={1200}
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2 bg-muted/80"
      />
      {highlightedCode ? (
        <div className="overflow-x-auto py-3 pr-12 pl-6 text-sm leading-6">{highlightedCode}</div>
      ) : (
        <pre className="overflow-x-auto py-3 pr-12 pl-6 text-sm leading-6">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
