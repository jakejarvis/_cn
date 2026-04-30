"use client";

import { IconChevronDown } from "@tabler/icons-react";
import type { ReactElement, SVGProps } from "react";

import { siteConfig } from "../../lib/site-config";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";
import { CopyButton } from "../ui/copy-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type DocsPageActionsProps = {
  markdownPath: string;
  pageDescription: string;
  pageTitle: string;
  pageUrl: string;
  registryItemJsonUrl?: string;
  className?: string;
};

type DocsPageActionUrls = Pick<
  DocsPageActionsProps,
  "markdownPath" | "pageDescription" | "pageTitle" | "pageUrl" | "registryItemJsonUrl"
>;

type DocsPageActionLink = {
  label: string;
  href: string;
};

type MenuItem = {
  label: string;
  href: (urls: DocsPageActionUrls) => string | null;
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
};

const menuItems: readonly MenuItem[] = [
  {
    label: "View as Markdown",
    href: ({ markdownPath }) => markdownPath,
    icon: MarkdownIcon,
  },
  {
    label: "Open in v0",
    href: ({ pageDescription, pageTitle, registryItemJsonUrl }) =>
      registryItemJsonUrl
        ? getV0RegistryItemUrl({
            prompt: pageDescription,
            registryItemJsonUrl,
            title: pageTitle,
          })
        : null,
    icon: V0Icon,
  },
  {
    label: "Open in ChatGPT",
    href: ({ pageUrl }) => getPromptUrl("https://chatgpt.com", pageUrl),
    icon: ChatGPTIcon,
  },
  {
    label: "Open in Claude",
    href: ({ pageUrl }) => getPromptUrl("https://claude.ai/new", pageUrl),
    icon: ClaudeIcon,
  },
  {
    label: "Open in Perplexity",
    href: ({ pageUrl }) => getPromptUrl("https://www.perplexity.ai/search", pageUrl),
    icon: PerplexityIcon,
  },
];

