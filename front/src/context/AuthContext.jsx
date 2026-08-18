import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth";
import { clearSession, getStoredUser, getToken, setSession } from "../lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(!!getToken());

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const data = await authApi.me();
      const u = data.user || data;
      setSession({ user: u });
      setUser(u);
      return u;
    } catch {
      clearSession();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
    return data;
  }, []);

  const verifyTwoFactor = useCallback(async (email, code) => {
    const data = await authApi.verifyTwoFactor(email, code);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const resendVerification = useCallback(async () => {
    await authApi.resendVerification();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isSuperAdmin: user?.role === "super_admin",
      isOwner: user?.role === "owner" || user?.role === "staff",
      isEmailVerified: !!user?.email_verified_at,
      restaurant: user?.restaurant || null,
      login,
      verifyTwoFactor,
      register,
      logout,
      refresh,
      resendVerification,
    }),
    [user, loading, login, verifyTwoFactor, register, logout, refresh, resendVerification]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
