import { withTRPC } from "@trpc/next";
import { AppType } from "next/dist/shared/lib/utils";
import { AppRouter } from "../server/routers/_app";
import { MantineProvider } from "@mantine/core";
import { ClientShell } from "../components/ClientShell";
import { AppLoader } from "../components/AppLoader";
import router from "next/router";
import { useState, useEffect } from "react";
import { detectLocale } from "typesafe-i18n/detectors";
import { baseLocale, locales } from "../i18n/i18n-util";
import { loadLocaleAsync } from "../i18n/i18n-util.async";
import { ServerConstants } from "../constants";
import { Locales } from "../i18n/i18n-types";
import TypesafeI18n from "../i18n/i18n-react";

const MyApp: AppType = ({ Component, pageProps }) => {
  const [locale, setLocale] = useState<Locales | undefined>(undefined);

  useEffect(() => {
    const l = detectLocale(router.locale ?? baseLocale, locales) as Locales;
    loadLocaleAsync(l).then(() => {
      setLocale(l);
    });
  }, []);

  return (
    <MantineProvider
      theme={{
        primaryColor: "gray",
        /** Put your mantine theme override here */
        colorScheme: "dark",
      }}
    >
      {locale && (
        <TypesafeI18n locale={locale}>
          <ClientShell>
            <Component {...pageProps} />
          </ClientShell>
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
    const url =
      process.env.NODE_ENV === "production"
        ? `https://${ServerConstants.PRODUCTION_URL}/api/trpc`
        : "http://localhost:3000/api/trpc";

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
