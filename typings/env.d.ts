namespace NodeJS {
  interface ProcessEnv extends NodeJS.ProcessEnv {
    DATABASE_USER: string;
    DATABASE_USER_PASSWORD: string;
    AUTH_SECRET: string;
    OSU_API_KEY: string;
  }
}
