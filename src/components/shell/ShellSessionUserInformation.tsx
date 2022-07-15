import { ActionIcon, Card, Center, Text } from "@mantine/core";
import assert from "assert";
import { GameRules } from "../../database/GameRules";
import { useAuth } from "../../providers/auth";
import { UserAvatar } from "../images/UserAvatar";
import { DoorOff } from "tabler-icons-react";

export const ShellSessionUserInformation = () => {
  const { user } = useAuth();

  assert(user);

  return (
    <div>
      <Center>
        <ActionIcon
          size="lg"
          variant="filled"
          m="lg"
          radius="lg"
          color="white"
          onClick={async () => {
            await user.logout();
          }}
        >
          <DoorOff size={16} />
        </ActionIcon>
      </Center>
      <Card style={{ display: "flex", flexDirection: "row" }}>
        <Center>
          <UserAvatar src={user.image} priority />
        </Center>
        <div>
          <Text weight={500} ml="lg">
            {user.name}
          </Text>
          <Text weight={300} ml="lg">
            {Math.round(user.metric)} {GameRules.global_leaderboard_metric}
          </Text>
        </div>
      </Card>
    </div>
  );
};
