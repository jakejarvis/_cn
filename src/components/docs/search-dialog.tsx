"use client";

import { IconSearch } from "@tabler/icons-react";
import { formatForDisplay, useHotkey, type Hotkey } from "@tanstack/react-hotkeys";
import * as React from "react";

import { Button } from "@/components/ui/button";

const searchHotkey = "Mod+K" satisfies Hotkey;

let searchDialogPanelPromise: Promise<typeof import("./search-dialog-panel")> | undefined;

const LazySearchDialogPanel = React.lazy(async () => {
  const module = await loadSearchDialogPanel();

  return { default: module.SearchDialogPanel };
});

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [shortcutLabel, setShortcutLabel] = React.useState("Ctrl K");

  useHotkey(
    searchHotkey,
    () => {
      setOpen((currentOpen) => !currentOpen);
    },
    { requireReset: true },
  );

  React.useEffect(() => {
    setShortcutLabel(formatForDisplay(searchHotkey));
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="mr-4 hidden w-56 justify-between text-muted-foreground sm:flex"
        onClick={() => setOpen(true)}
        onFocus={preloadSearchDialogPanel}
        onPointerEnter={preloadSearchDialogPanel}
        onTouchStart={preloadSearchDialogPanel}
      >
        <span className="flex min-w-0 items-center gap-2">
          <IconSearch data-icon="inline-start" />
          <span className="truncate">Search docs</span>
        </span>
        <span
          className="rounded border px-1.5 text-xs text-muted-foreground"
          suppressHydrationWarning
        >
          {shortcutLabel}
        </span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        onFocus={preloadSearchDialogPanel}
        onPointerEnter={preloadSearchDialogPanel}
        onTouchStart={preloadSearchDialogPanel}
        aria-label="Search docs and registry"
      >
        <IconSearch data-icon />
      </Button>

      {open ? (
        <React.Suspense fallback={null}>
          <LazySearchDialogPanel open={open} onOpenChange={setOpen} />
        </React.Suspense>
      ) : null}
    </>
  );
}

function loadSearchDialogPanel() {
  searchDialogPanelPromise ??= import("./search-dialog-panel");

  return searchDialogPanelPromise;
}

function preloadSearchDialogPanel() {
  void loadSearchDialogPanel();
}
