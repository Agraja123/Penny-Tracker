import { useEffect, useState, useCallback, useMemo } from "react";
import PageShell, { Fab, Spinner } from "../components/PageShell";
import BudgetModal from "../components/BudgetModal";
import GoalModal from "../components/GoalModal";
import ConfirmDialog from "../components/ConfirmDialog";
import Money from "../components/Money";
import { ProgressBar } from "../components/Charts";
import { useToast } from "../hooks/useToast";
import client, { extractError } from "../api/client";
import { CATEGORY_EMOJI } from "../utils/format";
import { monthBounds, monthKey, todayKey, diffDays, daysLeftInMonth, formatShort } from "../utils/date";

const toneFor = (pct) => (pct > 100 ? "error" : pct >= 80 ? "warning" : "primary");

// Financial planning: monthly spending budgets + savings goal planner.
const Planner = () => {
  const [tab, setTab] = useState("budgets");
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [spentByCategory, setSpentByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, flash] = useToast();

  const [budgetModal, setBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteBudget, setDeleteBudget] = useState(null);
  const [goalModal, setGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deleteGoal, setDeleteGoal] = useState(null);

  const load = useCallback(async () => {
    const { from, to } = monthBounds(monthKey());
    try {
      const [b, g, s] = await Promise.all([
        client.get("/budgets"),
        client.get("/goals"),
        client.get("/stats", { params: { from, to } }),
      ]);
      setBudgets(b.data);
      setGoals(g.data);
      setSpentByCategory(Object.fromEntries(s.data.categories.map((c) => [c.category, c.total])));
      setSpentByCategory((prev) => ({ ...prev, __total: s.data.totals.spent }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const spentFor = (category) => (category === "Overall" ? spentByCategory.__total || 0 : spentByCategory[category] || 0);

  const saveBudget = async (payload) => {
    try {
      if (editingBudget) await client.put(`/budgets/${editingBudget._id}`, { limit: payload.limit });
      else await client.post("/budgets", payload);
      setBudgetModal(false);
      setEditingBudget(null);
      await load();
      flash("Saved!");
    } catch (error) {
      flash(extractError(error));
    }
  };

  const removeBudget = async () => {
    try {
      await client.delete(`/budgets/${deleteBudget._id}`);
      setDeleteBudget(null);
      await load();
      flash("Deleted");
    } catch (error) {
      flash(extractError(error));
    }
  };

  const saveGoal = async (payload) => {
    try {
      if (editingGoal) await client.put(`/goals/${editingGoal._id}`, payload);
      else await client.post("/goals", payload);
      setGoalModal(false);
      setEditingGoal(null);
      await load();
      flash("Saved!");
    } catch (error) {
      flash(extractError(error));
    }
  };

  const removeGoal = async () => {
    try {
      await client.delete(`/goals/${deleteGoal._id}`);
      setDeleteGoal(null);
      await load();
      flash("Deleted");
    } catch (error) {
      flash(extractError(error));
    }
  };

  const overall = budgets.find((b) => b.category === "Overall");
  const perDay = useMemo(() => {
    if (!overall) return null;
    return Math.floor((overall.limit - spentFor("Overall")) / daysLeftInMonth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overall, spentByCategory]);

  const renderBudget = (b) => {
    const spent = spentFor(b.category);
    const pct = Math.round((spent / b.limit) * 100);
    const left = b.limit - spent;
    return (
      <div key={b._id} className="bg-base-200 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">
            {CATEGORY_EMOJI[b.category]} {b.category === "Overall" ? "Overall" : b.category}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setEditingBudget(b);
                setBudgetModal(true);
              }}
              className="btn btn-ghost btn-xs btn-circle"
            >
              ✏️
            </button>
            <button onClick={() => setDeleteBudget(b)} className="btn btn-ghost btn-xs btn-circle">
              🗑️
            </button>
          </div>
        </div>
        <div className="flex items-baseline justify-between mt-2">
          <p className="font-display font-extrabold text-lg">
            <Money v={spent} /> <span className="text-sm font-semibold text-base-content/50">of <Money v={b.limit} /></span>
          </p>
          <p className="text-sm font-bold">{pct}%</p>
        </div>
        <div className="mt-2">
          <ProgressBar value={spent} max={b.limit} tone={toneFor(pct)} height="h-2.5" />
        </div>
        <p className={`text-xs font-semibold mt-2 ${left < 0 ? "text-error" : "text-base-content/60"}`}>
          {left < 0 ? (
            <>
              Over budget by <Money v={-left} />
            </>
          ) : (
            <>
              <Money v={left} /> left this month
            </>
          )}
        </p>
      </div>
    );
  };

  const renderGoal = (g) => {
    const saved = g.totalSaved || 0;
    const remaining = Math.max(0, g.targetAmount - saved);
    const done = g.targetAmount > 0 && remaining === 0;
    let plan = null;
    if (g.targetAmount > 0 && g.targetDate && !done) {
      const days = diffDays(todayKey(), g.targetDate);
      if (days <= 0) plan = <>Target date has passed - <Money v={remaining} /> still to go</>;
      else {
        const perDayNeed = Math.ceil(remaining / days);
        const perMonthNeed = Math.ceil(remaining / Math.max(1, days / 30.4));
        plan = (
          <>
            Save <Money v={perDayNeed} />/day or <Money v={perMonthNeed} />/month to reach it in {days} day{days === 1 ? "" : "s"}
          </>
        );
      }
    }
    return (
      <div key={g._id} className="bg-base-200 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">
            {g.icon} {g.name}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setEditingGoal(g);
                setGoalModal(true);
              }}
              className="btn btn-ghost btn-xs btn-circle"
            >
              ✏️
            </button>
            <button onClick={() => setDeleteGoal(g)} className="btn btn-ghost btn-xs btn-circle">
              🗑️
            </button>
          </div>
        </div>
        {g.targetAmount > 0 ? (
          <>
            <div className="flex items-baseline justify-between mt-2">
              <p className="font-display font-extrabold text-lg">
                <Money v={saved} /> <span className="text-sm font-semibold text-base-content/50">of <Money v={g.targetAmount} /></span>
              </p>
              <p className="text-sm font-bold">{Math.min(100, Math.round((saved / g.targetAmount) * 100))}%</p>
            </div>
            <div className="mt-2">
              <ProgressBar value={saved} max={g.targetAmount} tone="primary" height="h-2.5" />
            </div>
            <p className="text-xs font-semibold text-base-content/60 mt-2">
              {done ? "🎉 Goal reached!" : plan || <><Money v={remaining} /> to go - add a date for a daily plan</>}
            </p>
            {g.targetDate && <p className="text-[11px] text-base-content/40 mt-1">Target date {formatShort(g.targetDate)}</p>}
          </>
        ) : (
          <p className="text-sm text-base-content/50 mt-2">
            <Money v={saved} /> saved. Edit this card and set a target to get a savings plan.
          </p>
        )}
      </div>
    );
  };

  return (
    <PageShell title="Planner">
      <div className="px-5 pb-3 flex gap-2">
        {[
          { key: "budgets", label: "💸 Budgets" },
          { key: "goals", label: "🎯 Savings goals" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-full text-sm font-semibold border transition-colors ${
              tab === t.key ? "bg-primary text-primary-content border-primary" : "bg-base-100 text-base-content/60 border-base-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : tab === "budgets" ? (
        <div className="px-5 pb-28 space-y-3">
          <p className="text-sm text-base-content/60">Monthly limits, tracked against this month's expenses.</p>
          {perDay !== null && (
            <div className="bg-accent/15 rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Safe to spend per day</p>
              <p className="font-display font-extrabold text-xl mt-1">
                {perDay >= 0 ? <Money v={perDay} /> : <span className="text-error">Budget exceeded</span>}
              </p>
              <p className="text-xs opacity-60 mt-0.5">for the {daysLeftInMonth()} days left this month</p>
            </div>
          )}
          {!budgets.length && (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="text-4xl mb-3">💸</span>
              <p className="text-base-content/50 font-medium">No budgets yet. Set a monthly limit to stay on track.</p>
            </div>
          )}
          {budgets.map(renderBudget)}
        </div>
      ) : (
        <div className="px-5 pb-28 space-y-3">
          <p className="text-sm text-base-content/60">Set a target amount and date on a savings card to get a plan.</p>
          {!goals.length && (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="text-4xl mb-3">🎯</span>
              <p className="text-base-content/50 font-medium">No savings cards yet. Create one to plan towards it.</p>
            </div>
          )}
          {goals.map(renderGoal)}
        </div>
      )}

      <Fab
        accent={tab === "budgets" ? "secondary" : "primary"}
        onClick={() => {
          if (tab === "budgets") {
            setEditingBudget(null);
            setBudgetModal(true);
          } else {
            setEditingGoal(null);
            setGoalModal(true);
          }
        }}
      />
      {toast}

      <BudgetModal
        open={budgetModal}
        initial={editingBudget}
        takenCategories={budgets.map((b) => b.category)}
        onClose={() => {
          setBudgetModal(false);
          setEditingBudget(null);
        }}
        onSave={saveBudget}
      />
      <GoalModal
        open={goalModal}
        initial={editingGoal}
        onClose={() => {
          setGoalModal(false);
          setEditingGoal(null);
        }}
        onSave={saveGoal}
      />
      <ConfirmDialog
        open={!!deleteBudget}
        title="Delete this budget?"
        message="Only the limit is removed - your expenses stay."
        onCancel={() => setDeleteBudget(null)}
        onConfirm={removeBudget}
      />
      <ConfirmDialog
        open={!!deleteGoal}
        title={`Delete "${deleteGoal?.name}"?`}
        message="This savings card and all its saving entries will be removed permanently."
        onCancel={() => setDeleteGoal(null)}
        onConfirm={removeGoal}
      />
    </PageShell>
  );
};

export default Planner;
