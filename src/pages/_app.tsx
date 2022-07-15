import { withTRPC } from "@trpc/next";
import { AppType } from "next/dist/shared/lib/utils";
import { AppRouter } from "../server/routers/_app";
import { MantineProvider } from "@mantine/core";
import { ClientShell } from "../components/ClientShell";
import router from "next/router";
import { useState, useEffect } from "react";
import { detectLocale } from "typesafe-i18n/detectors";
import { baseLocale, locales } from "../i18n/i18n-util";
import { loadLocaleAsync } from "../i18n/i18n-util.async";
import { ServerConstants } from "../constants";
import { Locales } from "../i18n/i18n-types";
import TypesafeI18n from "../i18n/i18n-react";
import { mediaBreakPoints } from "../utils/breakpoints";
import { AuthProvider, useAuth } from "../providers/auth";
import { trpc } from "../utils/trpc";
import { clientGetSessionCookie } from "../utils/auth";

const MyApp: AppType = ({ Component, pageProps }) => {
  const [locale, setLocale] = useState<Locales | undefined>(undefined);
  const { setUser } = useAuth();

  const userQuery = trpc.useQuery([
    "get-user-for-session",
    {
      ssid: clientGetSessionCookie(),
    },
  ]);

  useEffect(() => {
    setUser(userQuery.data);
  }, [userQuery.data, setUser]);

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
