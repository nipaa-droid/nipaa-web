import { Card, Center, Divider, Stack, Title } from "@mantine/core";
import { PropsWithChildren } from "react";

export type AccountEditBoxProps = PropsWithChildren<{ title: string }>;

export const AccountEditBox = ({ title, children }: AccountEditBoxProps) => {
  return (
    <Center>
      <Card>
        <Stack>
          <Center>
            <Title order={5}>{title}</Title>
          </Center>
          <Divider/>
          <Center>
            <Stack>{children}</Stack>
          </Center>
        </Stack>
      </Card>
    </Center>
  );
};
