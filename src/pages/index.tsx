import Head from "next/head";
import {
  createStyles,
  CSSObject,
  Grid,
  GroupedTransition,
  MediaQuery,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { IndexPresentation } from "../components/index/IndexPresentation";
import { ServerAbout } from "../components/index/ServerAbout";
import { ServerConstants } from "../constants";
import { DiscordWidget } from "../components/images/DiscordWidget";

const useStyles = createStyles(() => ({
  discoWidget: {
    padding: "5%",
  },
}));

export default function Home() {
  const { classes } = useStyles();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const duration = 1000;

  const hide: CSSObject = {
    display: "none",
  };

  return (
    <>
      <Head>
        <title>{ServerConstants.SERVER_NAME}</title>
        <meta
          name="description"
          content={`${ServerConstants.SERVER_NAME} is a blazingly fast osu!droid server`}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <GroupedTransition
        mounted={mounted}
        transitions={{
          slideDown: { transition: "slide-down", duration },
          slideUp: { transition: "slide-up", duration: duration },
          slideLeft: { transition: "slide-left", duration: duration / 2 },
          slideRight: { transition: "slide-right", duration: duration / 2 },
        }}
      >
        {(styles) => {
          return (
            <div>
              <Grid gutter="xl">
                <Grid.Col style={styles.slideDown}>
                  <IndexPresentation textStyle={styles.slideRight} />
                </Grid.Col>
                <Grid.Col style={styles.slideLeft}>
                  <ServerAbout textStyle={styles.slideRight} />
                </Grid.Col>
              </Grid>
              <Grid className={classes.discoWidget}>
                <MediaQuery smallerThan="md" styles={hide}>
                  <Grid.Col style={styles.slideUp} span={6} offset={3}>
                    <DiscordWidget />
                  </Grid.Col>
                </MediaQuery>
                <MediaQuery largerThan="md" styles={hide}>
                  <Grid.Col style={styles.slideUp}>
                    <DiscordWidget />
                  </Grid.Col>
                </MediaQuery>
              </Grid>
            </div>
          );
        }}
      </GroupedTransition>
    </>
  );
}
