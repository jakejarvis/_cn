import { cn } from "../../lib/utils";
import { CopyButton } from "../ui/copy-button";

type CodeBlockProps = {
  code: string;
  highlightedHtml?: string;
  className?: string;
};

export function CodeBlock({ code, highlightedHtml, className }: CodeBlockProps) {
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
        className="absolute top-2 right-2 z-10 bg-muted/90"
      />
      {highlightedHtml ? (
        <div
          className="overflow-x-auto py-3 pr-12 pl-4 text-[13px] has-[pre[style*='--line-number-width']]:pl-6"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="overflow-x-auto py-3 pr-12 pl-4 text-[13px]">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
