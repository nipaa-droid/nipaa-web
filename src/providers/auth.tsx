import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { ClientUserFromSession } from "../server/routers/backend/get_user_from_session";

type AuthContextUser = ClientUserFromSession | undefined;

export type AuthContextProps = {
  user: AuthContextUser;
  setUser: Dispatch<SetStateAction<AuthContextUser>>;
};

const INITIAL_USER = undefined;

export const AuthContext = createContext<AuthContextProps>({
  user: INITIAL_USER,
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  const [user, setUser] = useState<AuthContextUser>(INITIAL_USER);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
