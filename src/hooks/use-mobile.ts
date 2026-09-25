import * as React from "react";

const MOBILE_BREAKPOINT_QUERY = "(max-width: 63.999rem)";

export function useIsMobile() {
  return React.useSyncExternalStore(subscribeToMobileQuery, getIsMobile, getServerIsMobile);
}

function subscribeToMobileQuery(onChange: () => void): () => void {
  const mql = window.matchMedia(MOBILE_BREAKPOINT_QUERY);

  mql.addEventListener("change", onChange);

  return () => mql.removeEventListener("change", onChange);
}

function getIsMobile(): boolean {
  return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
}

function getServerIsMobile(): boolean {
  return false;
}
