import { Prisma, UserSession } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { DroidAPIResponses, Responses } from "../../api/Responses";
import { assertDefined } from "../../assertions";
import { clientLoginResolver } from "../../server/routers/client/login";
import { clientPlayResolver } from "../../server/routers/client/play";
import { clientRegisterResolver } from "../../server/routers/client/register";

const email = "testuser@protonmail.com";
const username = "mockedlol";
const password = "iammocked";

const expectSuccessStart = (response: string[]) =>
  expect(response[0]).toBe(DroidAPIResponses.SUCCESS);

const expectNumericString = (string: string) => {
  expect(Number(string)).not.toBeNaN();
};

let session: UserSession;

export const getLatestTestUser = async <S extends Prisma.OsuDroidUserSelect>(
  select: S
) => {
  const user = await prisma.osuDroidUser.findUnique({
    where: {
      email,
    },
    select,
  });

  expect(user).not.toBeNull();

  assertDefined(user);

  return user;
};

describe("Client testing", () => {
  test("User deletion", async () => {
    try {
      await prisma.osuDroidUser.delete({
        where: {
          email,
        },
      });
      console.log("Deleted user");
    } catch (e) {
      console.log("User to delete does not exist");
    }
  });

  test("User register", async () => {
    const result = Responses.PARSE_PARTIAL(
      await clientRegisterResolver({
        username,
        email,
        password,
      })
    );

    console.log(result);

    expect(result).toHaveLength(2);
    expectSuccessStart(result);
  });

  test("User login", async () => {
    const mutation = await clientLoginResolver({
      username,
      password,
      select: {
        playing: true,
      },
    });

    expect(mutation.session).not.toBeNull();

    if (mutation.session) {
      session = mutation.session;
    }

    const result = Responses.PARSE_FULL(mutation.response);

    console.log(result);

    expect(result).toHaveLength(8);
    expectSuccessStart(result);

    // userid
    expectNumericString(result[1]);

    // rank
    expectNumericString(result[3]);

    // metric
    expectNumericString(result[4]);

    // accuracy
    expectNumericString(result[5]);

    // username
    expect(result[6]).toBe(username);
  });

  test("User is playing", async () => {
    const user = await getLatestTestUser({ id: true, playing: true });

    const result = Responses.PARSE_FULL(
      await clientPlayResolver({
        session,
        user,
        hash: "7979904eb459f01f1f29108bb2b7fd2e",
      })
    );

    expectSuccessStart(result);
    expect(result[1]).toBeTruthy();
    expectNumericString(result[2]);
  });
});
