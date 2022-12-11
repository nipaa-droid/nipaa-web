import * as trpc from "@trpc/server";

export const TRPC_ERRORS = {
	METHOD_NOT_SUPPORTED: new trpc.TRPCError({ code: "METHOD_NOT_SUPPORTED" }),
	UNAUTHORIZED: new trpc.TRPCError({ code: "UNAUTHORIZED" }),
};
