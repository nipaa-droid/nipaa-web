import { parseCookies } from "nookies";
import { CookieNames } from "./cookies";

export const clientGetSessionCookie = () => {
  return parseCookies()[CookieNames.SESSION_ID];
};

export const clientHasSessionCookie = () => {
  return Boolean(clientGetSessionCookie());
};
