import { Box, Button, Center, Container, Group, PasswordInput, Text, TextInput, Transition, } from "@mantine/core";
import { z } from "zod";
import { shapeWithUsernameWithPassword } from "../server/shapes";
import { useForm, zodResolver } from "@mantine/form";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { getHomePage } from "../utils/router";
import { useEffect, useState } from "react";
import { useAuth } from "../providers/auth";
import { redirectWhenHasSession } from "../utils/auth";
import { useI18nContext } from "../i18n/i18n-react";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const redirect = redirectWhenHasSession(ctx, {});
  
  if (redirect) {
    return redirect;
  }
  
  return {
    props: {},
  };
};

const schema = z.object({
  ...shapeWithUsernameWithPassword,
});

export default function Login() {
  const router = useRouter();
  
  const { LL } = useI18nContext();
  
  const { user, login, loginMutation } = useAuth();
  
  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    schema: zodResolver(schema),
  });
  
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  /**
   * Changes route when login form
   * is submitted
   */
  useEffect(() => {
    if (user) {
      router.push(getHomePage());
    }
  }, [user, router]);
  
  return (
    <Container>
      <Center>
        <Transition mounted={mounted} transition="slide-up" duration={500}>
          {(styles) => {
            return (
              <div>
                <Box sx={{ maxWidth: 300 }} style={styles} mx="auto" my="lg">
                  <form
                    onSubmit={form.onSubmit(({ username, password }) => {
                      login({
                        username,
                        password,
                      });
                    })}
                  >
                    <TextInput
                      label={LL.username()}
                      placeholder={LL.username()}
                      {...form.getInputProps("username")}
                    />
                    <PasswordInput
                      label={LL.password()}
                      placeholder={LL.password()}
                      {...form.getInputProps("password")}
                    />
                    <Group position="center" mt="md">
                      <Button disabled={loginMutation.isLoading} type="submit">
                        Login
                      </Button>
                    </Group>
                  </form>
                </Box>
                {loginMutation.isError && (
                  <Text color="red" mt="lg" align="center">
                    {loginMutation.error.message}
                  </Text>
                )}
              </div>
            );
          }}
        </Transition>
      </Center>
    </Container>
  );
}
