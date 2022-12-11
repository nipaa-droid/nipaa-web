import { z } from "zod";

export const fileWithModifiedDateSchema = z.object({
  lastModifiedDate: z.date(),
});
