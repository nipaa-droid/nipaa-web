import Head from "next/head";
import {
  AppShell,
  Burger,
  Button,
  Center,
  createStyles,
  Footer,
  Header,
  Image,
  MediaQuery,
  Navbar,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";
import { useI18nContext } from "../i18n/i18n-react";
import React, { useState, PropsWithChildren } from "react";
import { ServerConstants } from "../constants";
import Link from "next/link";

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

  return (
    <AppShell
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      fixed
      navbar={
        <Navbar
          p="md"
          hiddenBreakpoint="sm"
          hidden={!opened}
          width={{ sm: 200, lg: 300 }}
        >
          <Link passHref href="/">
            <Button component="a" className={classes.button}>
              <Text className={classes.buttonText}>{LL.home()}</Text>
            </Button>
          </Link>
          <Link passHref href="/leaderboard">
            <Button component="a" className={classes.button}>
              <Text className={classes.buttonText}>{LL.leaderboard()}</Text>
            </Button>
          </Link>
        </Navbar>
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
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                mr="xl"
              />
            </MediaQuery>
            <SimpleGrid cols={2}>
              <div>
                <Center>
                  <Image
                    alt="The app's logo"
                    src="icon-192x192.png"
                    style={{ width: 32 }}
                  />
                </Center>
              </div>
              <div>
                <Center style={{ marginTop: "10%", marginRight: "10%" }}>
                  <Title order={4} style={{ color: "white" }}>
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
