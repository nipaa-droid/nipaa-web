import { UserSession } from "@prisma/client";
import { setCookie } from "nookies";
import { CookieNames } from "../utils/cookies";
import { AtLeast } from "../utils/types";
import { CommonRequest } from "./context";

export const verifyApplicationSecret = (secret: string) => {
	return secret === process.env.APP_SECRET;
};

export const putSessionCookie = (
	ctx: CommonRequest,
	session: AtLeast<UserSession, "expires" | "id">
) => {
	setCookie(ctx, CookieNames.SESSION_ID, session.id, {
		path: "/",
		httpOnly: true,
		secure: true,
		sameSite: "strict",
		expires: session.expires,
	});
};
