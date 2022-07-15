export const verifyApplicationSecret = (secret: string) => {
  return secret === process.env.APP_SECRET;
};
