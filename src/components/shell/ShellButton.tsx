import { Button, createStyles, Text } from "@mantine/core";
import { Dispatch, PropsWithChildren, SetStateAction } from "react";

const useStyles = createStyles((theme) => ({
  button: {
    color: theme.primaryColor,
    marginTop: "10%",
  },
  text: {
    color: theme.white,
  },
}));

export type ShellButtonDependencyProps = {
  setOpened: Dispatch<SetStateAction<boolean>>;
};

export type ShellButtonProps = PropsWithChildren<ShellButtonDependencyProps>;

export function ShellButton(props: ShellButtonProps) {
  const { classes } = useStyles();

  return (
    <Button
      component="a"
      className={classes.button}
      onClick={() => props.setOpened(false)}
      {...props}
    >
      <Text className={classes.text}>{props.children}</Text>
    </Button>
  );
}
