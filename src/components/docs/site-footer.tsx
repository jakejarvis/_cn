import { IconArrowUpRight } from "@tabler/icons-react";

export function SiteFooter() {
  return (
    <footer className="mt-10">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-center px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
        <a
          href="https://github.com/jakejarvis/_cn"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Powered by _cn
          <IconArrowUpRight className="ml-[1px] inline-block size-3 translate-y-[-1px]" />
        </a>
      </div>
    </footer>
  );
}
