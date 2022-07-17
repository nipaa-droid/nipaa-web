import { minutesToMilliseconds } from "date-fns";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { InvalidateQueryFilters } from "react-query";
import { z, ZodObject } from "zod";
import { ClientUserFromSession } from "../server/routers/web/session_user";
import { shapeWithUsernameWithPassword } from "../server/shapes";
import { AnyMutation, AnyQuery, trpc } from "../utils/trpc";
import { parseCookies } from "nookies";
import { CookieNames } from "../utils/cookies";

type AuthContextUser = ClientUserFromSession & {};

type AuthContextUserUndefinable = AuthContextUser | undefined;

type AuthLoginParams = z.infer<ZodObject<typeof shapeWithUsernameWithPassword>>;

type AuthLoginFunction = (params: AuthLoginParams) => void;

type AuthContextReturn = {
  user: AuthContextUserUndefinable;
  login: AuthLoginFunction;
  logout: () => void;
  userQuery: AnyQuery;
  loginMutation: AnyMutation;
  logoutMutation: AnyMutation;
};

const INITIAL_RETURN: AuthContextReturn = {
  user: undefined,
  login: () => {},
  logout: () => {},
  userQuery: {} as any,
  loginMutation: {} as any,
  logoutMutation: {} as any,
};

export const AuthContext = createContext<AuthContextReturn>(INITIAL_RETURN);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  const utils = trpc.useContext();

  const hasSessionCookie = useRef(false);

  const userQuery = trpc.useQuery(["web-session-user"], {
    onSuccess: (data) => {
      setUser(data);
    },
    enabled: hasSessionCookie.current,
    retry: false,
  });

  const invalidateUserQuery = useCallback(
    (filters?: InvalidateQueryFilters) => {
      utils.invalidateQueries(["web-session-user"], {
        exact: true,
        ...filters,
      });
    },
    [utils]
  );

  const [user, setUser] = useState<AuthContextUserUndefinable>(
    INITIAL_RETURN.user
  );

  const isStartupLogin = useRef(true);

  useEffect(() => {
    /**
     * Only login at startup if we have the cookie
     */
    if (isStartupLogin.current) {
      isStartupLogin.current = false;
      const hasSession = parseCookies()[CookieNames.HAS_SESSION_COOKIE];
      hasSessionCookie.current = Boolean(hasSession);
      if (hasSessionCookie.current) {
        /**
         * We refetch rather than invalidating on first run
         */
        userQuery.refetch();
      }
    }
  }, [userQuery]);

  const loginMutation = trpc.useMutation(["web-login"], {
    onSuccess: () => {
      /**
       * The server creates the cookie
       */
      hasSessionCookie.current = true;
      invalidateUserQuery();
    },
  });

  const logoutMutation = trpc.useMutation(["web-logout"], {
    onSuccess: () => {
      /**
       * The server destroys the cookie
       */
      hasSessionCookie.current = false;
      /**
       * We don't invalidate because on logout the query shouldn't matter
       */
      setUser(undefined);
    },
  });

  const refreshAuthMutation = trpc.useMutation(["web-refresh"]);

  const interval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!interval.current) {
      const REFRESH_INTERVAL = minutesToMilliseconds(30);
      interval.current = setInterval(
        () => refreshAuthMutation.mutate(),
        REFRESH_INTERVAL
      );
    }
  }, [refreshAuthMutation]);

  const login = useCallback(
    ({ username, password }: AuthLoginParams) => {
      if (!user && !loginMutation.isLoading) {
        loginMutation.mutate({ username, password });
      }
    },
    [loginMutation, user]
  );

  const logout = useCallback(() => {
    if (user && !logoutMutation.isLoading) {
      logoutMutation.mutate();
    }
  }, [logoutMutation, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        userQuery,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
