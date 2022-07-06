import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth, { NextAuthOptions } from "next-auth";
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
  secret: process.env.AUTH_SECRET,
};

export default NextAuth(authOptions);
