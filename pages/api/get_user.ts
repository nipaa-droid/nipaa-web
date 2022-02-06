import "reflect-metadata";

import HTTPMethod from "../../shared/api/enums/HttpMethod";
import HttpStatusCode from "../../shared/api/enums/HttpStatusCodes";
import NextApiRequestTypedBody from "../../shared/api/query/NextApiRequestTypedBody";
import RequestHandler from "../../shared/api/request/RequestHandler";
import OsuDroidUser from "../../shared/database/entities/OsuDroidUser";
import IHasID from "../../shared/interfaces/IHasID";
import RequestValidator from "../../shared/type/RequestValidator";
import Database from "../../shared/database/Database";
import JsonResponse from "../../shared/api/response/JsonResponse";
import JsonErrors from "../../shared/api/response/JsonErrors";
import Responses from "../../shared/api/response/Responses";

export default async function handler(
  req: NextApiRequestTypedBody<IHasID>,
  res: JsonResponse<Partial<OsuDroidUser>>
) {
  await Database.getConnection();

  if (RequestHandler.endWhenInvalidHttpMethod(req, res, HTTPMethod.GET)) {
    return;
  }

  if (!RequestValidator.hasNumericID(req)) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({
      error: JsonErrors.INVALID_DATA_TYPE(),
    });
  }

  const { id } = req.body;

  const user = await OsuDroidUser.findOne(id, {
    select: ["username", "lastSeen"],
  });

  if (!user) {
    res.status(HttpStatusCode.BAD_REQUEST).json({
      error: Responses.USER_NOT_FOUND,
    });
    return;
  }

  res.status(HttpStatusCode.OK).json({ data: user });
}
