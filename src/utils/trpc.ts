import { createReactQueryHooks } from "@trpc/react";
import { UseMutationResult, UseQueryResult } from "react-query";
import { Context } from "../server/context";
import { AppRouter } from "../server/routers/_app";

export const trpc = createReactQueryHooks<AppRouter>();

export type AnyReactQueryError = { message: string };

export type AnyMutation = UseMutationResult<any, AnyReactQueryError, any, any>;

export type AnyQuery = UseQueryResult<any, AnyReactQueryError>;

export type ObjectWithContext<C extends Context> = { ctx: C };
