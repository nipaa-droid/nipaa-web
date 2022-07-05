import { HTTPMethod } from "../../http/HttpMethod";
import { createRouter } from "../createRouter";
import {
  protectRouteWithAuthentication,
  protectRouteWithMethods,
} from "../middlewares";
import { schemaWithHash } from "../schemas";

export const getRankRouter = protectRouteWithAuthentication(
  protectRouteWithMethods(createRouter(), [HTTPMethod.POST])
).query("getrank", {
  input: schemaWithHash,
  async resolve({ input, ctx }) {},
});
