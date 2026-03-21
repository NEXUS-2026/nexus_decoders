"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = () => {
      const savedUser = localStorage.getItem("decoders_user");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          console.log("Found saved user:", userData);
          setUser(userData);
        } catch (error) {
          console.error("Error parsing saved user:", error);
          localStorage.removeItem("decoders_user");
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // TODO: Replace with actual API call
    setIsLoading(true);
    
    // Mock authentication - replace with real API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data - replace with real user data from API
    const mockUser: User = {
      id: "1",
      name: email.split("@")[0],
      email,
      role: "operator" // Default role, should come from API
    };
    
    setUser(mockUser);
    localStorage.setItem("decoders_user", JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("decoders_user");
    window.location.href = "/auth/login";
  };

  // Auto-redirect to session/new when user logs in
  useEffect(() => {
    if (user && window.location.pathname === "/") {
      window.location.href = "/session/new";
    }
  }, [user]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isLoading,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
