import * as trpcNext from "@trpc/server/adapters/next";
import * as trpc from "@trpc/server";
import { z } from "zod";
import { NextApiRequest, NextApiResponse } from "next";

const commonRequestSchema = z.object({
  req: z.any(),
  res: z.any(),
});

export function isCommonRequest(
  input: unknown
): input is { req: NextApiRequest; res: NextApiResponse<any> } {
  return commonRequestSchema.safeParse(input).success;
}

export async function createContext(
  options: trpcNext.CreateNextContextOptions
) {
  // Handles client side requests
  if (isCommonRequest(options)) {
    const { req, res } = options;
    return {
      req,
      res,
    };
  }
  return {};
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
