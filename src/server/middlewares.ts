import { ProcedureType } from "@trpc/server";
import { ProcedureResolver } from "@trpc/server/dist/declarations/src/internals/procedure";
import { TRPC_ERRORS } from "./errors";
import { InputWithSecret, validateSecret } from "./utils";

export type ProcedureResolverArguments<C, I, T extends ProcedureType> = {
  input: I;
  ctx: C;
  type: T;
};

export type ServerSideMiddlewareArguments<
  C,
  I,
  T extends ProcedureType,
  O
> = ProcedureResolverArguments<C, I, T> & { next: ProcedureResolver<C, I, O> };

export type ServerSideMiddleWare = <C, I, T extends ProcedureType, O>(
  args: ServerSideMiddlewareArguments<C, I, T, O>
) => Promise<O>;

// We can't use trpc middlewares for that since we don't have access to input on backend trpc requests
export const requiredApplicationSecretMiddleware = async <
  C,
  I extends InputWithSecret,
  T extends ProcedureType,
  O
>({
  input,
  ctx,
  type,
  next,
}: ServerSideMiddlewareArguments<C, I, T, O>): Promise<O> => {
  if (!validateSecret(input)) {
    throw TRPC_ERRORS.UNAUTHORIZED;
  }

  return await next({ ctx, input, type });
};
