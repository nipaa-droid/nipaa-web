import Link from "next/link";
import { useI18nContext } from "../../i18n/i18n-react";
import { getHomePage } from "../../utils/router";
import { ShellButton, ShellButtonProps } from "./ShellButton";

export const HomePageButton = (props: ShellButtonProps) => {
  const { LL } = useI18nContext();
  
  return (
    <Link href={getHomePage()} passHref>
      <ShellButton {...props}>{LL.home()}</ShellButton>
    </Link>
  );
};
