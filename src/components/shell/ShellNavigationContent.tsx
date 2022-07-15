import { Stack } from "@mantine/core";
import { useAuth } from "../../providers/auth";
import { HomePageButton } from "./HomePageButton";
import { LeaderboardButton } from "./LeaderboardButton";
import { ShellButtonDependencyProps } from "./ShellButton";
import { ShellLoginButton } from "./ShellLoginButton";
import { ShellSessionUserInformation } from "./ShellSessionUserInformation";

export const ShellNavigationContent = ({
  isSmall,
  setOpened,
}: ShellButtonDependencyProps) => {
  const { user } = useAuth();

  return (
    <Stack>
      {user ? (
        <ShellSessionUserInformation />
      ) : (
        <ShellLoginButton setOpened={setOpened} isSmall={isSmall} />
      )}
      <HomePageButton setOpened={setOpened} isSmall={isSmall} />
      <LeaderboardButton setOpened={setOpened} isSmall={isSmall} />
    </Stack>
  );
};
