import Money from "../components/Money";
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import { formatPretty } from "../utils/date";
import { CATEGORY_EMOJI } from "../utils/format";

// Combined view for one specific date - shows savings and expenses
// side by side so the user can see everything that happened that day.
const DayDetail = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const [savings, setSavings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [goalsRes, savingsRes, expensesRes] = await Promise.all([
          client.get("/goals"),
          client.get("/saving-entries", { params: { from: date, to: date } }),
          client.get("/expenses", { params: { from: date, to: date } }),
        ]);
        setGoals(goalsRes.data);
        setSavings(savingsRes.data);
        setExpenses(expensesRes.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date]);

  const goalsById = useMemo(() => Object.fromEntries(goals.map((g) => [g._id, g])), [goals]);
  const totalSaved = savings.reduce((s, e) => s + e.amount, 0);
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="app-shell-backdrop min-h-screen flex justify-center">
      <div className="app-shell-frame w-full bg-base-100 min-h-screen flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h1 className="font-display font-bold text-xl">Day summary</h1>
            <p className="text-sm text-base-content/60 font-medium mt-0.5">{formatPretty(date)}</p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm btn-circle">
            ✕
          </button>
        </div>

        <div className="px-5 grid grid-cols-2 gap-3 mb-6">
          <div className="bg-primary/10 rounded-2xl p-4">
            <p className="text-xs font-semibold text-primary/80 uppercase tracking-wide">Saved</p>
            <p className="text-2xl font-display font-extrabold text-primary mt-1"><Money v={totalSaved} /></p>
          </div>
          <div className="bg-secondary/10 rounded-2xl p-4">
            <p className="text-xs font-semibold text-secondary/80 uppercase tracking-wide">Spent</p>
            <p className="text-2xl font-display font-extrabold text-secondary mt-1"><Money v={totalSpent} /></p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : (
          <div className="px-5 space-y-6 pb-10">
            <div>
              <p className="text-sm font-bold text-base-content/70 mb-2">🐷 Savings</p>
              {savings.length === 0 ? (
                <p className="text-sm text-base-content/40 py-3">Nothing saved this day</p>
              ) : (
                <div className="space-y-2">
                  {savings.map((entry) => (
                    <div key={entry._id} className="flex items-center justify-between bg-base-200 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{goalsById[entry.goalId]?.icon || "🐷"}</span>
                        <p className="font-semibold">{goalsById[entry.goalId]?.name || "Savings"}</p>
                      </div>
                      <p className="font-display font-bold text-primary"><Money v={entry.amount} /></p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-base-content/70 mb-2">🧾 Expenses</p>
              {expenses.length === 0 ? (
                <p className="text-sm text-base-content/40 py-3">Nothing spent this day</p>
              ) : (
                <div className="space-y-2">
                  {expenses.map((entry) => (
                    <div key={entry._id} className="flex items-center justify-between bg-base-200 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{CATEGORY_EMOJI[entry.category] || "💸"}</span>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{entry.note}</p>
                          {entry.subcategory && (
                            <p className="text-xs text-base-content/50 truncate">
                              {entry.category} · {entry.subcategory}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="font-display font-bold text-secondary shrink-0"><Money v={entry.amount} /></p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayDetail;
