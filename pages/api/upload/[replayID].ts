import "reflect-metadata";
import { getNipaaFirebaseApp } from "../../../shared/database/NippaFirebase";

import { getStorage } from "firebase-admin/storage";

import { NextApiResponse } from "next";
import HTTPMethod from "../../../shared/api/enums/HttpMethod";
import NextApiRequestTypedBody from "../../../shared/api/query/NextApiRequestTypedBody";
import RequestHandler from "../../../shared/api/request/RequestHandler";
import DroidRequestValidator from "../../../shared/type/DroidRequestValidator";
import NumberUtils from "../../../shared/utils/NumberUtils";
import HttpStatusCode from "../../../shared/api/enums/HttpStatusCodes";
import NipaaStorage from "../../../shared/database/NipaaStorage";

export default async function handler(
  req: NextApiRequestTypedBody<unknown>,
  res: NextApiResponse<string>
) {
  if (RequestHandler.endWhenInvalidHttpMethod(req, res, HTTPMethod.POST)) {
    return;
  }

  const { query } = req;
  const { replayID } = query;

  if (typeof replayID !== "string") {
    DroidRequestValidator.droidStringEndOnInvalidRequest(res, false);
    return;
  }

  const numericID = parseInt(replayID);

  if (!NumberUtils.isNumber(numericID)) {
    DroidRequestValidator.droidStringEndOnInvalidRequest(res, false);
    return;
  }

  getNipaaFirebaseApp();

  const bucket = getStorage().bucket();
  const replayFile = bucket.file(NipaaStorage.pathForReplay(numericID));
  const stream = replayFile.createReadStream();

  await new Promise((resolve) => {
    stream.pipe(res);
    stream.on("end", resolve);
    stream.on("error", () =>
      res.status(HttpStatusCode.BAD_REQUEST).send("Replay not found.")
    );
  });
}
