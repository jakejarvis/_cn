import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { ManualInstallation } from "./manual-install";

describe("manual installation", () => {
  test("renders dependency install step before source files", () => {
    const html = renderToStaticMarkup(
      <ManualInstallation
        item={{
          dependencies: ["radix-ui"],
          sourceFiles: [
            {
              path: "components/ui/fixture-widget.tsx",
              source: "export function FixtureWidget() { return null }",
              highlightedHtml: "<pre>export function FixtureWidget() { return null }</pre>",
            },
          ],
        }}
      />,
    );

    expect(html).toContain("Install the following dependencies:");
    expect(html).toContain("npm install radix-ui");
    expect(html).toContain("Copy and paste the following code into your project.");
    expect(html).toContain("components/ui/fixture-widget.tsx");
    expect(html).toContain("Update the import paths to match your project setup.");
    expect(html.indexOf("Install the following dependencies:")).toBeLessThan(
      html.indexOf("Copy and paste the following code into your project."),
    );
    expect(html.indexOf("Copy and paste the following code into your project.")).toBeLessThan(
      html.indexOf("Update the import paths to match your project setup."),
    );
  });

  test("skips the dependency step when no package dependencies exist", () => {
    const html = renderToStaticMarkup(
      <ManualInstallation
        item={{
          sourceFiles: [
            {
              path: "hooks/use-fixture-state.ts",
              source: "export function useFixtureState() {}",
            },
          ],
        }}
      />,
    );

    expect(html).not.toContain("Install the following dependencies:");
    expect(html).not.toContain("npm install");
    expect(html).toContain(">1</span>");
    expect(html).toContain("Copy and paste the following code into your project.");
    expect(html).toContain(">2</span>");
    expect(html).toContain("Update the import paths to match your project setup.");
  });

  test("renders multiple source file labels", () => {
    const html = renderToStaticMarkup(
      <ManualInstallation
        item={{
          sourceFiles: [
            {
              path: "components/fixture-panel.tsx",
              source: "export function FixturePanel() { return null }",
            },
            {
              path: "registry-source/fixture-data.ts",
              source: "export const fixtureData = []",
              target: "lib/fixture-data.ts",
            },
          ],
        }}
      />,
    );

    expect(html).toContain("components/fixture-panel.tsx");
    expect(html).toContain("lib/fixture-data.ts");
    expect(html).not.toContain("registry-source/fixture-data.ts");
  });

  test("preserves the metadata-only fallback and final import reminder", () => {
    const html = renderToStaticMarkup(
      <ManualInstallation
        item={{
          sourceFiles: [],
        }}
      />,
    );

    expect(html).toContain("This item installs metadata only and does not publish files.");
    expect(html).toContain("Update the import paths to match your project setup.");
  });
});
