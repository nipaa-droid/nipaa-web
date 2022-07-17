import {
  AppShell,
  Burger,
  Center,
  Drawer,
  Footer,
  Header,
  MediaQuery,
  Navbar,
  SimpleGrid,
  Title,
  Transition,
} from "@mantine/core";
import { useState, PropsWithChildren, useEffect } from "react";
import { ServerConstants } from "../../constants";
import { AppLogo } from "../images/AppLogo";
import { useMediaQuery } from "@mantine/hooks";
import { translateMediaQuery } from "../../utils/mediaquery";
import { ShellNavigationContent } from "./ShellNavigationContent";

export const ClientShell = ({ children }: PropsWithChildren<{}>) => {
  const [opened, setOpened] = useState(false);

  const isSmall = useMediaQuery(
    translateMediaQuery({
      maxWidth: "xs",
    })
  );

  useEffect(() => {
    setOpened(!isSmall);
  }, [isSmall]);

  return (
    <AppShell
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      fixed
      navbar={
        isSmall ? (
          <Drawer
            opened={opened}
            onClose={() => setOpened(false)}
            padding="xl"
            overlayBlur={4}
            size="sm"
          >
            <ShellNavigationContent isSmall={isSmall} setOpened={setOpened} />
          </Drawer>
        ) : (
          <Transition mounted={opened} transition="slide-right" duration={500}>
            {(styles) => (
              <Navbar
                style={styles}
                hidden={!opened}
                width={{ base: 250 }}
                p="md"
                hiddenBreakpoint="sm"
              >
                <ShellNavigationContent
                  isSmall={isSmall}
                  setOpened={setOpened}
                />
              </Navbar>
            )}
          </Transition>
        )
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
                styles={(t) => ({ root: { color: t.white } })}
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                mr="xl"
                title="Navigation bar button"
              />
            </MediaQuery>
            <SimpleGrid cols={2}>
              <div>
                <Center>
                  <AppLogo />
                </Center>
              </div>
              <div>
                <Center style={{ marginTop: "10%", marginRight: "10%" }}>
                  <Title order={4} sx={(t) => ({ color: t.white })}>
                    {ServerConstants.SERVER_NAME}
                  </Title>
                </Center>
              </div>
            </SimpleGrid>
          </div>
        </Header>
      }
    >
      {children}
    </AppShell>
  );
};
