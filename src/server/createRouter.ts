import { Context } from "./context";
import * as trpc from "@trpc/server";
import { OpenApiMeta } from "trpc-openapi";

/**
 * Helper function to create a router with context
 */
export const createRouter = () => trpc.router<Context, OpenApiMeta>();
