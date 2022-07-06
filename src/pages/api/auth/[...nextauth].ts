import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import { prisma } from "../../../../lib/prisma";
import OsuProvider from "next-auth/providers/osu";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    OsuProvider({
      clientId: process.env.OSU_CLIENT_ID,
      clientSecret: process.env.OSU_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    session: async ({ session, user }): Promise<AppSession> => {
      const appSession = { ...session, user: { ...user } };
      return appSession;
    },
  },
  secret: process.env.AUTH_SECRET,
};

type SessionUserObject = {
  user: User;
};

export type AppSession = Session & SessionUserObject;

export default NextAuth(authOptions);
