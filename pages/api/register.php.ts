import type { NextApiResponse } from "next";
import HTTPMethod from "../../shared/api/enums/HttpMethod";
import HttpStatusCode from "../../shared/api/enums/HttpStatusCodes";
import NextApiRequestTypedBody from "../../shared/api/query/NextApiRequestTypedBody";
import RequestHandler from "../../shared/api/request/RequestHandler";
import IHasUsername from "../../shared/api/query/IHasUsername";
import IHasDeviceID from "../../shared/api/query/IHasDeviceID";
import IHasEmail from "../../shared/api/query/IHasEmail";
import IHasAppSignature from "../../shared/api/query/IHasAppSignature";
import DroidRequestValidator from "../../shared/type/DroidRequestValidator";
import Responses from "../../shared/api/response/Responses";
import OsuDroidUser from "../../shared/database/entities/OsuDroidUser";
import IHasPassword from "../../shared/api/query/IHasPassword";
import { randomUUID } from "crypto";
import Database from "../../shared/database/Database";

const MIN_USERNAME_LENGTH = 3;

type body = IHasUsername &
  IHasDeviceID &
  IHasEmail &
  IHasAppSignature &
  IHasPassword;

const validate = (
  body: Partial<body>
): body is IHasUsername &
  IHasDeviceID &
  IHasEmail &
  IHasAppSignature &
  IHasPassword => {
  return DroidRequestValidator.untypedValidation(
    body,
    DroidRequestValidator.validateUsername,
    DroidRequestValidator.validateDeviceID,
    DroidRequestValidator.validateEmail,
    DroidRequestValidator.validateSign,
    DroidRequestValidator.validatePassword
  );
};

export default async function handler(
  req: NextApiRequestTypedBody<body>,
  res: NextApiResponse<string>
) {
  await Database.getConnection();

  if (!RequestHandler.endWhenInvalidHttpMethod(req, res, HTTPMethod.POST)) {
    return;
  }

  const { body } = req;

  if (
    DroidRequestValidator.droidStringEndOnInvalidRequest(res, validate(body)) ||
    !validate(body)
  ) {
    return;
  }

  const { username, password, deviceID, email } = body;

  if (username.length < MIN_USERNAME_LENGTH) {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send(
        Responses.FAILED(
          `Username must be longer than ${MIN_USERNAME_LENGTH} characters.`
        )
      );
    return;
  }

  const existingUser = await OsuDroidUser.findOne(undefined, {
    where: {
      username,
      email,
    },
    select: ["username", "email"],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      res
        .status(HttpStatusCode.BAD_REQUEST)
        .send(Responses.FAILED(`User with selected email already exists.`));
    } else if (existingUser.username === username) {
      res
        .status(HttpStatusCode.BAD_REQUEST)
        .send(Responses.FAILED(`User with selected username already exists.`));
    } else {
      throw "unexpected behavior.";
    }
  }

  const user = OsuDroidUser.create();

  user.username = username;
  user.password = password;
  user.deviceIDS.push(deviceID);
  user.email = email;
  user.md5Email = email;
  user.uuid = randomUUID();

  await user.update();

  // TODO VALIDATE APP SIGNATURE?.

  console.log(
    `Registered new user: (id: ${user.id}, username: ${user.username})`
  );

  res.status(HttpStatusCode.OK).send(Responses.SUCCESS("Account created."));
}
