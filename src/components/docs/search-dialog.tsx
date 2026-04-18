"use client";

import { IconCornerDownLeft, IconSearch } from "@tabler/icons-react";
import { formatForDisplay, useHotkey, type Hotkey } from "@tanstack/react-hotkeys";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { RegistrySearchResult } from "@/lib/search/registry-search";
import { searchRegistryItemsFn } from "@/lib/search/registry-search.functions";
import { cn } from "@/lib/utils";

type SearchState = "idle" | "loading" | "ready" | "error";

const searchDebounceMs = 120;
const searchResultLimit = 20;
const searchHotkey = "Mod+K" satisfies Hotkey;
const sectionOrder = ["components", "blocks", "utilities"] as const;

export function SearchDialog() {
  const navigate = useNavigate();
  const searchRegistryItems = useServerFn(searchRegistryItemsFn);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [state, setState] = React.useState<SearchState>("idle");
  const [results, setResults] = React.useState<RegistrySearchResult[]>([]);
  const [shortcutLabel, setShortcutLabel] = React.useState("Ctrl K");
  const trimmedQuery = query.trim();

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

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(
      () => {
        setState("loading");

        void searchRegistryItems({
          data: {
            query: trimmedQuery,
            limit: searchResultLimit,
          },
          signal: abortController.signal,
        })
          .then((response) => {
            if (abortController.signal.aborted) {
              return;
            }

            setResults(response.results);
            setState("ready");
          })
          .catch(() => {
            if (abortController.signal.aborted) {
              return;
            }

            setResults([]);
            setState("error");
          });
      },
      trimmedQuery ? searchDebounceMs : 0,
    );

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [open, searchRegistryItems, trimmedQuery]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setQuery("");
      setState("idle");
    }
  }

  function handleSelect(result: RegistrySearchResult) {
    handleOpenChange(false);

    switch (result.section) {
      case "components":
        void navigate({ to: "/components/$name", params: { name: result.name } });
        return;
      case "blocks":
        void navigate({ to: "/blocks/$name", params: { name: result.name } });
        return;
      case "utilities":
        void navigate({ to: "/utilities/$name", params: { name: result.name } });
        return;
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="mr-4 hidden w-56 justify-between text-muted-foreground sm:flex"
        onClick={() => setOpen(true)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <IconSearch data-icon="inline-start" />
          <span className="truncate">Search registry</span>
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
        aria-label="Search registry"
      >
        <IconSearch data-icon />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <SearchDialogContent>
          <DialogHeader className="sr-only">
            <DialogTitle>Search Registry</DialogTitle>
            <DialogDescription>Search components, blocks, hooks, and utilities.</DialogDescription>
          </DialogHeader>
          <Command
            shouldFilter={false}
            className="rounded-none! bg-transparent p-0! **:data-[slot=command-input]:h-9! **:data-[slot=command-input]:py-0 **:data-[slot=command-input-wrapper]:p-0! **:data-[slot=input-group]:h-9! **:data-[slot=input-group]:rounded-md! **:data-[slot=input-group]:border-input **:data-[slot=input-group]:bg-input/50"
          >
            <div className="relative">
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder="Search registry..."
              />
              {state === "loading" ? (
                <div className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center">
                  <Spinner className="size-4 text-muted-foreground" />
                </div>
              ) : null}
            </div>
            <CommandList className="no-scrollbar min-h-80 scroll-pt-2 scroll-pb-1.5">
              {state === "loading" ? (
                <CommandEmpty className="py-12 text-center text-sm text-muted-foreground">
                  Searching registry...
                </CommandEmpty>
              ) : null}
              {state === "error" ? (
                <CommandEmpty className="py-12 text-center text-sm text-muted-foreground">
                  Search is unavailable right now.
                </CommandEmpty>
              ) : null}
              {state === "ready" && results.length === 0 ? (
                <CommandEmpty className="py-12 text-center text-sm text-muted-foreground">
                  No results found.
                </CommandEmpty>
              ) : null}
              {state === "ready" && results.length > 0 ? (
                <SectionedSearchGroups results={results} onSelect={handleSelect} />
              ) : null}
            </CommandList>
          </Command>
          <div className="absolute inset-x-0 bottom-0 flex h-10 items-center gap-2 rounded-b-xl border-t bg-muted/50 px-4 text-xs font-medium text-muted-foreground">
            <SearchDialogKbd>
              <IconCornerDownLeft />
            </SearchDialogKbd>
            Go to Page
          </div>
        </SearchDialogContent>
      </Dialog>
    </>
  );
}

function SearchDialogContent({ className, ...props }: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn(
        "top-[15%] translate-y-0 overflow-hidden rounded-xl border-none bg-clip-padding p-2 pb-11 shadow-2xl ring-4 ring-border/80 sm:max-w-lg",
        className,
      )}
      showCloseButton={false}
      {...props}
    />
  );
}

function SectionedSearchGroups({
  results,
  onSelect,
}: {
  results: RegistrySearchResult[];
  onSelect: (result: RegistrySearchResult) => void;
}) {
  const groups = sectionOrder
    .map((section) => results.filter((result) => result.section === section))
    .filter((group) => group.length > 0);

  return (
    <>
      {groups.map((group) => (
        <React.Fragment key={group[0].section}>
          <SearchResultGroup heading={group[0].sectionTitle} results={group} onSelect={onSelect} />
        </React.Fragment>
      ))}
    </>
  );
}

function SearchResultGroup({
  heading,
  results,
  onSelect,
}: {
  heading: string;
  results: RegistrySearchResult[];
  onSelect: (result: RegistrySearchResult) => void;
}) {
  return (
    <CommandGroup
      heading={heading}
      className="p-0! **:[[cmdk-group-heading]]:scroll-mt-16 **:[[cmdk-group-heading]]:p-3! **:[[cmdk-group-heading]]:pb-1!"
    >
      {results.map((result) => (
        <CommandItem
          key={`${result.section}:${result.name}`}
          value={`${result.title} ${result.name}`}
          keywords={[result.name, result.sectionTitle, result.type, ...result.categories]}
          className="h-9 rounded-md border border-transparent px-3! font-medium data-[selected=true]:border-input data-[selected=true]:bg-input/50 data-selected:border-input data-selected:bg-input/50"
          onSelect={() => onSelect(result)}
        >
          <span className="min-w-0 truncate">{result.title}</span>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

function SearchDialogKbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "pointer-events-none flex h-5 items-center justify-center gap-1 rounded border bg-background px-1 font-sans text-[0.7rem] font-medium text-muted-foreground select-none [&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    />
  );
}
