"use client";

import { IconCheck, IconCopy } from "@tabler/icons-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyButtonClickEvent = Parameters<
  NonNullable<React.ComponentProps<typeof Button>["onClick"]>
>[0];

type CopyButtonProps = Omit<React.ComponentProps<typeof Button>, "children" | "value"> & {
  value: string | (() => string | Promise<string>);
  showLabel?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
  resetDelay?: number;
  onCopied?: (value: string, event: CopyButtonClickEvent) => void;
  onCopyError?: (error: unknown, event: CopyButtonClickEvent) => void;
};

function CopyButton({
  value,
  showLabel = false,
  copyLabel = "Copy to clipboard",
  copiedLabel = "Copied",
  resetDelay = 2000,
  variant = "ghost",
  size,
  className,
  disabled,
  onClick,
  onCopied,
  onCopyError,
  ...props
}: CopyButtonProps) {
  const resetTimeoutRef = React.useRef<number | undefined>(undefined);
  const [copied, setCopied] = React.useState(false);
  const buttonSize: React.ComponentProps<typeof Button>["size"] =
    size ?? (showLabel ? "sm" : "icon-sm");

  React.useEffect(() => {
    return () => window.clearTimeout(resetTimeoutRef.current);
  }, []);

  const handleClick = React.useCallback(
    async (event: CopyButtonClickEvent) => {
      onClick?.(event);

      if (event.defaultPrevented || copied || disabled) {
        return;
      }

      try {
        const textToCopy = typeof value === "function" ? await value() : value;

        await copyTextToClipboard(textToCopy);
        window.clearTimeout(resetTimeoutRef.current);
        setCopied(true);
        resetTimeoutRef.current = window.setTimeout(() => setCopied(false), resetDelay);
        onCopied?.(textToCopy, event);
      } catch (error) {
        setCopied(false);
        onCopyError?.(error, event);
      }
    },
    [copied, disabled, onClick, onCopied, onCopyError, resetDelay, value],
  );

  return (
    <Button
      type="button"
      variant={variant}
      size={buttonSize}
      disabled={disabled}
      aria-label={copied ? copiedLabel : copyLabel}
      className={cn("shrink-0", copied && "cursor-default", className)}
      onClick={handleClick}
      {...props}
    >
      {copied ? (
        <IconCheck aria-hidden="true" data-icon={showLabel ? "inline-start" : undefined} />
      ) : (
        <IconCopy aria-hidden="true" data-icon={showLabel ? "inline-start" : undefined} />
      )}
      {showLabel && <span>{copied ? copiedLabel : copyLabel}</span>}
    </Button>
  );
}

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");

  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.inset = "0 auto auto -9999px";
  document.body.append(textArea);
  textArea.select();

  const copied = document.execCommand("copy");

  textArea.remove();

  if (!copied) {
    throw new Error("Copy command was rejected.");
  }
}

export { CopyButton };
