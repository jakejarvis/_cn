import { IconAppWindow, IconCode, IconFiles, IconTerminal } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

import type { RegistryItemDetail } from "../../lib/registry/detail.server";
import { getRegistryItemRoutePath, getRegistrySectionForType } from "../../lib/registry/sections";
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
  const section = getRegistrySectionForType(item.type);
  const pagePath = getRegistryItemRoutePath(item);

  return (
    <article className="flex min-w-0 flex-col gap-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/$section" params={{ section: section.id }} />}>
              {section.title}
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
        pagePath={pagePath}
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

      {item.usage ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-xl font-semibold tracking-tight">Usage</h2>
          {item.usage}
        </section>
      ) : null}
    </article>
  );
}

export function RegistryItemNotFound() {
  return (
    <div className="mt-4 flex flex-col items-start justify-center gap-4">
      <div className="flex max-w-xl flex-col gap-2">
        <h1 className="font-heading text-lg font-semibold">Item not found</h1>
      </div>
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link to="/$section" params={{ section: "components" }} />}
      >
        Back to overview
      </Button>
    </div>
  );
}
