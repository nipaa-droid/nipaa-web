import { z } from "zod";

export const schemaWithID = z.object({
  id: z.string(),
});

export const schemaWithHash = z.object({
  hash: z.string(),
});

export const schemaWithSSID = z.object({
  ssid: z.string(),
});

export const schemaWithUserID = z.object({
  userID: z.number(),
});
