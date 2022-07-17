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
import { AnyMutation, trpc } from "../utils/trpc";

type AuthContextUser = ClientUserFromSession & {};

type AuthContextUserUndefinable = AuthContextUser | undefined;

type AuthLoginParams = z.infer<ZodObject<typeof shapeWithUsernameWithPassword>>;

type AuthLoginFunction = (params: AuthLoginParams) => void;

type AuthContextReturn = {
  user: AuthContextUserUndefinable;
  login: AuthLoginFunction;
  logout: () => void;
  loginMutation: AnyMutation;
  logoutMutation: AnyMutation;
};

const INITIAL_RETURN: AuthContextReturn = {
  user: undefined,
  login: () => {},
  logout: () => {},
  loginMutation: {} as any,
  logoutMutation: {} as any,
};

export const AuthContext = createContext<AuthContextReturn>(INITIAL_RETURN);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  const utils = trpc.useContext();

  trpc.useQuery(["web-session-user"], {
    onSuccess: (data) => {
      setUser(data);
    },
    retry: false,
  });

  const invalidateUserQuery = (filters?: InvalidateQueryFilters) => {
    utils.invalidateQueries(["web-session-user"], {
      exact: true,
      ...filters,
    });
  };

  const loginMutation = trpc.useMutation(["web-login"], {
    onSuccess: () => {
      invalidateUserQuery();
    },
  });

  const logoutMutation = trpc.useMutation(["web-logout"], {
    /**
     * Only invalidate after we actually logout
     */
    onSuccess: () => {
      invalidateUserQuery({
        /**
         * Although we want to invalidate the query we don't want to do extra work
         * since this is a logout action.
         */
        refetchInactive: false,
        refetchActive: false,
      });
    },
    /**
     * To provide a better UX we set user on mutate
     */
    onMutate: () => {
      setUser(undefined);
    },
  });

  const refreshAuthMutation = trpc.useMutation(["web-refresh"]);

  const [user, setUser] = useState<AuthContextUserUndefinable>(
    INITIAL_RETURN.user
  );

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
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
