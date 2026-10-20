import { createContext, useContext, useEffect, useState, useCallback } from "react";
import client, { extractError } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("penny_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("penny_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setChecking(false);
        return;
      }
      try {
        const { data } = await client.get("/auth/me");
        setUser(data.user);
        localStorage.setItem("penny_user", JSON.stringify(data.user));
      } catch {
        setToken(null);
        setUser(null);
        localStorage.removeItem("penny_token");
        localStorage.removeItem("penny_user");
      } finally {
        setChecking(false);
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUsername = useCallback(async (username) => {
    try {
      const { data } = await client.get(`/auth/check/${encodeURIComponent(username)}`);
      return { exists: data.exists };
    } catch (error) {
      return { error: extractError(error) };
    }
  }, []);

  const register = useCallback(async (username, pin) => {
    try {
      const { data } = await client.post("/auth/register", { username, pin });
      localStorage.setItem("penny_token", data.token);
      localStorage.setItem("penny_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractError(error) };
    }
  }, []);

  const login = useCallback(async (username, pin) => {
    try {
      const { data } = await client.post("/auth/login", { username, pin });
      localStorage.setItem("penny_token", data.token);
      localStorage.setItem("penny_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractError(error) };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("penny_token");
    localStorage.removeItem("penny_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, checking, checkUsername, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
