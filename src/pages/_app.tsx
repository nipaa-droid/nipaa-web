import { withTRPC } from "@trpc/next";
import { AppType } from "next/dist/shared/lib/utils";
import Head from "next/head";
import { AppRouter } from "../server/routers/_app";
import {
  AppShell,
  Burger,
  Button,
  Center,
  createStyles,
  Footer,
  Header,
  Image,
  MantineProvider,
  MediaQuery,
  Navbar,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";
import { AppLoading } from "../components/AppLoading";
import TypesafeI18n from "../i18n/i18n-react";
import router from "next/router";
import { useState, useEffect } from "react";
import { detectLocale } from "typesafe-i18n/detectors";
import { Locales } from "../i18n/i18n-types";
import { baseLocale, locales } from "../i18n/i18n-util";
import { loadLocaleAsync } from "../i18n/i18n-util.async";
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

const MyApp: AppType = ({ Component, pageProps }) => {
  const [locale, setLocale] = useState<Locales | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);
  const { classes } = useStyles();

  useEffect(() => {
    setTimeout(async () => {
      setLoading(false);
    }, 250);

    const locale = detectLocale(
      router.locale ?? baseLocale,
      locales
    ) as Locales;

    void loadLocaleAsync(locale).then(() => setLocale(locale));
  }, []);

  return (
    <MantineProvider
      theme={{
        primaryColor: "gray",
        /** Put your mantine theme override here */
        colorScheme: "dark",
      }}
    >
      {locale && !loading ? (
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
                  <Text className={classes.buttonText}>Home</Text>
                </Button>
              </Link>
              <Link passHref href="/leaderboard">
                <Button component="a" className={classes.button}>
                  <Text className={classes.buttonText}>Leaderboard</Text>
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
          <TypesafeI18n locale={locale}>
            <Head>
              <title>{ServerConstants.SERVER_NAME}</title>
              <meta
                name="viewport"
                content="minimum-scale=1, initial-scale=1, width=device-width"
              />
            </Head>
            <Component {...pageProps} />
          </TypesafeI18n>
        </AppShell>
      ) : (
        <AppLoading />
      )}
    </MantineProvider>
  );
};

export default withTRPC<AppRouter>({
  config() {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */
    const url = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/trpc`
      : "http://localhost:3000/api/trpc";

    return {
      url,
      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      // queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: true,
})(MyApp);
