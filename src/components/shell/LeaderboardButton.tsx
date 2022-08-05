import Link from "next/link";
import { useI18nContext } from "../../i18n/i18n-react";
import { getLeaderboardPage } from "../../utils/router";
import { ShellButton, ShellButtonProps } from "./ShellButton";

export const LeaderboardButton = (props: ShellButtonProps) => {
  const { LL } = useI18nContext();

  return (
    <Link href={getLeaderboardPage()} passHref>
      <ShellButton {...props}>{LL.leaderboard()}</ShellButton>
    </Link>
  );
};
