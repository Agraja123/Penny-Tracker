import { useEffect, useRef, useState, useCallback } from "react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import client, { extractError } from "../api/client";

const UNLOCK_KEY = "penny_unlocked";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

const LockScreen = ({ onUnlock }) => {
  const { logout, user } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const press = useCallback(
    (k) => {
      if (busy) return;
      setError("");
      if (k === "⌫") setPin((p) => p.slice(0, -1));
      else if (/^\d$/.test(k)) setPin((p) => (p.length < 4 ? p + k : p));
    },
    [busy]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Backspace") press("⌫");
      else if (/^\d$/.test(e.key)) press(e.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  useEffect(() => {
    if (pin.length !== 4) return;
    setBusy(true);
    client
      .post("/settings/verify-pin", { pin })
      .then(onUnlock)
      .catch((err) => {
        setError(extractError(err));
        setPin("");
      })
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <div className="fixed inset-0 z-[100] bg-base-100 flex flex-col items-center justify-center px-8">
      <Logo size={52} />
      <h2 className="font-display font-bold text-xl mt-4">Penny Tracker is locked</h2>
      <p className="text-sm text-base-content/60 mt-1">Enter your PIN, {user?.username}</p>

      <div className="flex gap-3 mt-6 h-4">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`w-4 h-4 rounded-full border-2 border-primary ${pin.length > i ? "bg-primary" : ""}`} />
        ))}
      </div>
      <p className="text-error text-sm font-medium h-5 mt-3">{error}</p>

      <div className="grid grid-cols-3 gap-3 mt-3 w-64">
        {KEYS.map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <button key={i} onClick={() => press(k)} className="btn btn-ghost bg-base-200 h-14 text-xl font-display font-bold">
              {k}
            </button>
          )
        )}
      </div>

      <button onClick={logout} className="btn btn-link btn-sm mt-6 text-base-content/50 no-underline">
        Forgot PIN? Log out
      </button>
    </div>
  );
};

// Wraps the signed-in part of the app. When App Lock is on it asks for the PIN
// on every new visit, after the app has been idle, or after being in the background.
// Anything can lock it on demand with: window.dispatchEvent(new Event("penny:lock"))
const AppLockGate = ({ children }) => {
  const { settings, loaded } = useSettings();
  const { enabled, timeoutMinutes } = settings.appLock;
  const [locked, setLocked] = useState(false);
  const lastActive = useRef(Date.now());
  const hiddenAt = useRef(null);

  const lock = useCallback(() => {
    sessionStorage.removeItem(UNLOCK_KEY);
    setLocked(true);
  }, []);

  const unlock = () => {
    sessionStorage.setItem(UNLOCK_KEY, "1");
    lastActive.current = Date.now();
    setLocked(false);
  };

  // lock when the app opens (new tab / fresh launch)
  useEffect(() => {
    if (loaded && enabled && !sessionStorage.getItem(UNLOCK_KEY)) setLocked(true);
    if (!enabled) setLocked(false);
  }, [loaded, enabled]);

  useEffect(() => {
    window.addEventListener("penny:lock", lock);
    return () => window.removeEventListener("penny:lock", lock);
  }, [lock]);

  useEffect(() => {
    if (!enabled) return undefined;
    const touch = () => {
      lastActive.current = Date.now();
    };
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current && Date.now() - hiddenAt.current >= timeoutMinutes * 60000) {
        lock();
      }
    };
    const events = ["pointerdown", "keydown", "scroll"];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    const timer = setInterval(() => {
      if (timeoutMinutes > 0 && Date.now() - lastActive.current >= timeoutMinutes * 60000) lock();
    }, 5000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(timer);
    };
  }, [enabled, timeoutMinutes, lock]);

  if (locked) return <LockScreen onUnlock={unlock} />;
  return children;
};

export default AppLockGate;
