import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DateBar from "../components/DateBar";
import Logo from "../components/Logo";
import Money from "../components/Money";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { todayKey, monthKey, monthBounds, diffDays, formatShort } from "../utils/date";
import { CATEGORY_EMOJI } from "../utils/format";

const ACTIVITY_STYLE = {
  saving: { sign: "+", cls: "text-primary", icon: "🐷" },
  expense: { sign: "−", cls: "text-secondary", icon: "🧾" },
  income: { sign: "+", cls: "text-primary", icon: "💰" },
};

const IconButton = ({ onClick, title, children }) => (
  <button onClick={onClick} className="btn btn-ghost btn-sm btn-circle" title={title}>
    {children}
  </button>
);

const Home = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [todaySaved, setTodaySaved] = useState(0);
  const [todaySpent, setTodaySpent] = useState(0);
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [dueSoon, setDueSoon] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);

  useEffect(() => {
    const today = todayKey();
    const { from, to } = monthBounds(monthKey());
    const safe = (p) => p.catch(() => null); // every card on this screen is optional

    Promise.all([
      safe(client.get("/saving-entries", { params: { from: today, to: today } })),
      safe(client.get("/expenses", { params: { from: today, to: today } })),
      safe(client.get("/stats/overview")),
      safe(client.get("/stats/activity", { params: { limit: 6 } })),
      safe(client.get("/bills")),
      safe(client.get("/budgets")),
      safe(client.get("/stats", { params: { from, to } })),
    ]).then(([sav, exp, ov, act, bills, budgets, stats]) => {
      if (sav) setTodaySaved(sav.data.reduce((s, e) => s + e.amount, 0));
      if (exp) setTodaySpent(exp.data.reduce((s, e) => s + e.amount, 0));
      if (ov) setOverview(ov.data);
      if (act) setActivity(act.data);
      if (bills) {
        setDueSoon(
          bills.data
            .filter((b) => b.isActive && diffDays(today, b.nextDueDate) <= Math.max(3, b.remindDaysBefore ?? 2))
            .slice(0, 3)
        );
      }
      if (budgets && stats) {
        const spent = Object.fromEntries(stats.data.categories.map((c) => [c.category, c.total]));
        spent.Overall = stats.data.totals.spent;
        setBudgetAlerts(
          budgets.data
            .map((b) => ({ ...b, pct: Math.round(((spent[b.category] || 0) / b.limit) * 100) }))
            .filter((b) => b.pct >= 80)
            .sort((a, b) => b.pct - a.pct)
            .slice(0, 2)
        );
      }
    });
  }, []);

  const split = overview && overview.income > 0 ? overview : null;

  return (
    <div className="app-shell-backdrop min-h-screen flex justify-center">
      <div className="app-shell-frame w-full bg-base-100 min-h-screen flex flex-col">
        <DateBar
          title={`Hi, ${user?.username || "there"}`}
          right={
            <div className="flex items-center">
              {settings.appLock.enabled && (
                <IconButton onClick={() => window.dispatchEvent(new Event("penny:lock"))} title="Lock app">
                  🔒
                </IconButton>
              )}
              <IconButton onClick={() => navigate("/reminders")} title="Reminders">
                ⏰
              </IconButton>
              <IconButton onClick={() => navigate("/settings")} title="Settings">
                ⚙️
              </IconButton>
            </div>
          }
        />

        <div className="px-5 flex flex-col items-center mt-2 mb-5">
          <Logo size={48} />
          <h2 className="font-display font-bold text-2xl mt-2 text-center">Penny Tracker</h2>
          <p className="text-base-content/50 text-sm mt-0.5 text-center">save a little, every day</p>
        </div>

        <div className="px-5 grid grid-cols-2 gap-3 mb-4">
          <button onClick={() => navigate(`/day/${todayKey()}`)} className="bg-primary/10 rounded-2xl p-4 text-left">
            <p className="text-xs font-semibold text-primary/80 uppercase tracking-wide">Saved today</p>
            <p className="text-2xl font-display font-extrabold text-primary mt-1"><Money v={todaySaved} /></p>
          </button>
          <button onClick={() => navigate(`/day/${todayKey()}`)} className="bg-secondary/10 rounded-2xl p-4 text-left">
            <p className="text-xs font-semibold text-secondary/80 uppercase tracking-wide">Spent today</p>
            <p className="text-2xl font-display font-extrabold text-secondary mt-1"><Money v={todaySpent} /></p>
          </button>
        </div>

        {/* Overall analysis button - this month's salary: used vs saved */}
        <div className="px-5 mb-4">
          <button onClick={() => navigate("/overview")} className="w-full text-left bg-base-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">Overall analysis · this month</p>
              <span className="text-base-content/40">›</span>
            </div>
            {split ? (
              <>
                <p className="font-display font-extrabold text-lg mt-1">
                  <span className="text-secondary">{split.percent.spent}% used</span>
                  <span className="text-base-content/30"> · </span>
                  <span className="text-primary">{split.percent.saved}% saved</span>
                </p>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-base-300 mt-2">
                  <div className="bg-secondary" style={{ width: `${Math.min(100, split.percent.spent)}%` }} />
                  <div className="bg-primary" style={{ width: `${Math.min(100 - Math.min(100, split.percent.spent), split.percent.saved)}%` }} />
                </div>
              </>
            ) : (
              <p className="text-sm text-base-content/60 mt-1">Set your salary in Settings to see how much you used and saved.</p>
            )}
          </button>
        </div>

        {(dueSoon.length > 0 || budgetAlerts.length > 0) && (
          <div className="px-5 mb-4 space-y-2">
            {dueSoon.map((b) => {
              const d = diffDays(todayKey(), b.nextDueDate);
              return (
                <button key={b._id} onClick={() => navigate("/bills")} className="w-full flex items-center justify-between bg-warning/20 rounded-2xl px-4 py-3 text-left">
                  <p className="text-sm font-semibold truncate">
                    {b.kind === "loan" ? "🏦" : "🧾"} {b.title}{" "}
                    <span className="font-normal text-base-content/60">
                      {d < 0 ? `overdue ${-d}d` : d === 0 ? "due today" : `due ${formatShort(b.nextDueDate)}`}
                    </span>
                  </p>
                  <p className="font-display font-bold text-sm shrink-0"><Money v={b.amount} /></p>
                </button>
              );
            })}
            {budgetAlerts.map((b) => (
              <button key={b._id} onClick={() => navigate("/planner")} className="w-full flex items-center justify-between bg-error/10 rounded-2xl px-4 py-3 text-left">
                <p className="text-sm font-semibold">
                  {CATEGORY_EMOJI[b.category]} {b.category} budget{" "}
                  <span className="font-normal text-base-content/60">{b.pct > 100 ? "exceeded" : "almost used"}</span>
                </p>
                <p className="font-display font-bold text-sm text-error">{b.pct}%</p>
              </button>
            ))}
          </div>
        )}

        <div className="px-5 flex flex-col gap-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate("/savings")} className="btn btn-primary h-24 rounded-3xl text-base font-display font-bold shadow-lg shadow-primary/20 flex-col gap-1">
              <span className="text-2xl">🐷</span>
              SAVINGS
            </button>
            <button onClick={() => navigate("/expenses")} className="btn btn-secondary h-24 rounded-3xl text-base font-display font-bold shadow-lg shadow-secondary/20 flex-col gap-1">
              <span className="text-2xl">🧾</span>
              EXPENSES
            </button>
          </div>
          <button onClick={() => navigate("/bills")} className="btn btn-accent h-20 rounded-3xl text-base font-display font-bold shadow-lg shadow-accent/20 flex-row gap-3">
            <span className="text-2xl">🏦</span>
            BILLS & LOANS
          </button>
          <button onClick={() => navigate("/planner")} className="btn btn-outline h-14 rounded-3xl font-display font-bold">
            🎯 Budgets & goal planner
          </button>
        </div>

        <div className="px-5 pb-10">
          <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2">Recent activity</p>
          {!activity.length ? (
            <p className="text-sm text-base-content/50 py-4 text-center">Nothing yet - add your first saving or expense</p>
          ) : (
            <div className="space-y-2">
              {activity.map((a) => {
                const style = ACTIVITY_STYLE[a.type];
                return (
                  <button key={`${a.type}-${a.id}`} onClick={() => navigate(`/day/${a.date}`)} className="w-full flex items-center justify-between bg-base-200 rounded-2xl px-4 py-3 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg">{a.type === "expense" ? CATEGORY_EMOJI[a.category] || style.icon : a.icon || style.icon}</span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{a.label}</p>
                        <p className="text-xs text-base-content/50">{formatShort(a.date)}</p>
                      </div>
                    </div>
                    <p className={`font-display font-bold shrink-0 ${style.cls}`}>
                      {style.sign}<Money v={a.amount} />
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
