import {
  createStyles,
  Container,
  Transition,
  Paper,
  Table,
  Text,
} from "@mantine/core";
import assert from "assert";
import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { PropsWithChildren, useState, useEffect } from "react";
import { prisma } from "../../../../lib/prisma";
import { CenteredTableHead } from "../../../components/CenteredTableHead";
import { ServerConstants } from "../../../constants";
import { useI18nContext } from "../../../i18n/i18n-react";
import { TRPCGlobalLeaderboardReturnType } from "../../../server/routers/web/globalLeaderboard";
import { getSSGHelper } from "../../../utils/backend";
import { NumberUtils } from "../../../utils/number";

const AMOUNT_PER_PAGE = 50;

export const getStaticPaths: GetStaticPaths = async () => {
  const users = await prisma.osuDroidUser.count();

  const amountStaticPages = NumberUtils.maxPagesFor(users, AMOUNT_PER_PAGE);

  const result: { params: Params }[] = [];

  for (let i = 1; i < amountStaticPages + 1; i++) {
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
};

type Params = {
  page: string;
};

export const getStaticProps: GetStaticProps<StaticPropsType, Params> = async (
  context
) => {
  const ssg = getSSGHelper({});

  const { params } = context;

  assert(params);

  const { page } = params;

  const pageIndex = Number(page) - 1;

  const fullData = await ssg.fetchQuery("global-leaderboard", {});

  const start = Math.min(
    pageIndex * AMOUNT_PER_PAGE,
    NumberUtils.maxPagesFor(fullData.length, AMOUNT_PER_PAGE) - 1
  );

  const providedData = fullData.slice(start, start + AMOUNT_PER_PAGE);

  return {
    props: {
      data: providedData,
    },
    revalidate: 60,
  };
};

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

export default function Leaderboard({ data }: StaticPropsType) {
  const { classes } = useStyles();
  const { LL, locale } = useI18nContext();

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

  return (
    <>
      <Head>
        <title>{ServerConstants.SERVER_NAME}</title>
      </Head>
      <Container style={{ display: "flex", justifyContent: "center" }}>
        <Transition mounted={mounted} transition="slide-down" duration={1000}>
          {(styles) => {
            return (
              <Paper style={{ overflowX: "auto", width: "95%" }} withBorder>
                <Table
                  className={classes.table}
                  horizontalSpacing="xs"
                  verticalSpacing="xs"
                  style={styles}
                  highlightOnHover
                >
                  <thead>
                    <tr>
                      <UnfocusedTableHead />
                      <UnfocusedTableHead />
                      <UnfocusedTableHead>{LL.accuracy()}</UnfocusedTableHead>
                      <UnfocusedTableHead>{LL.playCount()}</UnfocusedTableHead>
                      <FocusedTableHead>{LL.performance()}</FocusedTableHead>
                      <UnfocusedTableHead>SS</UnfocusedTableHead>
                      <UnfocusedTableHead>S</UnfocusedTableHead>
                      <UnfocusedTableHead>A</UnfocusedTableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((data, i) => {
                      const { username, metric, playCount, accuracy, grades } =
                        data;
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
            );
          }}
        </Transition>
      </Container>
    </>
  );
}
