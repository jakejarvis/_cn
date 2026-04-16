import { IconBlocks, IconBrandGithub } from "@tabler/icons-react";
import { Link, createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { getRegistrySectionsWithItems } from "@/lib/registry/sections";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  const firstSection = getRegistrySectionsWithItems()[0];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 sm:py-32">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="font-mono text-2xl font-bold tracking-tighter sm:text-3xl">
          {siteConfig.name}
        </h1>
        <p className="max-w-lg text-base text-muted-foreground">{siteConfig.description}</p>
        <div className="flex items-center gap-3">
          {firstSection ? (
            <Button size="lg" nativeButton={false} render={<Link to={firstSection.basePath} />}>
              <IconBlocks data-icon="inline-start" />
              Browse
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<a href={siteConfig.repositoryUrl} target="_blank" rel="noopener noreferrer" />}
          >
            <IconBrandGithub data-icon="inline-start" />
            GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
