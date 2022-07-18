import { Center, Card, Title, Divider, Stack } from "@mantine/core";
import { PropsWithChildren } from "react";

export const AccountEditItem = ({
  title,
  children,
}: PropsWithChildren<{
  title: string;
}>) => {
  return (
    <Center>
      <Card>
        <Stack>
          <Center>
            <Title order={5}>{title}</Title>
          </Center>
          <Divider />
          <Center>
            <Stack>{children}</Stack>
          </Center>
        </Stack>
      </Card>
    </Center>
  );
};
