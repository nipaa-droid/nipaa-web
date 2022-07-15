import {
  Box,
  Button,
  Center,
  Container,
  Group,
  PasswordInput,
  Text,
  TextInput,
  Transition,
} from "@mantine/core";
import { z } from "zod";
import { shapeWithUsernameWithPassword } from "../server/shapes";
import { useForm, zodResolver } from "@mantine/form";
import { trpc } from "../utils/trpc";
import { setCookie } from "nookies";
import { CookieNames } from "../utils/cookies";
import nookies from "nookies";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { getHomePage } from "../utils/router";
import { useEffect, useState } from "react";

const schema = z.object({
  ...shapeWithUsernameWithPassword,
});

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cookies = nookies.get(ctx);
  if (cookies[CookieNames.SESSION_ID]) {
    return {
      props: {},
      redirect: {
        destination: getHomePage(),
      },
    };
  }
  return {
    props: {},
  };
};

export default function Login() {
  const router = useRouter();

  const loginMutation = trpc.useMutation(["web-login"]);

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

  return (
    <Container>
      <Center>
        <Transition mounted={mounted} transition="slide-up" duration={500}>
          {(styles) => {
            return (
              <Box sx={{ maxWidth: "600" }} style={styles} mx="auto" my="lg">
                <form
                  onSubmit={form.onSubmit(async ({ username, password }) => {
                    try {
                      const res = await loginMutation.mutateAsync({
                        username,
                        password,
                      });

                      setCookie(null, CookieNames.SESSION_ID, res.session);

                      router.push(getHomePage());
                    } catch {}
                  })}
                >
                  <TextInput
                    label="Username"
                    placeholder="Username"
                    {...form.getInputProps("username")}
                  />
                  <PasswordInput
                    label="Password"
                    placeholder="Password"
                    {...form.getInputProps("password")}
                  />
                  <Group position="center" mt="md">
                    <Button disabled={loginMutation.isLoading} type="submit">
                      Login
                    </Button>
                  </Group>
                </form>
                {loginMutation.error && (
                  <Text color="red" mt="lg" align="center">
                    {loginMutation.error.message}
                  </Text>
                )}
              </Box>
            );
          }}
        </Transition>
      </Center>
    </Container>
  );
}
