import { NextApiResponse } from "next";
import { HTTPMethod } from "../../shared/http/HttpMethod";
import { IHasPassword } from "../../shared/api/query/IHasPassword";
import { IHasUsername } from "../../shared/api/query/IHasUsername";
import { NextApiRequestTypedBody } from "../../shared/api/query/NextApiRequestTypedBody";
import { RequestHandler } from "../../shared/api/request/RequestHandler";
import { Database } from "../../shared/database/Database";
import { DroidRequestValidator } from "../../shared/type/DroidRequestValidator";

type body = IHasUsername & IHasPassword;

const validate = (body: Partial<body>): body is body => {
  return DroidRequestValidator.untypedValidation(
    body,
    DroidRequestValidator.validateUsername,
    DroidRequestValidator.validatePassword
  );
};

export default async function handler(
  req: NextApiRequestTypedBody<body>,
  res: NextApiResponse<string>
) {
  await Database.getConnection();

  if (RequestHandler.endWhenInvalidHttpMethod(req, res, HTTPMethod.POST)) {
    return;
  }

  if (
    DroidRequestValidator.droidStringEndOnInvalidRequest(
      res,
      validate(req.body)
    ) ||
    !validate(req.body)
  ) {
    return;
  }

  const { username, password } = req.body;

  console.log(req.body);

  const user = await prisma.osuDroidUser.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      username: true,
    },
  });

  // TODO REWORK LOGIN
}
