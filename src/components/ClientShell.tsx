import Head from "next/head";
import {
  AppShell,
  Burger,
  Center,
  createStyles,
  Drawer,
  Footer,
  Header,
  MediaQuery,
  Navbar,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Transition,
} from "@mantine/core";
import { useI18nContext } from "../i18n/i18n-react";
import { useState, PropsWithChildren, useEffect } from "react";
import { ServerConstants } from "../constants";
import { LinkButton, LinkButtonProps } from "./LinkButton";
import { AppLogo } from "./images/AppLogo";
import { useMediaQuery } from "@mantine/hooks";
import { translateMediaQuery } from "../utils/mediaquery";
import { getHome, getLeaderboardPage } from "../utils/router";

const useStyles = createStyles((theme) => ({
  button: {
    color: theme.primaryColor,
    marginTop: "10%",
  },
  buttonText: {
    color: theme.white,
  },
}));

export const ClientShell = ({ children }: PropsWithChildren<{}>) => {
  const { classes } = useStyles();
  const [opened, setOpened] = useState(false);
  const { LL } = useI18nContext();

  function ShellButton<C>({
    children,
    buttonProps,
    linkProps,
  }: PropsWithChildren<LinkButtonProps<C>>) {
    return (
      <LinkButton<C>
        buttonProps={{
          component: "a",
          className: classes.button,
          onClick: () => {
            if (isSmall) {
              setOpened(false);
            }
          },
          ...(buttonProps as any),
        }}
        linkProps={{
          ...linkProps,
        }}
      >
        <Text className={classes.buttonText}>{children}</Text>
      </LinkButton>
    );
  }

  const NavigationContent = () => {
    return (
      <Stack>
        <ShellButton linkProps={{ href: getHome() }}>{LL.home()}</ShellButton>
        <ShellButton linkProps={{ href: getLeaderboardPage(1) }}>
          {LL.leaderboard()}
        </ShellButton>
      </Stack>
    );
  };

  const isSmall = useMediaQuery(
    translateMediaQuery({
      maxWidth: "xs",
    })
  );

  useEffect(() => {
    setOpened(!isSmall);
  }, [isSmall]);

  return (
    <AppShell
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      fixed
      navbar={
        isSmall ? (
          <Drawer
            opened={opened}
            onClose={() => setOpened(false)}
            padding="xl"
            overlayBlur={4}
            size="sm"
          >
            <NavigationContent />
          </Drawer>
        ) : (
          <Transition mounted={opened} transition="slide-right" duration={500}>
            {(styles) => (
              <Navbar
                style={styles}
                hidden={!opened}
                width={{ base: 250 }}
                p="md"
                hiddenBreakpoint="sm"
              >
                <NavigationContent />
              </Navbar>
            )}
          </Transition>
        )
      }
      footer={
        <Footer height={60} p="md">
          <></>
        </Footer>
      }
      header={
        <Header height={70} p="md">
          <div
            style={{
              display: "flex",
              height: "100%",
            }}
          >
            <MediaQuery largerThan="sm" styles={{ display: "none" }}>
              <Burger
                styles={(t) => ({ root: { color: t.white } })}
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                mr="xl"
                title="Navigation bar button"
              />
            </MediaQuery>
            <SimpleGrid cols={2}>
              <div>
                <Center>
                  <AppLogo />
                </Center>
              </div>
              <div>
                <Center style={{ marginTop: "10%", marginRight: "10%" }}>
                  <Title order={4} sx={(t) => ({ color: t.white })}>
                    {ServerConstants.SERVER_NAME}
                  </Title>
                </Center>
              </div>
            </SimpleGrid>
          </div>
        </Header>
      }
    >
      <Head>
        <title>{ServerConstants.SERVER_NAME}</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      {children}
    </AppShell>
  );
};
