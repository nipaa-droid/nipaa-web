export type NonNullableKeys<T, K extends (keyof T)[]> = {
  [P in keyof T]: P;
} & {
  [P in K[number]]-?: NonNullable<T[P]>;
};
