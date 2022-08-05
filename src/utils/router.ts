import { ANY_STRING } from "./strings";

export const getLeaderboardPage = (page = 1, mods = ANY_STRING) =>
  `/leaderboard/${mods}/${page}`;

export const getHomePage = () => `/`;

export const getLoginPage = () => `/login`;

export const getAccountEditPage = () => `/account/edit`;
