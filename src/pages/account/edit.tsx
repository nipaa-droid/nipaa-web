import {
  Accordion,
  Center,
  Chip,
  Chips,
  Container,
  createStyles,
  Paper,
  Stack,
} from "@mantine/core";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { AccountEditInput } from "../../components/account/edit/AccountEditInput";
import { AccountEditItem } from "../../components/account/edit/AccountEditItem";
import { useI18nContext } from "../../i18n/i18n-react";
import { useAuth } from "../../providers/auth";
import { redirectWhenNoSession } from "../../utils/auth";
import { getHomePage } from "../../utils/router";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const redirect = await redirectWhenNoSession(ctx, {});

  if (redirect) {
    return redirect;
  }

  return {
    props: {},
  };
};

const useStyles = createStyles(() => ({
  blockedInput: {
    backgroundColor: "black",
    borderRadius: "10px",
  },
}));

export default function AccountEdit() {
  const router = useRouter();

  const { classes } = useStyles();
  const { LL } = useI18nContext();
  const { user, userQuery } = useAuth();

  useEffect(() => {
    if (!user && userQuery.isFetchedAfterMount) {
      router.push(getHomePage());
    }
  }, [user, router, userQuery]);

  return (
    <Container>
      <Paper withBorder>
        <Accordion>
          <Accordion.Item label="Credentials">
            <AccountEditItem title="Your credentials">
              <AccountEditInput
                title={LL.username()}
                defaultValue={user?.name}
                className={classes.blockedInput}
              />
              <AccountEditInput
                title={LL.email()}
                type="email"
                defaultValue={user?.email}
                className={classes.blockedInput}
              />
              <AccountEditInput
                title={LL.password()}
                type="password"
                defaultValue={".".repeat(16)}
                className={classes.blockedInput}
              />
            </AccountEditItem>
          </Accordion.Item>
          <Accordion.Item label="Preferences">
            <AccountEditItem title="Playstyle">
              <Center>
                <Stack sx={{ width: "90%" }}>
                  <AccountEditItem title="Aim style">
                    <Stack>
                      <Chips multiple>
                        <Chip value="drag">Drag</Chip>
                        <Chip value="1h">One hand</Chip>
                        <Chip value="2h">Two hands</Chip>
                      </Chips>
                    </Stack>
                  </AccountEditItem>
                  <AccountEditItem title="Stream style">
                    <Chips>
                      <Chip value="alternate">Alternate</Chip>
                      <Chip value="hybrid">Hybrid</Chip>
                      <Chip value="doubletap">Doubletap</Chip>
                    </Chips>
                  </AccountEditItem>
                </Stack>
              </Center>
            </AccountEditItem>
          </Accordion.Item>
        </Accordion>
      </Paper>
    </Container>
  );
}
