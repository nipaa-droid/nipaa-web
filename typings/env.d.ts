namespace NodeJS {
  interface ProcessEnv extends NodeJS.ProcessEnv {
    DATABASE_USER: string;
    DATABASE_USER_PASSWORD: string;
    DISCORD_CLIENT_ID: string;
    DISCORD_CLIENT_SECRET: string;
    AUTH_SECRET: string;
  }
}
