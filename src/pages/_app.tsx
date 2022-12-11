import { withTRPC } from "@trpc/next";
import { AppType } from "next/dist/shared/lib/utils";
import { AppRouter } from "../server/routers/_app";
import { MantineProvider } from "@mantine/core";
import { ClientShell } from "../components/shell/ClientShell";
import router from "next/router";
import { useEffect, useState } from "react";
import { detectLocale } from "typesafe-i18n/detectors";
import { baseLocale, locales } from "../i18n/i18n-util";
import { loadLocaleAsync } from "../i18n/i18n-util.async";
import { ServerConstants } from "../constants";
import { Locales } from "../i18n/i18n-types";
import TypesafeI18n from "../i18n/i18n-react";
import { mediaBreakPoints } from "../utils/breakpoints";
import { AuthProvider } from "../providers/auth";
import Head from "next/head";

const MyApp: AppType = ({ Component, pageProps }) => {
	const [locale, setLocale] = useState<Locales | undefined>(undefined);
	
	useEffect(() => {
		const locale = detectLocale(
			router.locale ?? baseLocale,
			locales
		) as Locales;
		loadLocaleAsync(locale).then(() => {
			setLocale(locale);
		});
	}, []);
	
	return (
		<MantineProvider
			theme={{
				breakpoints: mediaBreakPoints,
				primaryColor: "gray",
				/** Put your mantine theme override here */
				colorScheme: "dark",
			}}
		>
			{locale && (
				<TypesafeI18n locale={locale}>
					<AuthProvider>
						<ClientShell>
							<Head>
								<title>{ServerConstants.SERVER_NAME}</title>
								<meta
									name="viewport"
									content="minimum-scale=1, initial-scale=1, width=device-width"
								/>
							</Head>
							<Component {...pageProps} />
						</ClientShell>
					</AuthProvider>
				</TypesafeI18n>
			)}
		</MantineProvider>
	);
};

export default withTRPC<AppRouter>({
	config() {
		/**
		 * If you want to use SSR, you need to use the server's full URL
		 * @link https://trpc.io/docs/ssr
		 */
		const url = `${ServerConstants.SERVER_URL}/api/trpc`;
		
		return {
			url,
			/**
			 * @link https://react-query.tanstack.com/reference/QueryClient
			 */
			// queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
		};
	},
	/**
	 * @link https://trpc.io/docs/ssr
	 */
	ssr: true,
})(MyApp);
