import { parseCookies } from "nookies";
import { CookieNames } from "./cookies";
import nookies from "nookies";
import { getHomePage } from "./router";
import {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  PreviewData,
} from "next";
import { ParsedUrlQuery } from "querystring";
import { prisma } from "../../lib/prisma";

export const clientGetSessionCookie = () => {
  return parseCookies()[CookieNames.SESSION_ID];
};

export const clientHasSessionCookie = () => {
  return Boolean(clientGetSessionCookie());
};

type ServerContext = GetServerSidePropsContext<ParsedUrlQuery, PreviewData>;

export const redirectWhenHasSession = <P>(
  ctx: ServerContext,
  redirectProps: P,
  destination = getHomePage()
) => {
  const cookies = nookies.get(ctx);

  /**
   * We ignore validation of session if the cookie is present
   * we redirect.
   */
  if (cookies[CookieNames.SESSION_ID]) {
    return {
      props: redirectProps,
      redirect: {
        destination,
      },
    };
  }
};

export const redirectWhenNoSession = async <P>(
  ctx: ServerContext,
  redirectProps: P,
  destination = getHomePage()
) => {
  const cookies = nookies.get(ctx);

  const invalidRequestReturn: GetServerSidePropsResult<P> = {
    props: redirectProps,
    redirect: {
      destination,
      permanent: false,
    },
  };

  const sessionId = cookies[CookieNames.SESSION_ID];

  if (!sessionId) {
    return invalidRequestReturn;
  }

  const session = await prisma.userSession.findUnique({
    where: {
      id: sessionId,
    },
  });

  if (!session) {
    return invalidRequestReturn;
  }
};
