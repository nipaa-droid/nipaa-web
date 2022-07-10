import { z, ZodRawShape } from "zod";

export const shapeWithID: ZodRawShape = {
  id: z.string(),
};

export const shapeWithHash: ZodRawShape = {
  hash: z.string().length(32),
};

export const shapeWithSSID: ZodRawShape = {
  ssid: z.string().length(36),
};

export const shapeWithUserID: ZodRawShape = {
  userID: z.string(),
};

export const shapeWithUsername: ZodRawShape = {
  username: z.string().min(4).max(16),
};

export const shapeWithPassword: ZodRawShape = {
  password: z.string().min(8).max(32),
};

export const shapeWithEmail: ZodRawShape = {
  email: z.string().email(),
};

export const shapeWithUsernameWithPassword: ZodRawShape = {
  ...shapeWithUsername,
  ...shapeWithPassword,
};

export const shapeWithAuthentication: ZodRawShape = {
  ...shapeWithEmail,
  ...shapeWithUsernameWithPassword,
};
