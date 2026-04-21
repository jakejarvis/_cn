import { IconAppWindow, IconCode, IconFiles, IconTerminal } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RegistryItemDetail } from "@/lib/registry/detail.functions";
import type { RegistrySectionConfig } from "@/lib/registry/section-config";

import { CodeBlock } from "./code-block";
import { ComponentPreview } from "./component-preview";
import { DocsPageHeader } from "./docs-page-header";
import { InstallCommand } from "./install-command";

type RegistryItemDocProps = {
  item: RegistryItemDetail;
  section: RegistrySectionConfig["title"];
  sectionPath: RegistrySectionConfig["basePath"];
};

export function RegistryItemDoc({ item, section, sectionPath }: RegistryItemDocProps) {
  return (
    <article className="flex min-w-0 flex-col gap-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={sectionPath} />}>{section}</BreadcrumbLink>
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
        pagePath={`${sectionPath}/${item.name}`}
      />

      <Tabs key={`${sectionPath}:${item.name}:preview`} defaultValue="preview" className="gap-4">
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
          <ComponentPreview preview={item.preview} />
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

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-semibold tracking-tight">Installation</h2>
        <Tabs key={`${sectionPath}:${item.name}:installation`} defaultValue="cli" className="gap-4">
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
            <div className="flex flex-col gap-4">
              {item.sourceFiles.map((file) => (
                <CodeBlock
                  key={file.path}
                  code={file.source}
                  highlightedHtml={file.highlightedHtml}
                />
              ))}
            </div>
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

export function RegistryItemNotFound({
  sectionPath,
}: {
  sectionPath: RegistrySectionConfig["basePath"];
}) {
  return (
    <div className="mt-4 flex flex-col items-start justify-center gap-4">
      <div className="flex max-w-xl flex-col gap-2">
        <h1 className="font-heading text-lg font-semibold">Item not found</h1>
      </div>
      <Button variant="outline" nativeButton={false} render={<Link to={sectionPath} />}>
        Back to overview
      </Button>
    </div>
  );
}
