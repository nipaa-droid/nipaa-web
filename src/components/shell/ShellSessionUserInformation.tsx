import { Card, Text } from "@mantine/core";
import assert from "assert";
import { DatabaseSetup } from "../../database/DatabaseSetup";
import { useAuth } from "../../providers/auth";
import { UserAvatar } from "../images/UserAvatar";

export const ShellSessionUserInformation = () => {
  const { user } = useAuth();

  assert(user);

  return (
    <Card style={{ display: "flex", flexDirection: "row" }}>
      <UserAvatar userAvatar={user.image} />
      <div>
        <Text weight={500} ml="lg">
          {user.name}
        </Text>
        <Text weight={300} ml="lg">
          {Math.round(user.metric)} {DatabaseSetup.global_leaderboard_metric}
        </Text>
      </div>
    </Card>
  );
};
