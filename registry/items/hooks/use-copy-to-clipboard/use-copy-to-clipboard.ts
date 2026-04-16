"use client";

import * as React from "react";

type CopyState =
  | {
      status: "idle";
      value: null;
      error: null;
    }
  | {
      status: "copied";
      value: string;
      error: null;
    }
  | {
      status: "error";
      value: null;
      error: Error;
    };

function useCopyToClipboard() {
  const [state, setState] = React.useState<CopyState>({
    status: "idle",
    value: null,
    error: null,
  });

  const copy = React.useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setState({ status: "copied", value, error: null });
      return true;
    } catch (error) {
      const copyError = error instanceof Error ? error : new Error("Copy failed.");

      setState({ status: "error", value: null, error: copyError });
      return false;
    }
  }, []);

  const reset = React.useCallback(() => {
    setState({ status: "idle", value: null, error: null });
  }, []);

  return { ...state, copy, reset };
}

export { useCopyToClipboard, type CopyState };
