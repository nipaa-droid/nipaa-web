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

export const schemaWithUsername = z.object({
  username: z.string().min(4).max(16),
});

export const schemaWithPassword = z.object({
  password: z.string().min(8).max(32),
});

export const schemaWithEmail = z.object({
  email: z.string().email(),
});

export const schemaWithUsernameWithPassword =
  schemaWithUsername.and(schemaWithPassword);

export const schemaWithAuth =
  schemaWithUsernameWithPassword.and(schemaWithEmail);
