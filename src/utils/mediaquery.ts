import { mediaBreakPoints } from "./breakpoints";

type MediaQueryKey = keyof typeof mediaBreakPoints;

const rawMediaQuery: Record<string, string> = {
  minWidth: "min-width",
  maxWidth: "max-width",
  minHeight: "min-height",
  maxHeight: "max-height",
};

export const translateMediaQuery = (
  query:
    | {
    minWidth: MediaQueryKey;
  }
    | {
    maxWidth: MediaQueryKey;
  }
    | {
    minHeight: MediaQueryKey;
  }
    | { maxHeight: MediaQueryKey }
) => {
  let result = "";
  Object.keys(query).forEach((key) => {
    const rawString = rawMediaQuery[key];
    const selectedBreakPoint = query[key as never];
    result = `(${rawString}: ${mediaBreakPoints[selectedBreakPoint]}px)`;
  });
  return result;
};
