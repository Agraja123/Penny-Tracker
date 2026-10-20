import { createContext, useContext, useEffect, useState, useCallback } from "react";
import client, { extractError } from "../api/client";
import { useAuth } from "./AuthContext";

const SettingsContext = createContext(null);

const DEFAULTS = {
  salary: 0,
  salaryDay: 1,
  theme: "penny",
  appLock: { enabled: false, timeoutMinutes: 1 },
};

const merge = (base, patch) => ({
  ...base,
  ...patch,
  appLock: { ...base.appLock, ...(patch?.appLock || {}) },
});

export const THEMES = [
  { key: "penny", label: "Penny", swatch: ["#0E7C66", "#E8604C", "#FBF8F1"] },
  { key: "penny-dark", label: "Night", swatch: ["#2FBF96", "#FF8069", "#0F1613"] },
  { key: "ocean", label: "Ocean", swatch: ["#1D6FB8", "#F0803C", "#F4F9FD"] },
  { key: "sunset", label: "Sunset", swatch: ["#C2410C", "#7C3AED", "#FFF7ED"] },
];

export const SettingsProvider = ({ children }) => {
  const { token } = useAuth();
  const [settings, setSettings] = useState(() =>
    merge(DEFAULTS, {
      theme: localStorage.getItem("penny_theme") || "penny",
    })
  );
  const [loaded, setLoaded] = useState(false);

  // Load the saved settings from the server so they follow the user across devices.
  useEffect(() => {
    if (!token) {
      setLoaded(false);
      return;
    }
    client
      .get("/settings")
      .then(({ data }) => setSettings((prev) => merge(prev, data)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [token]);

  // Apply the theme to the page itself.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
    localStorage.setItem("penny_theme", settings.theme);
  }, [settings.theme]);

  // Optimistic update: the UI changes instantly, and rolls back if the server refuses.
  const updateSettings = useCallback(async (patch) => {
    let previous;
    setSettings((prev) => {
      previous = prev;
      return merge(prev, patch);
    });
    try {
      const { data } = await client.put("/settings", patch);
      setSettings((prev) => merge(prev, data));
      return { ok: true };
    } catch (error) {
      setSettings(previous);
      return { ok: false, error: extractError(error) };
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded, updateSettings }}>{children}</SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
