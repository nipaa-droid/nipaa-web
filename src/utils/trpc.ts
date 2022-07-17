import { createReactQueryHooks } from "@trpc/react";
import { UseMutationResult, UseQueryResult } from "react-query";
import { AppRouter } from "../server/routers/_app";

export const trpc = createReactQueryHooks<AppRouter>();

export type AnyMutation = UseMutationResult<any, { message: string }, any, any>;

export type AnyQuery = UseQueryResult<any, any>;
