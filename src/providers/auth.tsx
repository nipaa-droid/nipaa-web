import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { z, ZodObject } from "zod";
import { ClientUserFromSession } from "../server/routers/backend/get_user_from_session";
import { shapeWithUsernameWithPassword } from "../server/shapes";
import { trpc } from "../utils/trpc";

type AuthContextUser = ClientUserFromSession & {};

type AuthContextUserUndefinable = AuthContextUser | undefined;

type AuthLoginParams = z.infer<ZodObject<typeof shapeWithUsernameWithPassword>>;

type AuthLoginFunction = (params: AuthLoginParams) => Promise<boolean>;

type AuthContextReturn = {
  user: AuthContextUserUndefinable;
  login: AuthLoginFunction;
  logout: () => Promise<void>;
  authLoading: boolean;
  authError: string;
};

const INITIAL_RETURN: AuthContextReturn = {
  user: undefined,
  login: async () => false,
  logout: async () => {},
  authLoading: true,
  authError: "",
};

export const AuthContext = createContext<AuthContextReturn>(INITIAL_RETURN);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  const utils = trpc.useContext();

  const userQuery = trpc.useQuery(["get-user-for-session"]);

  // works like a mutex.
  let isDoingAuthenticationRequest = useRef(false);

  const executeAuthRequest = useCallback(
    async <T,>(execute: () => Promise<T>, defaultReturn: T) => {
      if (!isDoingAuthenticationRequest.current) {
        isDoingAuthenticationRequest.current = true;
        const result = await execute();
        isDoingAuthenticationRequest.current = false;
        return result;
      } else {
        console.log("Waiting auth request...");
      }
      return defaultReturn;
    },
    []
  );

  // makes user query be refetched
  const invalidateUserSessionQuery = useCallback(() => {
    // only if we didn't fetch
    if (!userQuery.data) {
      utils.invalidateQueries(["get-user-for-session"]);
    }
  }, [userQuery.data, utils]);

  const loginMutation = trpc.useMutation(["web-login"], {
    onSuccess: async () => {
      // we invalidate and refetch because the invalidation works
      // too for subsequent request
      invalidateUserSessionQuery();
      const result = await userQuery.refetch();
      setUser(result.data);
    },
  });

  const logoutMutation = trpc.useMutation(["web-logout"], {
    onMutate: () => {
      setUser(undefined);
      invalidateUserSessionQuery();
    },
  });

  const [user, setUser] = useState<AuthContextUserUndefinable>(
    INITIAL_RETURN.user
  );

  const [error, setError] = useState(INITIAL_RETURN.authError);

  const [loading, setLoading] = useState(INITIAL_RETURN.authLoading);

  useEffect(() => {
    setLoading(loginMutation.isLoading || logoutMutation.isLoading);
  }, [loginMutation.isLoading, logoutMutation.isLoading]);

  useEffect(() => {
    setUser(userQuery.data);
  }, [userQuery.data]);

  useEffect(() => {
    let gotError = false;

    const resetError = () => {
      setError("");
    };

    [loginMutation.error, logoutMutation.error].forEach((error) => {
      if (error && !gotError) {
        gotError = true;
        setError(error.message);
        setTimeout(() => {
          resetError();
        }, 2500);
      }
    });

    if (!gotError) {
      resetError();
    }
  }, [loginMutation.error, logoutMutation.error]);

  const login = useCallback(
    async ({ username, password }: AuthLoginParams) => {
      if (!user) {
        return await executeAuthRequest(async () => {
          try {
            await loginMutation.mutateAsync({ username, password });
            return true;
          } catch (e) {
            return false;
          }
        }, false);
      }
      return false;
    },
    [loginMutation, user, executeAuthRequest]
  );

  const logout = useCallback(async () => {
    if (user) {
      return await executeAuthRequest(async () => {
        try {
          await logoutMutation.mutateAsync();
        } catch (e) {}
      }, undefined);
    }
  }, [logoutMutation, user, executeAuthRequest]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        authLoading: loading,
        authError: error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
