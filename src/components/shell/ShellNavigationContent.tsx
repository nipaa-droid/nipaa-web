import { Skeleton, Stack } from "@mantine/core";
import { useAuth } from "../../providers/auth";
import { HomePageButton } from "./HomePageButton";
import { LeaderboardButton } from "./LeaderboardButton";
import { ShellButtonDependencyProps } from "./ShellButton";
import { ShellLoginButton } from "./ShellLoginButton";
import { ShellSessionUserInformation } from "./ShellSessionUserInformation";
import { AnimatePresence, motion, MotionProps } from "framer-motion";

export const ShellNavigationContent = ({
  isSmall,
  setOpened,
}: ShellButtonDependencyProps) => {
  const { userQuery, user, logoutMutation } = useAuth();

  const animation: MotionProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <>
      <AnimatePresence exitBeforeEnter>
        {userQuery.isFetching || logoutMutation.isLoading ? (
          <motion.div key="skeleton" {...animation}>
            <Stack>
              <Skeleton height={50} radius="xl" />
              {Array(2)
                .fill(null)
                .map((_, i) => (
                  <Skeleton mt="xl" key={i} height={40} radius="md" />
                ))}
            </Stack>
          </motion.div>
        ) : (
          <motion.div key="content" {...animation}>
            <Stack>
              {user ? (
                <ShellSessionUserInformation />
              ) : (
                <ShellLoginButton setOpened={setOpened} isSmall={isSmall} />
              )}
              <HomePageButton setOpened={setOpened} isSmall={isSmall} />
              <LeaderboardButton setOpened={setOpened} isSmall={isSmall} />
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
