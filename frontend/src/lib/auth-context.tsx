/**
 * Auth Context — User authentication state management.
 * Master Plan section 23.
 *
 * Currently works with a test user. Wire to Cognito later
 * by changing only the login/signup functions.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User } from "./types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Dev test user (section 23: hardcoded until Cognito is wired)
const DEV_USER: User = {
  user_id: "user_lelantos_dev",
  email: "dev@lelantos.ai",
  name: "Lelantos Dev",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem("lelantos_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("lelantos_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // TODO: Wire to Cognito
    // For now, accept any credentials and use test user
    setIsLoading(true);
    try {
      // Simulate auth delay
      await new Promise((r) => setTimeout(r, 500));

      const loggedInUser: User = {
        ...DEV_USER,
        email: email || DEV_USER.email,
        name: email?.split("@")[0] || DEV_USER.name,
      };

      localStorage.setItem("lelantos_user", JSON.stringify(loggedInUser));
      localStorage.setItem("lelantos_token", "dev-token");
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    // TODO: Wire to Cognito
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));

      const newUser: User = {
        user_id: `user_${Date.now()}`,
        email,
        name,
      };

      localStorage.setItem("lelantos_user", JSON.stringify(newUser));
      localStorage.setItem("lelantos_token", "dev-token");
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("lelantos_user");
    localStorage.removeItem("lelantos_token");
    setUser(null);
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
