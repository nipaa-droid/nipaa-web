namespace NodeJS {
  interface ProcessEnv extends NodeJS.ProcessEnv {
    DATABASE_URL: string;
    AUTH_SECRET: string;
    OSU_API_KEY: string;
  }
}
