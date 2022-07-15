import { getLeaderboardPage } from "../../utils/router";
import { ShellButton, ShellButtonPropsWithoutLink } from "./ShellButton";

export const ShellLoginButton = (props: ShellButtonPropsWithoutLink) => {
  return (
    <ShellButton linkProps={{ href: getLeaderboardPage(1) }} {...props}>
      Login
    </ShellButton>
  );
};
