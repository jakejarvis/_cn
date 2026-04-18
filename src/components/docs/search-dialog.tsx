"use client";

import { IconSearch } from "@tabler/icons-react";
import { formatForDisplay, useHotkey, type Hotkey } from "@tanstack/react-hotkeys";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";
import type { RegistrySearchResponse, RegistrySearchResult } from "@/lib/search/registry-search";

type SearchState = "idle" | "loading" | "ready" | "error";

const searchDebounceMs = 120;
const searchResultLimit = 20;
const searchHotkey = "Mod+K" satisfies Hotkey;
const sectionOrder = ["components", "blocks", "utilities"] as const;

export function SearchDialog() {
  const navigate = useNavigate();
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

        void fetchSearchResults(trimmedQuery, abortController.signal)
          .then((response) => {
            setResults(response.results);
            setState("ready");
          })
          .catch((error: unknown) => {
            if (isAbortError(error)) {
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
  }, [open, trimmedQuery]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setQuery("");
      setState("idle");
    }
  }

  function handleSelect(result: RegistrySearchResult) {
    setOpen(false);

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
        className="hidden w-56 justify-between text-muted-foreground sm:flex"
        onClick={() => setOpen(true)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <IconSearch data-icon="inline-start" />
          <span className="truncate">Search registry</span>
        </span>
        <span className="rounded border px-1.5 text-xs text-muted-foreground">{shortcutLabel}</span>
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

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Search Registry"
        description="Search components, blocks, hooks, and utilities."
      >
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search registry..." />
          <CommandList>
            {state === "loading" ? (
              <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                <Spinner />
                Searching registry...
              </div>
            ) : null}
            {state === "error" ? (
              <div className="px-3 py-6 text-sm text-muted-foreground">
                Search is unavailable right now.
              </div>
            ) : null}
            {state !== "loading" && state !== "error" && results.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : null}
            {state !== "loading" && state !== "error" && results.length > 0 ? (
              trimmedQuery ? (
                <SearchResultGroup heading="Results" results={results} onSelect={handleSelect} />
              ) : (
                <DefaultSearchGroups results={results} onSelect={handleSelect} />
              )
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

function DefaultSearchGroups({
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
      {groups.map((group, index) => (
        <React.Fragment key={group[0].section}>
          {index > 0 ? <CommandSeparator /> : null}
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
    <CommandGroup heading={heading}>
      {results.map((result) => (
        <CommandItem
          key={`${result.section}:${result.name}`}
          value={`${result.title} ${result.name}`}
          onSelect={() => onSelect(result)}
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-medium">{result.title}</span>
            <span className="truncate text-xs text-muted-foreground">{result.description}</span>
          </span>
          <span className="shrink-0 rounded border px-1.5 py-0.5 text-xs text-muted-foreground">
            {getResultTypeLabel(result.type)}
          </span>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

async function fetchSearchResults(
  query: string,
  signal: AbortSignal,
): Promise<RegistrySearchResponse> {
  const searchParams = new URLSearchParams({
    q: query,
    limit: String(searchResultLimit),
  });
  const response = await fetch(`/api/search?${searchParams.toString()}`, { signal });

  if (!response.ok) {
    throw new Error("Search request failed.");
  }

  const body: unknown = await response.json();

  if (!isRegistrySearchResponse(body)) {
    throw new Error("Search response was invalid.");
  }

  return body;
}

function getResultTypeLabel(type: RegistrySearchResult["type"]): string {
  return type.replace("registry:", "");
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isRegistrySearchResponse(value: unknown): value is RegistrySearchResponse {
  return (
    isRecord(value) &&
    typeof value.query === "string" &&
    typeof value.count === "number" &&
    Array.isArray(value.results) &&
    value.results.every(isRegistrySearchResult)
  );
}

function isRegistrySearchResult(value: unknown): value is RegistrySearchResult {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    isRegistrySearchSection(value.section) &&
    typeof value.sectionTitle === "string" &&
    typeof value.type === "string" &&
    typeof value.score === "number" &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => typeof category === "string") &&
    Array.isArray(value.registryDependencies) &&
    value.registryDependencies.every((dependency) => typeof dependency === "string") &&
    Array.isArray(value.fileNames) &&
    value.fileNames.every((fileName) => typeof fileName === "string")
  );
}

function isRegistrySearchSection(value: unknown): value is RegistrySearchResult["section"] {
  return sectionOrder.some((section) => section === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
