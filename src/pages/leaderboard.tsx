import { ServerConstants } from "../constants";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import {
  Card,
  Container,
  createStyles,
  Paper,
  Table,
  Text,
  Transition,
} from "@mantine/core";
import { AppLoader } from "../components/AppLoader";
import { useI18nContext } from "../i18n/i18n-react";
import { CenteredTableHead } from "../components/CenteredTableHead";
import { PropsWithChildren, useEffect, useState } from "react";
import { boolean } from "zod";

const useStyles = createStyles((theme) => ({
  unfocused: {
    color: theme.primaryColor,
  },
  focused: {
    color: theme.white,
  },
  table: {
    td: {
      textAlign: "center",
      fontWeight: "bold",
    },
  },
}));

export default function Leaderboard() {
  const { classes } = useStyles();
  const { LL, locale } = useI18nContext();

  const users = trpc.useQuery(["global-leaderboard", {}]);

  const UnfocusedTableHead = ({ children }: PropsWithChildren<{}>) => (
    <CenteredTableHead>
      <Text className={classes.unfocused}>{children}</Text>
    </CenteredTableHead>
  );

  const FocusedTableHead = ({ children }: PropsWithChildren<{}>) => (
    <CenteredTableHead>
      <Text className={classes.focused}>{children}</Text>
    </CenteredTableHead>
  );

  const UnfocusedTableData = ({ children }: PropsWithChildren<{}>) => (
    <td className={classes.unfocused}>{children}</td>
  );

  const FocusedTableData = ({ children }: PropsWithChildren<{}>) => (
    <td className={classes.focused}>{children}</td>
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, [users.data]);

  return (
    <>
      <Head>
        <title>{ServerConstants.SERVER_NAME}</title>
      </Head>
      {!users.data ? (
        <AppLoader />
      ) : (
        <Container style={{ display: "flex", justifyContent: "center" }}>
          <Transition mounted={mounted} transition="slide-down" duration={1000}>
            {(styles) => {
              return (
                <Paper style={{ overflowX: "auto", width: "95%" }} withBorder>
                  <div style={styles}>
                    <Table
                      className={classes.table}
                      horizontalSpacing="xs"
                      verticalSpacing="xs"
                      highlightOnHover
                    >
                      <thead>
                        <tr>
                          <UnfocusedTableHead />
                          <UnfocusedTableHead />
                          <UnfocusedTableHead>
                            {LL.accuracy()}
                          </UnfocusedTableHead>
                          <UnfocusedTableHead>
                            {LL.playCount()}
                          </UnfocusedTableHead>
                          <FocusedTableHead>
                            {LL.performance()}
                          </FocusedTableHead>
                          <UnfocusedTableHead>SS</UnfocusedTableHead>
                          <UnfocusedTableHead>S</UnfocusedTableHead>
                          <UnfocusedTableHead>A</UnfocusedTableHead>
                        </tr>
                      </thead>
                      <tbody>
                        {users.data.map((data, i) => {
                          const {
                            username,
                            metric,
                            playCount,
                            accuracy,
                            grades,
                          } = data;
                          const { SS, S, A } = grades;

                          return (
                            <tr key={data.userID}>
                              <FocusedTableData>#{i + 1}</FocusedTableData>
                              <FocusedTableData>{username}</FocusedTableData>
                              <UnfocusedTableData>
                                {accuracy.toFixed(2).toLocaleLowerCase(locale)}%
                              </UnfocusedTableData>
                              <UnfocusedTableData>
                                {playCount}
                              </UnfocusedTableData>
                              <FocusedTableData>
                                {Math.round(metric).toLocaleString(locale)}
                              </FocusedTableData>
                              <UnfocusedTableData>{SS}</UnfocusedTableData>
                              <UnfocusedTableData>{S}</UnfocusedTableData>
                              <UnfocusedTableData>{A}</UnfocusedTableData>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </Paper>
              );
            }}
          </Transition>
        </Container>
      )}
    </>
  );
}
