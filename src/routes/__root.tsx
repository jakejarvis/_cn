import { IconArrowRight, IconHome } from "@tabler/icons-react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { NavigationProgress } from "@/components/docs/navigation-progress";
import { SiteFooter } from "@/components/docs/site-footer";
import { SiteHeader } from "@/components/docs/site-header";
import { ThemeProvider } from "@/components/docs/theme-provider";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import type { RegistrySectionId } from "../lib/registry/sections";
import { getJsonLdScripts, getWebSiteJsonLd } from "../lib/seo";
import { siteConfig } from "../lib/site-config";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  headers: () => ({
    Vary: "Accept, User-Agent",
  }),
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: siteConfig.name,
      },
      {
        name: "description",
        content: siteConfig.description,
      },
    ],
    scripts: getJsonLdScripts([getWebSiteJsonLd()]),
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "icon",
        type: "image/x-icon",
        href: "/favicon.ico",
      },
    ],
  }),
  component: RootRoute,
  notFoundComponent: GlobalNotFoundRoute,
  shellComponent: RootDocument,
});

function RootRoute() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <NavigationProgress />
        <div className="flex min-h-svh flex-col">
          <SiteHeader />
          <div className="flex-1">
            <Outlet />
          </div>
          <SiteFooter />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}

function GlobalNotFoundRoute() {
  return (
    <main className="flex min-h-[calc(100svh-9rem)] items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex min-w-0 flex-col items-start gap-6">
          <div className="flex max-w-2xl flex-col gap-4">
            <h1 className="font-heading text-4xl font-semibold">Page not found</h1>
            <p className="max-w-xl text-base text-muted-foreground">
              The page you're looking for isn't here. Start from a known section, or use the search
              box in the header.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" variant="outline" nativeButton={false} render={<Link to="/" />}>
              <IconHome data-icon="inline-start" />
              Go home
            </Button>
          </div>
        </section>

        <aside className="overflow-hidden rounded-lg border bg-background shadow-sm">
          <div className="divide-y">
            <NotFoundPathLink to="/docs" label="Docs" description="Install, theming, CLI" />
            <NotFoundSectionLink
              section="components"
              label="Components"
              description="UI primitives and components"
            />
            <NotFoundSectionLink
              section="blocks"
              label="Blocks"
              description="Composed templates and sections"
            />
            <NotFoundSectionLink
              section="utilities"
              label="Utilities"
              description="Hooks, libraries, themes, and files"
            />
          </div>
        </aside>
      </div>
    </main>
  );
}

function NotFoundPathLink({
  to,
  label,
  description,
}: {
  to: "/" | "/docs";
  label: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="truncate text-sm text-muted-foreground">{description}</span>
      </span>
      <IconArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

function NotFoundSectionLink({
  section,
  label,
  description,
}: {
  section: RegistrySectionId;
  label: string;
  description: string;
}) {
  return (
    <Link
      to="/$section"
      params={{ section }}
      className="group flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="truncate text-sm text-muted-foreground">{description}</span>
      </span>
      <IconArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans [overflow-wrap:anywhere] tabular-nums antialiased">
        {children}
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  );
}
