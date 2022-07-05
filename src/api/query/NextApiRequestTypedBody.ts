import type { NextApiRequest } from "next";

export type OmittedBodyNextApiRequest = Omit<NextApiRequest, "body">;

export type ValidatedNextApiRequestTypedBody<T> = {
  body: T;
} & OmittedBodyNextApiRequest;

export type NextApiRequestTypedBody<T> = {
  body: Partial<T>;
} & OmittedBodyNextApiRequest;
