import { Container, Card, Text, Image, Center, Paper } from "@mantine/core";
import { ServerConstants } from "../../constants";
import { LinkButton } from "../LinkButton";
import { IndexPaperProps, IndexPaperPropTypes } from "./IndexPaper";

export const DiscordInvitation = ({
  styles,
  className,
}: IndexPaperPropTypes) => {
  return (
    <Container style={{ flexGrow: 0.8 }}>
      <Paper {...IndexPaperProps} styles={styles} className={className}>
        <Card style={{ height: "8rem" }}>
          <Card.Section padding="lg" m="xs">
            <Center>
              <Image
                alt="discord logo"
                src="discord.svg"
                width={64}
                withPlaceholder
              />
            </Center>
          </Card.Section>
          <LinkButton
            buttonProps={{
              component: "a",
              fullWidth: true,
              style: {
                marginBottom: "1rem",
              },
            }}
            linkProps={{ href: ServerConstants.DISCORD_URL }}
          >
            <Text>Join our discord</Text>
          </LinkButton>
        </Card>
      </Paper>
    </Container>
  );
};
