"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  apiFetch,
  setGlobalAccessToken,
  registerAuthFailureListener,
} from "@/lib/api";

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: "candidate" | "recruiter" | "admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (
    email: string,
    password: string,
    rememberMe: boolean
  ) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<void>;
  oauthLogin: (provider: string, token: string, email: string, name?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Clear error state
  const clearError = () => setError(null);

  // Authenticate user session
  const updateAuthInfo = (token: string | null, userData: User | null) => {
    setAccessToken(token);
    setGlobalAccessToken(token);
    setUser(userData);
    if (typeof window !== "undefined") {
      if (token && userData) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  };

  // Login handler
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        json: { email, password, remember_me: rememberMe },
      });
      const data = await res.json();
      updateAuthInfo(data.access_token, data.user);
      router.push("/");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to log in.";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register handler (Option C: Auto-login after registration since OTP is disabled)
  const register = async (
    email: string,
    password: string,
    fullName?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      // Create account
      await apiFetch("/api/auth/register", {
        method: "POST",
        json: { email, password, full_name: fullName },
      });
      // Automatically login
      const loginRes = await apiFetch("/api/auth/login", {
        method: "POST",
        json: { email, password, remember_me: true },
      });
      const loginData = await loginRes.json();
      updateAuthInfo(loginData.access_token, loginData.user);
      router.push("/");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to register.";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify email handler
  const verifyEmail = async (email: string, code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch("/api/auth/verify-email", {
        method: "POST",
        json: { email, code },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to verify email.";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification handler
  const resendVerification = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        json: { email },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to resend code.";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password handler
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        json: { email },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send reset email.";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password handler
  const resetPassword = async (email: string, token: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        json: { email, token, new_password: newPassword },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to reset password.";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth login handler
  const oauthLogin = async (provider: string, token: string, email: string, name?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/oauth/login", {
        method: "POST",
        json: { provider, token, email, name },
      });
      const data = await res.json();
      updateAuthInfo(data.access_token, data.user);
      router.push("/");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "OAuth login failed.";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setIsLoading(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Force client log out even if request fails
    } finally {
      updateAuthInfo(null, null);
      router.push("/login");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Perform silent refresh on app startup
    const checkAuth = async () => {
      if (typeof window !== "undefined") {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        
        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            // Load credentials into state immediately so user sees no loader/logout
            setAccessToken(storedToken);
            setGlobalAccessToken(storedToken);
            setUser(parsedUser);
            setIsLoading(false);
            
            // Validate token in background
            const userRes = await apiFetch("/api/auth/me");
            const userData = await userRes.json();
            updateAuthInfo(storedToken, userData);
            return;
          } catch {
            // If verification fails or parsing breaks, fall back to clearing session
            updateAuthInfo(null, null);
          }
        }
      }

      try {
        const res = await apiFetch("/api/auth/refresh", { method: "POST" });
        const data = await res.json();
        const token = data.access_token;

        setGlobalAccessToken(token);
        const userRes = await apiFetch("/api/auth/me");
        const userData = await userRes.json();

        updateAuthInfo(token, userData);
      } catch {
        // No active refresh token or invalid session
        updateAuthInfo(null, null);
      } finally {
        setIsLoading(false);
      }
    };

    // Check session on start
    checkAuth();

    // Register listener for silent refresh expiry/failure
    registerAuthFailureListener(() => {
      updateAuthInfo(null, null);
      router.push("/login");
    });
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        oauthLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
