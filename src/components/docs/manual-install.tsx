"use client";

import { IconFileCode } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { CodeBlock } from "./code-block";
import {
  getPackageInstallCommands,
  PackageManagerCommand,
  type PackageManager,
} from "./install-command";

type ManualInstallSourceFile = {
  path: string;
  source: string;
  highlightedHtml?: string;
  target?: string;
};

type ManualInstallItem = {
  dependencies?: readonly string[];
  devDependencies?: readonly string[];
  sourceFiles: readonly ManualInstallSourceFile[];
};

type ManualInstallationProps = {
  item: ManualInstallItem;
};

type ManualInstallStepProps = {
  children?: ReactNode;
  last?: boolean;
  number: number;
  title: string;
};

export function ManualInstallation({ item }: ManualInstallationProps) {
  let stepNumber = 1;
  const hasPackageDependencies =
    (item.dependencies?.length ?? 0) > 0 || (item.devDependencies?.length ?? 0) > 0;
  const dependencyStepNumber = hasPackageDependencies ? stepNumber++ : null;
  const sourceStepNumber = stepNumber++;
  const importStepNumber = stepNumber;

  return (
    <ol className="flex flex-col gap-8">
      {dependencyStepNumber ? (
        <ManualInstallStep
          number={dependencyStepNumber}
          title="Install the following dependencies:"
        >
          <PackageManagerCommand
            copyLabel="Copy dependency install command"
            getCommand={(packageManager) => getManualPackageInstallCommand(item, packageManager)}
          />
        </ManualInstallStep>
      ) : null}

      <ManualInstallStep
        number={sourceStepNumber}
        title="Copy and paste the following code into your project."
      >
        {item.sourceFiles.length > 0 ? (
          <div className="flex flex-col gap-4">
            {item.sourceFiles.map((file) => (
              <CodeBlock
                key={file.path}
                code={file.source}
                highlightedHtml={file.highlightedHtml}
                header={<SourceFileHeader path={getManualInstallFilePath(file)} />}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This item installs metadata only and does not publish files.
          </p>
        )}
      </ManualInstallStep>

      <ManualInstallStep
        last
        number={importStepNumber}
        title="Update the import paths to match your project setup."
      />
    </ol>
  );
}

export function getManualPackageInstallCommand(
  item: Pick<ManualInstallItem, "dependencies" | "devDependencies">,
  packageManager: PackageManager,
): string {
  return getPackageInstallCommands(item, packageManager).join("\n");
}

function ManualInstallStep({ children, last = false, number, title }: ManualInstallStepProps) {
  return (
    <li className="grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[2rem_minmax(0,1fr)] sm:gap-x-4">
      <div className="relative row-span-2 flex justify-center">
        {!last ? (
          <span
            className="absolute top-8 bottom-[-1.75rem] hidden w-px bg-border sm:block"
            aria-hidden="true"
          />
        ) : null}
        <span className="relative z-10 flex size-7 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          {number}
        </span>
      </div>
      <p className="min-w-0 text-base leading-7 text-foreground">{title}</p>
      {children ? (
        <div className="col-span-2 mt-4 min-w-0 sm:col-span-1 sm:col-start-2">{children}</div>
      ) : null}
    </li>
  );
}

function SourceFileHeader({ path }: { path: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <IconFileCode aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate font-mono text-[13px] text-foreground/80">{path}</span>
    </span>
  );
}

function getManualInstallFilePath(file: Pick<ManualInstallSourceFile, "path" | "target">): string {
  return file.target ?? file.path;
}
