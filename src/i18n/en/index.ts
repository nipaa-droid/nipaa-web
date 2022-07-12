import { ServerConstants } from "../../constants";
import type { BaseTranslation } from "../i18n-types";

const en: BaseTranslation = {
  description: `${ServerConstants.SERVER_NAME} is an osu!droid server built by ${ServerConstants.SERVER_CREATOR}`,

  accuracy: "Accuracy",
  playCount: "Playcount",
  performance: "Performance",

  about: `Nipaa is a osu!droid server which has goals to provide a functioning in-game dpp leaderboard whilst providing a user friendly website interface, nipaa has by now almost every feature you would expect from iBancho with a few exceptions, such as not being able to upload your beloved avatar for now! but fear not, this project is open source and atleast being try to be mantained by me... (${ServerConstants.SERVER_CREATOR})`,

  leaderboard: "Leaderboard",
  home: "Home",
};

export default en;
