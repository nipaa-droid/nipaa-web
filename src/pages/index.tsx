import Head from "next/head";
import { Group, Paper, Text, Title } from "@mantine/core";
import { useI18nContext } from "../i18n/i18n-react";
import { ServerConstants } from "../constants";

export default function Home() {
  const { LL } = useI18nContext();

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
        <Paper p="xl" shadow="xs" style={{ flexGrow: 1 }} withBorder>
          <Title>{ServerConstants.SERVER_NAME}</Title>
          <Text>{LL.description()}</Text>
        </Paper>
      </Group>
    </>
  );
}
