import { NextApiRequest, NextApiResponse } from "next";
import { HttpStatusCode } from "../../shared/http/HttpStatusCodes";
import { Responses } from "../../shared/api/response/Responses";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session) {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send(Responses.FAILED("Wrong password."));
    return;
  }

  if (!session.user || !session.user.email) {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send(Responses.FAILED("Invalid request"));
    return;
  }

  const { email } = session.user;

  const user = await prisma.osuDroidUser.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send(Responses.FAILED("User not found"));
    return;
  }

  res.status(HttpStatusCode.OK).send(Responses.SUCCESS());
}
