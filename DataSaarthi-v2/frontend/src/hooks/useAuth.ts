import { useState, useEffect, useCallback } from "react";
import type { User } from "@/types";
import { api } from "@/services/api";

const STORAGE_KEY = "dsaarthi_user";

interface StoredAuth {
  user: User;
  token: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: StoredAuth = JSON.parse(raw);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback((u: User, t: string) => {
    const payload: StoredAuth = { user: u, token: t };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setUser(u);
    setToken(t);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const guestLogin = useCallback(async () => {
    const data = await api.guestLogin();
    login(data.user, data.access_token);
  }, [login]);

  return { user, token, loading, login, logout, guestLogin };
}
