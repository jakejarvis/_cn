import { IconChevronDown } from "@tabler/icons-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bun } from "@/components/ui/svgs/bun";
import { Npm } from "@/components/ui/svgs/npm";
import { Pnpm } from "@/components/ui/svgs/pnpm";
import { Yarn } from "@/components/ui/svgs/yarn";
import type { RegistryCatalogItem } from "@/lib/registry/catalog";
import { getCanonicalRegistryItemUrl } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const PACKAGE_MANAGER_STORAGE_KEY = "preferred-pm";
const PACKAGE_MANAGER_CHANGE_EVENT = "preferred-pm-change";
const DEFAULT_PACKAGE_MANAGER = "npm";

const packageManagers = [
  {
    value: "npm",
    label: "npm",
    logo: Npm,
  },
  {
    value: "pnpm",
    label: "pnpm",
    logo: Pnpm,
  },
  {
    value: "yarn",
    label: "yarn",
    logo: Yarn,
  },
  {
    value: "bun",
    label: "bun",
    logo: Bun,
  },
] as const;

type PackageManager = (typeof packageManagers)[number]["value"];
type PackageManagerPreference = readonly [
  PackageManager,
  (nextPackageManager: PackageManager) => void,
];

type InstallCommandProps = {
  item: RegistryCatalogItem;
  className?: string;
};

export function getInstallCommand(itemName: string, packageManager: PackageManager): string {
  const registryItemUrl = getCanonicalRegistryItemUrl(itemName);

  switch (packageManager) {
    case "bun":
      return `bunx --bun shadcn@latest add ${registryItemUrl}`;
    case "pnpm":
      return `pnpm dlx shadcn@latest add ${registryItemUrl}`;
    case "yarn":
      return `yarn dlx shadcn@latest add ${registryItemUrl}`;
    case "npm":
      return `npx shadcn@latest add ${registryItemUrl}`;
  }

  return assertNever(packageManager);
}

function setPackageManagerPreference(packageManager: PackageManager): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, packageManager);
  } catch {
    // Ignore storage failures; the in-memory UI state still updates.
  }

  window.dispatchEvent(new Event(PACKAGE_MANAGER_CHANGE_EVENT));
}

function getPackageManagerPreference(): PackageManager {
  if (typeof window === "undefined") {
    return DEFAULT_PACKAGE_MANAGER;
  }

  try {
    const storedPackageManager = window.localStorage.getItem(PACKAGE_MANAGER_STORAGE_KEY);

    return isPackageManager(storedPackageManager) ? storedPackageManager : DEFAULT_PACKAGE_MANAGER;
  } catch {
    return DEFAULT_PACKAGE_MANAGER;
  }
}

export function InstallCommand({ item, className }: InstallCommandProps) {
  const [packageManager, setPackageManager] = usePackageManagerPreference();
  const selectedPackageManager =
    packageManagers.find((option) => option.value === packageManager) ?? packageManagers[0];
  const command = getInstallCommand(item.name, packageManager);
  const SelectedLogo = selectedPackageManager.logo;

  return (
    <div className={cn("min-w-0 overflow-hidden rounded-lg border bg-muted/40", className)}>
      <div className="flex min-h-10 items-center justify-between gap-2 border-b px-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
            <SelectedLogo data-icon="inline-start" aria-hidden="true" />
            {selectedPackageManager.label}
            <IconChevronDown data-icon="inline-end" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-40">
            <DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={packageManager}
                onValueChange={(value) => {
                  if (isPackageManager(value)) {
                    setPackageManager(value);
                  }
                }}
              >
                {packageManagers.map((option) => {
                  const Logo = option.logo;

                  return (
                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                      <Logo data-icon="inline-start" aria-hidden="true" />
                      {option.label}
                    </DropdownMenuRadioItem>
                  );
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <CopyButton
          value={command}
          copyLabel="Copy install command"
          copiedLabel="Copied"
          resetDelay={1200}
          variant="ghost"
          size="icon-sm"
        />
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-6">
        <code>{command}</code>
      </pre>
    </div>
  );
}

function usePackageManagerPreference(): PackageManagerPreference {
  const [packageManager, setPackageManagerState] = React.useState<PackageManager>(
    getPackageManagerPreference,
  );

  React.useEffect(() => {
    function syncPackageManagerPreference() {
      setPackageManagerState(getPackageManagerPreference());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === PACKAGE_MANAGER_STORAGE_KEY) {
        syncPackageManagerPreference();
      }
    }

    syncPackageManagerPreference();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(PACKAGE_MANAGER_CHANGE_EVENT, syncPackageManagerPreference);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(PACKAGE_MANAGER_CHANGE_EVENT, syncPackageManagerPreference);
    };
  }, []);

  const setPackageManager = React.useCallback((nextPackageManager: PackageManager) => {
    setPackageManagerState(nextPackageManager);
    setPackageManagerPreference(nextPackageManager);
  }, []);

  return [packageManager, setPackageManager] as const;
}

function isPackageManager(value: string | null): value is PackageManager {
  return packageManagers.some((option) => option.value === value);
}

function assertNever(value: never): never {
  throw new Error(`Unhandled package manager: ${String(value)}`);
}
