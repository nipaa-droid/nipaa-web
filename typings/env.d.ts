namespace NodeJS {
  interface ProcessEnv extends NodeJS.ProcessEnv {
    DATABASE_URL: string;
    APP_SECRET: string;
    OSU_API_KEY: string;
    REDIS_URL: string;
  }
}
