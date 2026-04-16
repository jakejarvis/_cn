"use client";

import * as React from "react";

const HOVER_QUERY = "(hover: hover)";
const COARSE_POINTER_QUERY = "(pointer: coarse)";

type PointerCapability = {
  supportsHover: boolean;
  isCoarsePointer: boolean;
  isTouchDevice: boolean;
};

export function usePointerCapability(): PointerCapability {
  const supportsHover = useMediaQuery(HOVER_QUERY);
  const isCoarsePointer = useMediaQuery(COARSE_POINTER_QUERY);

  return {
    supportsHover: supportsHover ?? false,
    isCoarsePointer: isCoarsePointer ?? false,
    isTouchDevice: supportsHover === false || isCoarsePointer === true,
  };
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean>();

  React.useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQueryList.matches);

    updateMatches();
    mediaQueryList.addEventListener("change", updateMatches);

    return () => mediaQueryList.removeEventListener("change", updateMatches);
  }, [query]);

  return matches;
}
