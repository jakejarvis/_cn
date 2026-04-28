import {
  IconAppWindow,
  IconCode,
  IconFiles,
  IconInfoCircle,
  IconTerminal,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

import type { RegistryItemDetail } from "../../lib/registry/detail.server";
import { getRegistryTypeLabel, registryCatalog } from "../../lib/registry/item-types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { CodeBlock } from "./code-block";
import { ComponentPreview } from "./component-preview";
import { DocsPageHeader } from "./docs-page-header";
import { InstallCommand } from "./install-command";

type RegistryItemDocProps = {
  item: RegistryItemDetail;
};

export function RegistryItemDoc({ item }: RegistryItemDocProps) {
  return (
    <article className="flex min-w-0 flex-col gap-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/registry" />}>
              {registryCatalog.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{item.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <DocsPageHeader
        title={item.title}
        description={item.description}
        pagePath={`${registryCatalog.basePath}/${item.name}`}
        registryItemName={item.name}
      />

      {item.hasPreview ? (
        <Tabs key={`${item.name}:preview`} defaultValue="preview" className="gap-4">
          <TabsList variant="line">
            <TabsTrigger value="preview">
              <IconAppWindow data-icon="inline-start" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code">
              <IconCode data-icon="inline-start" />
              Code
            </TabsTrigger>
          </TabsList>
          <TabsContent value="preview">
            <ComponentPreview preview={item.preview ?? null} />
          </TabsContent>
          <TabsContent value="code">
            {item.previewSourceFile.source ? (
              <CodeBlock
                code={item.previewSourceFile.source}
                highlightedHtml={item.previewSourceFile.highlightedHtml}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No preview source is available.</p>
            )}
          </TabsContent>
        </Tabs>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-semibold tracking-tight">Installation</h2>
        <Tabs key={`${item.name}:installation`} defaultValue="cli" className="gap-4">
          <TabsList variant="line">
            <TabsTrigger value="cli">
              <IconTerminal data-icon="inline-start" />
              CLI
            </TabsTrigger>
            <TabsTrigger value="manual">
              <IconFiles data-icon="inline-start" />
              Manual
            </TabsTrigger>
          </TabsList>
          <TabsContent value="cli">
            <InstallCommand item={item} />
          </TabsContent>
          <TabsContent value="manual">
            {item.sourceFiles.length > 0 ? (
              <div className="flex flex-col gap-4">
                {item.sourceFiles.map((file) => (
                  <CodeBlock
                    key={file.path}
                    code={file.source}
                    highlightedHtml={file.highlightedHtml}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This item installs metadata only and does not publish files.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <RegistryItemMetadata item={item} />

      {item.usage ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-xl font-semibold tracking-tight">Usage</h2>
          {item.usage}
        </section>
      ) : null}
    </article>
  );
}

function RegistryItemMetadata({ item }: { item: RegistryItemDetail }) {
  const metadataRows: [string, string][] = [
    ["Type", getRegistryTypeLabel(item.type)],
    ["Name", item.name],
  ];
  const dependencyRows: [string, string][] = [];

  if (item.author) metadataRows.push(["Author", item.author]);
  if (item.extends) metadataRows.push(["Extends", item.extends]);
  if (item.categories?.length) metadataRows.push(["Categories", item.categories.join(", ")]);
  if (item.font) metadataRows.push(["Font", item.font.family]);

  if (item.dependencies?.length) {
    dependencyRows.push(["Dependencies", item.dependencies.join(", ")]);
  }

  if (item.devDependencies?.length) {
    dependencyRows.push(["Dev dependencies", item.devDependencies.join(", ")]);
  }

  if (item.registryDependencies?.length) {
    dependencyRows.push(["Registry dependencies", item.registryDependencies.join(", ")]);
  }

  if (item.envVars) {
    dependencyRows.push(["Environment variables", Object.keys(item.envVars).join(", ")]);
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-xl font-semibold tracking-tight">Details</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <MetadataTable title="Metadata" rows={metadataRows} />
        <MetadataTable
          title="Dependencies"
          rows={dependencyRows.length > 0 ? dependencyRows : [["Dependencies", "None"]]}
        />
      </div>
      {item.files.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center gap-2 border-b px-3 py-2 text-sm font-medium">
            <IconFiles className="size-4" />
            Files
          </div>
          <div className="divide-y">
            {item.files.map((file) => (
              <div key={file.path} className="grid gap-1 px-3 py-2 text-sm">
                <span className="font-mono text-xs">{file.path}</span>
                <span className="text-xs text-muted-foreground">
                  {file.type}
                  {file.target ? ` -> ${file.target}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MetadataTable({
  title,
  rows,
}: {
  title: string;
  rows: readonly (readonly [string, string])[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-sm font-medium">
        <IconInfoCircle className="size-4" />
        {title}
      </div>
      <dl className="divide-y">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 px-3 py-2 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function RegistryItemNotFound() {
  return (
    <div className="mt-4 flex flex-col items-start justify-center gap-4">
      <div className="flex max-w-xl flex-col gap-2">
        <h1 className="font-heading text-lg font-semibold">Item not found</h1>
      </div>
      <Button variant="outline" nativeButton={false} render={<Link to="/registry" />}>
        Back to overview
      </Button>
    </div>
  );
}
