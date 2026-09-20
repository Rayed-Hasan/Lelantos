import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserSession,
  CognitoUserAttribute,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";
import type { User } from "./types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const pool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
});

function getUserFromCognito(cognitoUser: CognitoUser): User | null {
  const sessionUser = cognitoUser.getSignInUserSession();

  if (!sessionUser) return null;

  const idToken = sessionUser.getIdToken();
  const payload = idToken.decodePayload() as {
    sub?: string;
    email?: string;
    name?: string;
  };

  return {
    user_id: payload.sub ?? "",
    email: payload.email ?? "",
    name: payload.name ?? payload.email?.split("@")[0] ?? "",
  };
}

function getSession(): Promise<CognitoUserSession | null> {
  const cognitoUser = pool.getCurrentUser();

  if (!cognitoUser) return Promise.resolve(null);

  return new Promise((resolve) => {
    cognitoUser.getSession(
      (error: Error | null, session: CognitoUserSession | null) => {
        resolve(!error && session?.isValid() ? session : null);
      }
    );
  });
}

export const getCognitoIdToken = async (): Promise<string | null> => {
  const session = await getSession();
  return session ? session.getIdToken().getJwtToken() : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cognitoUser = pool.getCurrentUser();

    if (!cognitoUser) {
      setIsLoading(false);
      return;
    }

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (!err && session?.isValid()) {
        setUser(getUserFromCognito(cognitoUser));
      }

      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: pool,
      });

      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      await new Promise<void>((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: () => {
            setUser(getUserFromCognito(cognitoUser));
            resolve();
          },
          onFailure: (error) => {
            reject(error);
          },
        });
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);

    try {
      await new Promise<void>((resolve, reject) => {
        pool.signUp(
          email,
          password,
          [
            new CognitoUserAttribute({ Name: "email", Value: email }),
            new CognitoUserAttribute({ Name: "name", Value: name }),
          ],
          [],
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            console.log("Cognito signup successful:", result);
            resolve();
          }
        );
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const cognitoUser = pool.getCurrentUser();

    if (cognitoUser) {
      cognitoUser.signOut();
    }

    setUser(null);
  };

  const getAccessToken = async (): Promise<string | null> => {
    const session = await getSession();
    return session ? session.getAccessToken().getJwtToken() : null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
