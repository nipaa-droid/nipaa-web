namespace NodeJS {
  interface ProcessEnv extends NodeJS.ProcessEnv {
    DATABASE_USER: string;
    DATABASE_USER_PASSWORD: string;
    OSU_CLIENT_ID: string;
    OSU_CLIENT_SECRET: string;
    AUTH_SECRET: string;
  }
}
