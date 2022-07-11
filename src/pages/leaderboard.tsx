import { ServerConstants } from "../constants";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { Card, Center, Grid, Group, List, Text } from "@mantine/core";
import { DatabaseSetup } from "../database/DatabaseSetup";
import { AppLoading } from "../components/AppLoading";

export default function Leaderboard() {
  const users = trpc.useQuery(["global-leaderboard"]);

  return (
    <>
      <Head>
        <title>{ServerConstants.SERVER_NAME}</title>
      </Head>
      <main>
        <List>
          {!users.data ? (
            <AppLoading />
          ) : (
            users.data.map((data) => {
              return (
                <List.Item style={{ listStyle: "none" }} key={data.userID}>
                  <Center>
                    <Card style={{ width: "60%" }}>
                      <Grid justify={"flex-end"}>
                        <Grid.Col span={4}>
                          <Text>{data.username}</Text>
                        </Grid.Col>
                        <Grid.Col span={4}></Grid.Col>
                        <Grid.Col span={4}>
                          <Group>
                            <Text style={{ marginLeft: "auto" }}>
                              {`${Math.round(data.metric)} ${
                                DatabaseSetup.global_leaderboard_metric
                              }`}
                            </Text>
                          </Group>
                        </Grid.Col>
                      </Grid>
                    </Card>
                  </Center>
                </List.Item>
              );
            })
          )}
        </List>
      </main>
    </>
  );
}
