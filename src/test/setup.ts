import { afterEach, beforeEach, vi } from "vitest";

const fixedTestTime = new Date("2025-01-01T00:00:00.000Z");

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

beforeEach(() => {
  vi.setSystemTime(fixedTestTime);
  vi.stubGlobal("fetch", createUnexpectedFetchMock());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function createUnexpectedFetchMock(): FetchMock {
  return vi.fn<FetchMock>((input) =>
    Promise.reject(
      new Error(
        `Unexpected network request in test: ${formatRequestInput(
          input,
        )}. Mock fetch explicitly in the test.`,
      ),
    ),
  );
}

function formatRequestInput(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}
