import Head from "next/head";
import {
  Card,
  Center,
  Container,
  createStyles,
  Group,
  GroupedTransition,
  Image,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import { useI18nContext } from "../i18n/i18n-react";
import { ServerConstants } from "../constants";
import { CSSProperties, PropsWithChildren, useEffect, useState } from "react";
import { LinkButton } from "../components/LinkButton";

const useStyles = createStyles(() => ({
  header: {
    height: "10rem",
  },
}));

export default function Home() {
  const { LL } = useI18nContext();
  const { classes } = useStyles();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const duration = 1000;

  const StyledPaper = ({
    children,
    styles,
    className,
  }: PropsWithChildren<{ styles: CSSProperties; className?: string }>) => {
    return (
      <Paper
        className={className}
        p="xl"
        shadow="xs"
        style={{ flexGrow: 0.9, ...styles }}
        withBorder
      >
        {children}
      </Paper>
    );
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
      <Group style={{ display: "flex", overflowY: "scroll" }}>
        <GroupedTransition
          mounted={mounted}
          transitions={{
            paper1: { transition: "slide-down", duration },
            paper2: { transition: "slide-up", duration },
            paper3: { transition: "slide-right", duration },
            text1: { transition: "slide-left", duration: duration / 2 },
            text2: { transition: "fade", duration: duration * 2 },
          }}
        >
          {(styles) => {
            return (
              <>
                <StyledPaper className={classes.header} styles={styles.paper1}>
                  <div style={styles.text1}>
                    <Title>{ServerConstants.SERVER_NAME}</Title>
                    <Text>{LL.description()}</Text>
                  </div>
                </StyledPaper>
                <Container style={{ flexGrow: 0.8 }}>
                  <StyledPaper styles={styles.paper3}>
                    <Card style={{ height: "8rem" }}>
                      <Card.Section padding="lg" m="xs">
                        <Center>
                          <Image
                            alt="discord logo"
                            src="discord.svg"
                            width={64}
                            withPlaceholder
                          />
                        </Center>
                      </Card.Section>
                      <LinkButton
                        buttonProps={{
                          component: "a",
                          fullWidth: true,
                          style: {
                            marginBottom: "1rem",
                          },
                        }}
                        linkProps={{ href: ServerConstants.DISCORD_URL }}
                      >
                        <Text>Join our discord</Text>
                      </LinkButton>
                    </Card>
                  </StyledPaper>
                </Container>
                <StyledPaper styles={styles.paper2}>
                  <div
                    style={{
                      ...styles.text2,
                      ...{ flexDirection: "row", alignContent: "flex-end" },
                    }}
                  >
                    <Text>{LL.about()}</Text>
                  </div>
                </StyledPaper>
                <div
                  style={{
                    flexGrow: 0.9,
                    marginTop: "1rem",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                  }}
                >
                  <Center>
                    <Image
                      alt="Fumo reimu"
                      src="fumo.gif"
                      withPlaceholder
                    ></Image>
                  </Center>
                </div>
              </>
            );
          }}
        </GroupedTransition>
      </Group>
    </>
  );
}
