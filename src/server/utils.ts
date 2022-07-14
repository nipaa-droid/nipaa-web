import { z } from "zod";
import { MaybeExtend } from "../utils/types";
import { shapeWithSecret } from "./shapes";

export type InputWithSecret = z.infer<z.ZodObject<typeof shapeWithSecret>>;

export const validateSecret = (input: MaybeExtend<InputWithSecret>) => {
  const { secret } = input;
  return secret === process.env.APP_SECRET;
};
