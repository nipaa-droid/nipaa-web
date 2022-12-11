import { Accordion, Center, Chip, Chips, Container, createStyles, Paper, Stack, } from "@mantine/core";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { AccountEditBox } from "../../components/account/edit/AccountEditBox";
import { AccountEditInput } from "../../components/account/edit/AccountEditInput";
import { AccountEditItem } from "../../components/account/edit/AccountEditItem";
import { useI18nContext } from "../../i18n/i18n-react";
import { useAuth } from "../../providers/auth";
import { shapeWithEmail, shapeWithPassword } from "../../server/shapes";
import { redirectWhenNoSession } from "../../utils/auth";
import { getHomePage } from "../../utils/router";
import { trpc } from "../../utils/trpc";

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
  
  const changeEmailMutation = trpc.useMutation(["change-email"], {
    onSuccess: (_, vars) => {
      if (user) {
        user.email = vars.email;
      }
    },
  });
  
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
            <AccountEditBox title="Your credentials">
              <AccountEditItem
                onSubmit={async (data) =>
                  await changeEmailMutation.mutateAsync({ ...data })
                }
                boxProps={{ title: LL.email() }}
                schema={shapeWithEmail}
                formProps={{
                  initialValues: { email: "" },
                }}
              >
                {(form) => (
                  <AccountEditInput
                    className={classes.blockedInput}
                    placeholder={user?.email}
                    type="email"
                    {...form.getInputProps("email")}
                  />
                )}
              </AccountEditItem>
              <AccountEditItem
                onSubmit={async () => {
                }}
                boxProps={{ title: LL.password() }}
                schema={shapeWithPassword}
                formProps={{
                  initialValues: { password: "" },
                }}
              >
                {(form) => (
                  <AccountEditInput
                    type="password"
                    placeholder={"*".repeat(16)}
                    className={classes.blockedInput}
                    {...form.getInputProps("password")}
                  />
                )}
              </AccountEditItem>
            </AccountEditBox>
          </Accordion.Item>
          <Accordion.Item label="Preferences">
            <AccountEditBox title="Playstyle">
              <Center>
                <Stack sx={{ width: "90%" }}>
                  <AccountEditBox title="Aim style">
                    <Stack>
                      <Chips multiple>
                        <Chip value="drag">Drag</Chip>
                        <Chip value="1h">One hand</Chip>
                        <Chip value="2h">Two hands</Chip>
                      </Chips>
                    </Stack>
                  </AccountEditBox>
                  <AccountEditBox title="Stream style">
                    <Chips>
                      <Chip value="alternate">Alternate</Chip>
                      <Chip value="hybrid">Hybrid</Chip>
                      <Chip value="doubletap">Doubletap</Chip>
                    </Chips>
                  </AccountEditBox>
                </Stack>
              </Center>
            </AccountEditBox>
          </Accordion.Item>
        </Accordion>
      </Paper>
    </Container>
  );
}
