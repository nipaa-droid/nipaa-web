import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Nipaa"
      , credentials: {
        username: {label: "Username", type: "text"},
         password: {label: "Password", type: "text"}
      }, 
      
     async authorize(credentials, req) {
        const {username, password} = credentials 
      },
    })
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  secret: process.env.AUTH_SECRET,
};

export default NextAuth(authOptions);
