export class ServerConstants {
  static SERVER_NAME = "Nipaa!";
  static SERVER_CREATOR = "Dasher";
  static PRODUCTION_URL = "nipaa.vercel.app";
  static DISCORD_URL = "https://discord.gg/CFmHRcEcz5";
  static AMOUNT_SCORES_ON_SCORE_LEADERBOARD = 50;
  
  static SERVER_URL =
    process.env.NODE_ENV === "production"
      ? `https://${ServerConstants.PRODUCTION_URL}`
      : "http://localhost:3000";
  
  static DEFAULT_AVATAR_PATH = `/avatar-guest.png`;
}
