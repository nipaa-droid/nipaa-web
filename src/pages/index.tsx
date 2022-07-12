import Head from "next/head";
import {
  Group,
  GroupedTransition,
  Paper,
  Text,
  Title,
  Transition,
} from "@mantine/core";
import { useI18nContext } from "../i18n/i18n-react";
import { ServerConstants } from "../constants";
import { useEffect, useState } from "react";

export default function Home() {
  const { LL } = useI18nContext();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const duration = 1000;

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
      <Group style={{ display: "flex" }}>
        <GroupedTransition
          mounted={mounted}
          transitions={{
            paper: { transition: "slide-up", duration },
            text: { transition: "slide-left", duration: duration / 2 },
          }}
        >
          {(styles) => {
            return (
              <Paper
                p="xl"
                shadow="xs"
                style={{ flexGrow: 1, ...styles.paper }}
                withBorder
              >
                <div style={styles.text}>
                  <Title>{ServerConstants.SERVER_NAME}</Title>
                  <Text>{LL.description()}</Text>
                </div>
              </Paper>
            );
          }}
        </GroupedTransition>
      </Group>
    </>
  );
}
