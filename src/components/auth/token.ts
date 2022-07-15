import bcrypt from "bcrypt";
import { AuthConstants } from "../../server/auth";

/**
 * This will for sure be unique for each user and will account for password changes
 */
type TokenData = {
  id: string;
  hashedPassword: string;
};

/**
 * Gets the plain text token format for given token data
 */
export const getPlainTextTokenFromTokenData = ({
  id,
  hashedPassword,
  generatedDate,
}: TokenData) => {
  return process.env.AUTH_PEPPER + id + hashedPassword + generatedDate;
};

/**
 * We generate a token based on the user's password and id
 */
export const generateToken = async (data: TokenData) => {
  return await bcrypt.hash(
    getPlainTextTokenFromTokenData(data),
    AuthConstants.rounds
  );
};

/**
 * We then receive the generated token from the client and see if the token matches
 */
export const verifyToken = async (token: string, data: TokenData) => {
  return await bcrypt.compare(getPlainTextTokenFromTokenData(data), token);
};
