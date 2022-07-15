import { createContext, useContext } from "react";
import { ClientUserFromSession } from "../server/routers/backend/get_user_from_session";

export const UserContext = createContext<ClientUserFromSession | undefined>(
  undefined
);

export const useUser = () => useContext(UserContext);
