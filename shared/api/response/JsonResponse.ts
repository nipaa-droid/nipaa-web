import { NextApiResponse } from "next";

export type JsonResponse<T> = NextApiResponse<{
  data?: T;
  error?: string;
}>;
