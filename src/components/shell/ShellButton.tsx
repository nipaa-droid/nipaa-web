import { createStyles, Text } from "@mantine/core";
import { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { LinkButtonProps, LinkButton } from "../LinkButton";

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
  isSmall: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
};

export type ShellButtonProps = PropsWithChildren<
  LinkButtonProps<"a"> & ShellButtonDependencyProps
>;

export type ShellButtonPropsWithoutLink = Omit<ShellButtonProps, "linkProps">;

export function ShellButton<C>({
  children,
  buttonProps,
  linkProps,
  isSmall,
  setOpened,
}: ShellButtonProps) {
  const { classes } = useStyles();

  return (
    <LinkButton<C>
      buttonProps={{
        component: "a",
        className: classes.button,
        onClick: () => {
          if (isSmall) {
            setOpened(false);
          }
        },
        ...(buttonProps as any),
      }}
      linkProps={{
        ...linkProps,
      }}
    >
      <Text className={classes.text}>{children}</Text>
    </LinkButton>
  );
}
