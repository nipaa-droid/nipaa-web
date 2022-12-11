import { CSSProperties } from "react";

export type WithStyles<T> = T & {
  styles: CSSProperties;
};

export type WithClassname<T> = T & {
  className: string;
};
