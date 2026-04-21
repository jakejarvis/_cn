import { IconArrowRight, IconBlocks, IconHome } from "@tabler/icons-react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { SiteFooter } from "@/components/docs/site-footer";
import { SiteHeader } from "@/components/docs/site-header";
import { ThemeProvider, themeScript } from "@/components/docs/theme-provider";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getJsonLdScripts, getWebSiteJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
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
          <div className="inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1 text-sm font-medium text-muted-foreground">
            <span>404</span>
          </div>
          <div className="flex max-w-2xl flex-col gap-4">
            <h1 className="font-heading text-4xl font-semibold">
              This route is not in the registry.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground">
              The page you followed is not published here. Start from a known section, or use the
              search shortcut in the header.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" nativeButton={false} render={<Link to="/" />}>
              <IconHome data-icon="inline-start" />
              Home
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link to="/docs" />}>
              Docs
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link to="/components" />}
            >
              <IconBlocks data-icon="inline-start" />
              Registry
            </Button>
          </div>
        </section>

        <aside className="overflow-hidden rounded-lg border bg-background shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-mono text-xs font-medium text-muted-foreground">route map</span>
            <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
              missing
            </span>
          </div>
          <div className="divide-y">
            <NotFoundPathLink to="/docs" label="Docs" description="Install, theming, CLI" />
            <NotFoundPathLink
              to="/components"
              label="Components"
              description="Reusable UI primitives"
            />
            <NotFoundPathLink to="/blocks" label="Blocks" description="Composed patterns" />
            <NotFoundPathLink to="/utilities" label="Utilities" description="Hooks and helpers" />
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
  to: "/" | "/docs" | "/components" | "/blocks" | "/utilities";
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

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
