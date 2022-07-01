import { NextApiRequest, NextApiResponse } from "next";
import HTTPMethod from "../../http/HttpMethod";
import HttpStatusCode from "../../http/HttpStatusCodes";
import { NonEmptyArray } from "../../utils/TypeUtils";
import EnumUtils from "../enums/EnumUtils";
import Responses from "../response/Responses";

export default class RequestHandler {
  static endWhenInvalidHttpMethod(
    req: NextApiRequest,
    res: NextApiResponse,
    ...validMethods: NonEmptyArray<HTTPMethod>
  ): boolean {
    const end = () => {
      res
        .status(HttpStatusCode.BAD_REQUEST)
        .send(Responses.FAILED("Invalid HTTP METHOD."));
    };

    if (!req.method) {
      end();
      return true;
    }

    const method = EnumUtils.getValueByKey(HTTPMethod, req.method);

    if (!method) {
      end();
      return true;
    }

    if (!validMethods.includes(method)) {
      end();
      return true;
    }

    return false;
  }
}
