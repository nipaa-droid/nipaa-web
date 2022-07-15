import { getLoginPage } from "../../utils/router";
import { ShellButton, ShellButtonPropsWithoutLink } from "./ShellButton";

export const ShellLoginButton = (props: ShellButtonPropsWithoutLink) => {
  return (
    <ShellButton
      linkProps={{ href: getLoginPage() }}
      buttonProps={{ fullWidth: true }}
      {...props}
    >
      Login
    </ShellButton>
  );
};
