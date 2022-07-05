import { z } from "zod";

export const schemaWithID = z.object({
  id: z.string(),
});

export const schemaWithHash = z.object({
  hash: z.string(),
});
