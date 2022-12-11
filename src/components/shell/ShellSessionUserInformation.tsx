import { ActionIcon, Card, Center, Menu, Text } from "@mantine/core";
import assert from "assert";
import { GameRules } from "../../database/GameRules";
import { useAuth } from "../../providers/auth";
import { UserAvatar } from "../images/UserAvatar";
import { DoorOff, Settings } from "tabler-icons-react";
import { useRouter } from "next/router";
import { getAccountEditPage } from "../../utils/router";
import { ShellButtonDependencyProps } from "./ShellButton";

export const ShellSessionUserInformation = ({
                                              setOpened,
                                            }: ShellButtonDependencyProps) => {
  const router = useRouter();
  
  const { logout, user } = useAuth();
  
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
          onClick={logout}
        >
          <DoorOff size={16}/>
        </ActionIcon>
      </Center>
      <Center>
        <Menu trigger="hover" delay={500}>
          <Menu.Item
            icon={<Settings size={16}/>}
            onClick={() => {
              setOpened(false);
              router.push(getAccountEditPage());
            }}
          >
            Settings
          </Menu.Item>
        </Menu>
      </Center>
      <Card style={{ display: "flex", flexDirection: "row" }}>
        <Center>
          <UserAvatar alt="User avatar" src={user.image} priority/>
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
