import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

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
        className="absolute top-2 right-2 bg-muted/80"
      />
      {highlightedHtml ? (
        <div
          className="overflow-x-auto py-3 pr-12 pl-4 text-sm leading-6 has-[pre[style*='--line-number-width']]:pl-6"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="overflow-x-auto py-3 pr-12 pl-4 text-sm leading-6">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
