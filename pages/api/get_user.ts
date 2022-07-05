import { OsuDroidUser } from "@prisma/client";
import { NextApiRequestTypedBody } from "../../src/api/query/NextApiRequestTypedBody";
import { RequestHandler } from "../../src/api/request/RequestHandler";
import { JsonErrors } from "../../src/api/response/JsonErrors";
import { JsonResponse } from "../../src/api/response/JsonResponse";
import { Responses } from "../../src/api/response/Responses";
import { HTTPMethod } from "../../src/http/HttpMethod";
import { HttpStatusCode } from "../../src/http/HttpStatusCodes";
import { IHasID } from "../../src/interfaces/IHasID";
import { RequestValidator } from "../../src/type/RequestValidator";

export default async function handler(
  req: NextApiRequestTypedBody<IHasID>,
  res: JsonResponse<Partial<OsuDroidUser>>
) {
  if (RequestHandler.endWhenInvalidHttpMethod(req, res, HTTPMethod.GET)) {
    return;
  }

  if (!RequestValidator.hasNumericID(req)) {
    res.status(HttpStatusCode.BAD_REQUEST).json({
      error: JsonErrors.INVALID_DATA_TYPE(),
    });
    return;
  }

  const { id } = req.body;

  const user = await prisma.osuDroidUser.findUnique({
    where: {
      id,
    },
    select: {
      username: true,
      createdAt: true,
      lastSeen: true,
    },
  });

  if (!user) {
    res.status(HttpStatusCode.BAD_REQUEST).json({
      error: Responses.USER_NOT_FOUND,
    });
    return;
  }

  res.status(HttpStatusCode.OK).json({ data: user });
}
