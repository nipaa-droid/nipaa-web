import { createReactQueryHooks } from "@trpc/react";
import { AppRouter } from "../../pages/api/trpc/[trcp]";

export const trpc = createReactQueryHooks<AppRouter>();
