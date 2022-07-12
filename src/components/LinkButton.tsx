import { Button, ButtonProps } from "@mantine/core";
import Link, { LinkProps } from "next/link";
import { PropsWithChildren } from "react";

export type LinkButtonProps<C> = PropsWithChildren<{
  linkProps: LinkProps;
  buttonProps?: ButtonProps<C>;
}>;

export function LinkButton<C>({
  linkProps,
  buttonProps,
  children,
}: LinkButtonProps<C>) {
  return (
    <Link {...linkProps} passHref>
      <Button {...(buttonProps as any)}>{children}</Button>
    </Link>
  );
}
