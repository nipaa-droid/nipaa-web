export type NonNullableKeys<T, K extends (keyof T)[]> = {
  [P in keyof T]: P;
} & {
  [P in K[number]]-?: NonNullable<T[P]>;
};

export type Tuple<
  T,
  N extends number,
  R extends readonly T[] = []
> = R["length"] extends N ? R : Tuple<T, N, readonly [T, ...R]>;

export type NonEmptyArray<T> = {
  0: T;
} & Array<T>;
