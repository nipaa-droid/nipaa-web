import { useI18nContext } from "../../i18n/i18n-react";
import { getHomePage } from "../../utils/router";
import { ShellButton, ShellButtonPropsWithoutLink } from "./ShellButton";

export const HomePageButton = (props: ShellButtonPropsWithoutLink) => {
  const { LL } = useI18nContext();

  return (
    <ShellButton linkProps={{ href: getHomePage() }} {...props}>
      {LL.home()}
    </ShellButton>
  );
};
