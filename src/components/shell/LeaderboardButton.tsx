import { useI18nContext } from "../../i18n/i18n-react";
import { getLeaderboardPage } from "../../utils/router";
import { ShellButton, ShellButtonPropsWithoutLink } from "./ShellButton";

export const LeaderboardButton = (props: ShellButtonPropsWithoutLink) => {
  const { LL } = useI18nContext();

  return (
    <ShellButton linkProps={{ href: getLeaderboardPage(1) }} {...props}>
      {LL.leaderboard()}
    </ShellButton>
  );
};
