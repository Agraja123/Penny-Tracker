import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { todayKey, diffDays } from "../utils/date";

const FIRED_KEY = "penny_fired";

const readFired = () => {
  try {
    const all = JSON.parse(localStorage.getItem(FIRED_KEY) || "{}");
    // keep only today's entries so this never grows
    return Object.fromEntries(Object.entries(all).filter(([, d]) => d === todayKey()));
  } catch {
    return {};
  }
};
const markFired = (id) => {
  const all = readFired();
  all[id] = todayKey();
  localStorage.setItem(FIRED_KEY, JSON.stringify(all));
};

const minutesOf = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const runsToday = (r, now) => {
  if (!r.enabled) return false;
  if (r.frequency === "daily") return true;
  if (r.frequency === "weekly") return (r.weekdays || []).includes(now.getDay());
  if (r.frequency === "monthly") {
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return now.getDate() === Math.min(r.dayOfMonth || 1, last);
  }
  return false;
};

// Shows a system notification when allowed (works on phones through the service worker)
export const notify = async (title, body) => {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg?.showNotification) {
      await reg.showNotification(title, { body, icon: "/coin.svg", badge: "/coin.svg" });
    } else {
      new Notification(title, { body, icon: "/coin.svg" });
    }
    return true;
  } catch {
    return false;
  }
};

const BILL_EMOJI = { loan: "🏦", bill: "🧾" };

// Runs while the app is open (including as an installed app in the background).
//  - fires the user's scheduled savings/expense reminders at their chosen time
//  - warns once a day about bills and EMIs that are due soon or overdue
const ReminderEngine = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const reminders = useRef([]);
  const bills = useRef([]);

  const push = useCallback((id, icon, title, body, to) => {
    if (readFired()[id]) return;
    markFired(id);
    setAlerts((a) => [...a, { id, icon, title, body, to }]);
    notify(title, body);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [r, b] = await Promise.all([client.get("/reminders"), client.get("/bills")]);
      reminders.current = r.data;
      bills.current = b.data;
    } catch {
      // reminders are best-effort
    }
  }, []);

  const check = useCallback(() => {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    for (const r of reminders.current) {
      if (!runsToday(r, now)) continue;
      const diff = nowMin - minutesOf(r.time);
      // fire on time, or up to an hour late if the app was opened just after
      if (diff >= 0 && diff <= 60) {
        push(`rem-${r._id}-${r.time}`, "⏰", r.title, r.kind === "saving" ? "Time to log your savings" : r.kind === "expense" ? "Time to note down today's expenses" : "Penny Tracker reminder", r.kind === "saving" ? "/savings" : r.kind === "expense" ? "/expenses" : r.kind === "bill" ? "/bills" : "/home");
      }
    }

    const today = todayKey();
    for (const b of bills.current) {
      if (!b.isActive) continue;
      const days = diffDays(today, b.nextDueDate);
      if (days < 0) {
        push(`bill-${b._id}-${b.nextDueDate}-late`, BILL_EMOJI[b.kind], `${b.title} is overdue`, `Was due ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`, "/bills");
      } else if (days <= (b.remindDaysBefore ?? 2)) {
        push(`bill-${b._id}-${b.nextDueDate}`, BILL_EMOJI[b.kind], `${b.title} is due ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}`, "Tap to open Bills & Loans", "/bills");
      }
    }
  }, [push]);

  useEffect(() => {
    let timer;
    loadData().then(() => {
      check();
      timer = setInterval(check, 20000);
    });
    const refresh = () => loadData().then(check);
    window.addEventListener("penny:data-changed", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("penny:data-changed", refresh);
    };
  }, [loadData, check]);

  if (!alerts.length) return null;
  const dismiss = (id) => setAlerts((a) => a.filter((x) => x.id !== id));

  return (
    <div className="fixed top-3 inset-x-3 z-[70] flex flex-col gap-2 items-center pointer-events-none">
      {alerts.slice(-3).map((a) => (
        <div key={a.id} className="pointer-events-auto w-full max-w-[456px] bg-neutral text-neutral-content rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">{a.icon}</span>
          <button
            className="flex-1 text-left min-w-0"
            onClick={() => {
              dismiss(a.id);
              navigate(a.to);
            }}
          >
            <p className="font-semibold text-sm truncate">{a.title}</p>
            <p className="text-xs opacity-70 truncate">{a.body}</p>
          </button>
          <button onClick={() => dismiss(a.id)} className="btn btn-ghost btn-xs btn-circle">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default ReminderEngine;
