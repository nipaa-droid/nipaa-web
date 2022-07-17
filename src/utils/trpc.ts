import { createReactQueryHooks } from "@trpc/react";
import { UseMutationResult, UseQueryResult } from "react-query";
import { AppRouter } from "../server/routers/_app";

export const trpc = createReactQueryHooks<AppRouter>();

type AnyError = { message: string };

export type AnyMutation = UseMutationResult<any, AnyError, any, any>;

export type AnyQuery = UseQueryResult<any, AnyError>;
