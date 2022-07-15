import { destroyCookie } from "nookies";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { ClientUserFromSession } from "../server/routers/backend/get_user_from_session";
import { clientGetSessionCookie } from "../utils/auth";
import { CookieNames } from "../utils/cookies";
import { trpc } from "../utils/trpc";

type AuthContextUser =
  | ClientUserFromSession & {
      logout: () => Promise<void>;
    };

type AuthContextUserUndefinable = AuthContextUser | undefined;

export type AuthContextProps = {
  user: AuthContextUserUndefinable;
};

const INITIAL_USER: AuthContextUserUndefinable = undefined;

export const AuthContext = createContext<AuthContextProps>({
  user: INITIAL_USER,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  const mutation = trpc.useMutation(["web-logout"]);

  const userQuery = trpc.useQuery([
    "get-user-for-session",
    {
      ssid: clientGetSessionCookie(),
    },
  ]);

  const [user, setUser] = useState<AuthContextUserUndefinable>(INITIAL_USER);

  useEffect(() => {
    setUser(
      !userQuery.data
        ? undefined
        : {
            ...userQuery.data,
            logout: async () => {
              if (user) {
                await mutation.mutateAsync({
                  ssid: clientGetSessionCookie(),
                });
                destroyCookie(null, CookieNames.SESSION_ID);
                setUser(undefined);
              }
            },
          }
    );
  }, [mutation, user, userQuery.data]);

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};