export function DocsPageActions({
  markdownPath,
  pageDescription,
  pageTitle,
  pageUrl,
  registryItemJsonUrl,
  className,
}: DocsPageActionsProps) {
  return (
    <ButtonGroup
      className={cn(
        "[&_svg:not([class*='size-'])]:size-4! [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
    >
      <CopyButton
        value={() => getDocsPageMarkdown(markdownPath)}
        showLabel
        copyLabel="Copy Page"
        copiedLabel="Copied"
        variant="outline"
        size="default"
        className="px-2.5!"
      />
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="icon" variant="outline" />}>
          <IconChevronDown data-icon aria-hidden="true" />
          <span className="sr-only">Open page actions menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuGroup>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const href = item.href({
                markdownPath,
                pageDescription,
                pageTitle,
                pageUrl,
                registryItemJsonUrl,
              });

              if (!href) {
                return null;
              }

              return (
                <DropdownMenuItem
                  key={item.label}
                  className="cursor-pointer gap-2 px-2 py-1.5 [&_svg:not([class*='text-'])]:text-muted-foreground"
                  render={<a href={href} target="_blank" rel="noopener noreferrer" />}
                >
                  <Icon aria-hidden="true" data-icon="inline-start" />
                  <span>{item.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}

export function getDocsPageActionLinks(urls: DocsPageActionUrls): DocsPageActionLink[] {
  return menuItems.flatMap((item) => {
    const href = item.href(urls);

    return href ? [{ label: item.label, href }] : [];
  });
}

export async function getDocsPageMarkdown(markdownPath: string): Promise<string> {
  const response = await fetch(markdownPath, {
    headers: {
      Accept: "text/markdown",
    },
  });

  if (!response.ok) {
    throw new Error("Page markdown is unavailable.");
  }

  return response.text();
}

function getPromptUrl(baseUrl: string, url: string): string {
  const promptUrl = new URL(baseUrl);
  const prompt = `I have questions about this documentation page for the shadcn-compatible ${siteConfig.name} registry: ${url}

Study it and let me know when you're ready to answer my questions.`;

  promptUrl.searchParams.set("q", prompt);

  return promptUrl.toString();
}

function getV0RegistryItemUrl({
  prompt,
  registryItemJsonUrl,
  title,
}: {
  prompt: string;
  registryItemJsonUrl: string;
  title: string;
}): string {
  const openUrl = new URL("https://v0.dev/chat/api/open");

  openUrl.searchParams.set("url", registryItemJsonUrl);
  openUrl.searchParams.set("title", title.trim());
  openUrl.searchParams.set("prompt", prompt.trim());

  return openUrl.toString();
}

function MarkdownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg strokeLinejoin="round" viewBox="0 0 22 16" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.5 2.25H2.5C1.80964 2.25 1.25 2.80964 1.25 3.5V12.5C1.25 13.1904 1.80964 13.75 2.5 13.75H19.5C20.1904 13.75 20.75 13.1904 20.75 12.5V3.5C20.75 2.80964 20.1904 2.25 19.5 2.25ZM2.5 1C1.11929 1 0 2.11929 0 3.5V12.5C0 13.8807 1.11929 15 2.5 15H19.5C20.8807 15 22 13.8807 22 12.5V3.5C22 2.11929 20.8807 1 19.5 1H2.5ZM3 4.5H4H4.25H4.6899L4.98715 4.82428L7 7.02011L9.01285 4.82428L9.3101 4.5H9.75H10H11V5.5V11.5H9V7.79807L7.73715 9.17572L7 9.97989L6.26285 9.17572L5 7.79807V11.5H3V5.5V4.5ZM15 8V4.5H17V8H19.5L17 10.5L16 11.5L15 10.5L12.5 8H15Z"
        fill="currentColor"
      />
    </svg>
  );
}

function V0Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" {...props}>
      <path
        clipRule="evenodd"
        d="M9.50321 5.5H13.2532C13.3123 5.5 13.3704 5.5041 13.4273 5.51203L9.51242 9.42692C9.50424 9.36912 9.5 9.31006 9.5 9.25L9.5 5.5L8 5.5L8 9.25C8 10.7688 9.23122 12 10.75 12H14.5V10.5L10.75 10.5C10.6899 10.5 10.6309 10.4958 10.5731 10.4876L14.4904 6.57028C14.4988 6.62897 14.5032 6.68897 14.5032 6.75V10.5H16.0032V6.75C16.0032 5.23122 14.772 4 13.2532 4H9.50321V5.5ZM0 5V5.00405L5.12525 11.5307C5.74119 12.3151 7.00106 11.8795 7.00106 10.8822V5H5.50106V9.58056L1.90404 5H0Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

function ChatGPTIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClaudeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        d="m4.714 15.956 4.718-2.648.079-.23-.08-.128h-.23l-.79-.048-2.695-.073-2.337-.097-2.265-.122-.57-.121-.535-.704.055-.353.48-.321.685.06 1.518.104 2.277.157 1.651.098 2.447.255h.389l.054-.158-.133-.097-.103-.098-2.356-1.596-2.55-1.688-1.336-.972-.722-.491L2 6.223l-.158-1.008.655-.722.88.06.225.061.893.686 1.906 1.476 2.49 1.833.364.304.146-.104.018-.072-.164-.274-1.354-2.446-1.445-2.49-.644-1.032-.17-.619a2.972 2.972 0 0 1-.103-.729L6.287.133 6.7 0l.995.134.42.364.619 1.415L9.735 4.14l1.555 3.03.455.898.243.832.09.255h.159V9.01l.127-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.583.28.48.685-.067.444-.286 1.851-.558 2.903-.365 1.942h.213l.243-.242.983-1.306 1.652-2.064.728-.82.85-.904.547-.431h1.032l.759 1.129-.34 1.166-1.063 1.347-.88 1.142-1.263 1.7-.79 1.36.074.11.188-.02 2.853-.606 1.542-.28 1.84-.315.832.388.09.395-.327.807-1.967.486-2.307.462-3.436.813-.043.03.049.061 1.548.146.662.036h1.62l3.018.225.79.522.473.638-.08.485-1.213.62-1.64-.389-3.825-.91-1.31-.329h-.183v.11l1.093 1.068 2.003 1.81 2.508 2.33.127.578-.321.455-.34-.049-2.204-1.657-.85-.747-1.925-1.62h-.127v.17l.443.649 2.343 3.521.122 1.08-.17.353-.607.213-.668-.122-1.372-1.924-1.415-2.168-1.141-1.943-.14.08-.674 7.254-.316.37-.728.28-.607-.461-.322-.747.322-1.476.388-1.924.316-1.53.285-1.9.17-.632-.012-.042-.14.018-1.432 1.967-2.18 2.945-1.724 1.845-.413.164-.716-.37.066-.662.401-.589 2.386-3.036 1.439-1.882.929-1.086-.006-.158h-.055L4.138 18.56l-1.13.146-.485-.456.06-.746.231-.243 1.907-1.312Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PerplexityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8 .188a.5.5 0 0 1 .503.5V4.03l3.022-2.92l.059-.048a.51.51 0 0 1 .49-.054a.5.5 0 0 1 .306.46v3.247h1.117l.1.01a.5.5 0 0 1 .403.49v5.558a.5.5 0 0 1-.503.5H12.38v3.258a.5.5 0 0 1-.312.462a.51.51 0 0 1-.55-.11l-3.016-3.018v3.448c0 .275-.225.5-.503.5a.5.5 0 0 1-.503-.5v-3.448l-3.018 3.019a.51.51 0 0 1-.548.11a.5.5 0 0 1-.312-.463v-3.258H2.503a.5.5 0 0 1-.503-.5V5.215l.01-.1c.047-.229.25-.4.493-.4H3.62V1.469l.006-.074a.5.5 0 0 1 .302-.387a.51.51 0 0 1 .547.102l3.023 2.92V.687c0-.276.225-.5.503-.5M4.626 9.333v3.984l2.87-2.872v-4.01zm3.877 1.113l2.871 2.871V9.333l-2.87-2.897zm3.733-1.668a.5.5 0 0 1 .145.35v1.145h.612V5.715H9.201zm-9.23 1.495h.613V9.13c0-.131.052-.257.145-.35l3.033-3.064h-3.79zm1.62-5.558H6.76L4.626 2.652zm4.613 0h2.134V2.652z"
      />
    </svg>
  );
}
