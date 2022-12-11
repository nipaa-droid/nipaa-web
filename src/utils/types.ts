export type NonNullableKeys<T, K extends keyof T> = Omit<T, K> &
	Required<Pick<T, K>>;

export type NonNullableRequired<T> = {
	[P in keyof T]-?: NonNullable<T[P]>;
};

export type UndefinableKeys<T, K extends keyof T> = Omit<T, K> &
	Partial<Pick<T, K>>;

export type NullableKeys<T, K extends keyof T> = Omit<T, K> & {
	[P in K]: T[P] | null;
};

export type Tuple<
	T,
	N extends number,
	R extends readonly T[] = []
> = R["length"] extends N ? R : Tuple<T, N, readonly [T, ...R]>;

export type NonEmptyArray<T> = {
	0: T;
} & Array<T>;

export type AtLeast<T, K extends keyof T> = Partial<T> &
	NonNullableRequired<Pick<T, K>>;

export type MustHave<T, K extends keyof T> = T &
	NonNullableRequired<Pick<T, K>>;

export type MaybeExtend<T> = T & Record<never, unknown>;
