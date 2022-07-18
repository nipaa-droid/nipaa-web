import {
  createStyles,
  Container,
  Paper,
  Table,
  Text,
  Pagination,
  Loader,
  Center,
  Grid,
  NumberInput,
  GroupedTransition,
} from "@mantine/core";
import assert from "assert";
import { clamp } from "lodash";
import { GetStaticPaths, GetStaticPropsContext } from "next";
import { useRouter } from "next/router";
import { PropsWithChildren, useState, useEffect } from "react";
import { prisma } from "../../../../lib/prisma";
import { CenteredTableHead } from "../../../components/CenteredTableHead";
import { useI18nContext } from "../../../i18n/i18n-react";
import { TRPCGlobalLeaderboardReturnType } from "../../../server/routers/web/global_leaderboard";
import { getSSGHelper } from "../../../utils/backend";
import { maxPagesFor } from "../../../utils/number";
import { getLeaderboardPage } from "../../../utils/router";

const AMOUNT_PER_PAGE = 50;

const getMaxPages = async () => {
  const users = await prisma.osuDroidUser.count();
  return maxPagesFor(users, AMOUNT_PER_PAGE);
};

export const getStaticPaths: GetStaticPaths = async () => {
  const maxPages = await getMaxPages();

  const result: { params: Params }[] = [];

  for (let i = 1; i < maxPages + 1; i++) {
    result.push({
      params: {
        page: i.toString(),
      },
    });
  }

  return {
    paths: result,
    fallback: true,
  };
};

type StaticPropsType = {
  data: TRPCGlobalLeaderboardReturnType;
  maxPages: number;
  currentPage: number;
};

type Params = {
  page: string;
};

export async function getStaticProps(context: GetStaticPropsContext<Params>) {
  const { params } = context;

  assert(params);

  const maxPages = await getMaxPages();
  const page = parseInt(params.page);

  if (page > maxPages || page < 1) {
    const redirectPage = clamp(page, 1, maxPages);
    return {
      redirect: {
        destination: getLeaderboardPage(redirectPage),
      },
    };
  }

  const ssg = getSSGHelper({});

  const fullData = await ssg.fetchQuery("web-global-leaderboard", {
    secret: process.env.APP_SECRET,
  });

  const pageIndex = page - 1;
  const start = pageIndex * AMOUNT_PER_PAGE;

  const providedData = fullData.slice(start, start + AMOUNT_PER_PAGE);

  return {
    props: {
      data: providedData,
      maxPages,
      currentPage: page,
    },
    revalidate: 60,
  };
}

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
  inputWrapper: {
    margin: "2.5rem",
  },
}));

export default function Leaderboard({
  data,
  maxPages,
  currentPage: staticCurrentPage,
}: StaticPropsType) {
  const router = useRouter();

  const { classes } = useStyles();
  const { LL, locale } = useI18nContext();
  const [currentPage, setCurrentPage] = useState(staticCurrentPage);

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
  }, []);

  const handlePageChange = (page: number | undefined) => {
    if (page && maxPages && page !== currentPage) {
      const newPage = Math.min(page, maxPages);

      setCurrentPage(newPage);

      const { pathname } = router;

      router.push({
        pathname,
        query: {
          page: newPage,
        },
      });
    }
  };

  const duration = 500;

  if (router.isFallback) {
    return (
      <Center>
        <Loader style={{ marginTop: "10vh" }} />
      </Center>
    );
  }

  return (
    <>
      <GroupedTransition
        mounted={mounted}
        transitions={{
          table: { duration, transition: "slide-down" },
          pageInput: { duration, transition: "slide-up" },
        }}
      >
        {(styles) => {
          return (
            <>
              <Grid className={classes.inputWrapper} style={styles.pageInput}>
                <Grid.Col offset={3} span={6}>
                  <NumberInput
                    value={currentPage}
                    placeholder={LL.leaderboardPageSearch()}
                    onChange={handlePageChange}
                    formatter={(s) =>
                      s ? Math.min(parseInt(s), maxPages!).toString() : ""
                    }
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Pagination
                    page={currentPage}
                    onChange={handlePageChange}
                    position="center"
                    boundaries={0}
                    siblings={0}
                    total={maxPages}
                  />
                </Grid.Col>
              </Grid>
              <Container style={{ display: "flex", justifyContent: "center" }}>
                <Paper style={{ overflowX: "auto", width: "95%" }} withBorder>
                  <Table
                    className={classes.table}
                    horizontalSpacing="xs"
                    verticalSpacing="xs"
                    style={styles.table}
                    highlightOnHover
                  >
                    <thead>
                      <tr>
                        <UnfocusedTableHead />
                        <UnfocusedTableHead />
                        <UnfocusedTableHead>{LL.accuracy()}</UnfocusedTableHead>
                        <UnfocusedTableHead>
                          {LL.playCount()}
                        </UnfocusedTableHead>
                        <FocusedTableHead>{LL.performance()}</FocusedTableHead>
                        <UnfocusedTableHead>SS</UnfocusedTableHead>
                        <UnfocusedTableHead>S</UnfocusedTableHead>
                        <UnfocusedTableHead>A</UnfocusedTableHead>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((data, i) => {
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
                            <UnfocusedTableData>{playCount}</UnfocusedTableData>
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
                </Paper>
              </Container>
            </>
          );
        }}
      </GroupedTransition>
    </>
  );
}
