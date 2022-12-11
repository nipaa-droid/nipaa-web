import Link from "next/link";
import { getLoginPage } from "../../utils/router";
import { ShellButton, ShellButtonProps } from "./ShellButton";

export const ShellLoginButton = (props: ShellButtonProps) => {
	return (
		<Link passHref href={getLoginPage()}>
			<ShellButton {...props}>Login</ShellButton>
		</Link>
	);
};
