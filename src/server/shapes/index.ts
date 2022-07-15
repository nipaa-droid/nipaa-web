import { z } from "zod";

export const shapeWithID = {
  id: z.string(),
};

export const shapeWithHash = {
  hash: z.string().length(32),
};

export const shapeWithSSID = {
  ssid: z.string().length(36),
};

export const shapeWithSecret = {
  secret: z.string(),
};

export const shapeWithUserID = {
  userID: z.string(),
};

export const shapeWithUsername = {
  username: z.string().min(4).max(16).trim(),
};

export const shapeWithPassword = {
  password: z.string().min(8).max(32),
};

export const shapeWithEmail = {
  email: z.string().email(),
};

export const shapeWithUsernameWithPassword = {
  ...shapeWithUsername,
  ...shapeWithPassword,
};

export const shapeWithAuthentication = {
  ...shapeWithEmail,
  ...shapeWithUsernameWithPassword,
};
