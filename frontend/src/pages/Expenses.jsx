import Money from "../components/Money";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DateBar from "../components/DateBar";
import FilterTabs from "../components/FilterTabs";
import DateGroupList from "../components/DateGroupList";
import ExpenseModal from "../components/ExpenseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import client, { extractError } from "../api/client";
import { rangeForFilter, groupByDate, monthBounds, monthKey } from "../utils/date";
import { ProgressBar } from "../components/Charts";
import { CATEGORY_EMOJI, EXPENSE_CATEGORIES } from "../utils/format";

const Expenses = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const { from, to } = rangeForFilter(filter);
    const params = {};
    if (category) params.category = category;
    if (from) params.from = from;
    if (to) params.to = to;
    try {
      const { data } = await client.get("/expenses", { params });
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, [filter, category]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // This month's overall budget (if one is set) so overspending is visible while logging
  const loadBudget = useCallback(async () => {
    try {
      const { from, to } = monthBounds(monthKey());
      const [b, s] = await Promise.all([client.get("/budgets"), client.get("/stats", { params: { from, to } })]);
      const overall = b.data.find((x) => x.category === "Overall");
      setBudget(overall ? { limit: overall.limit, spent: s.data.totals.spent } : null);
    } catch {
      setBudget(null);
    }
  }, []);

  useEffect(() => {
    loadBudget();
  }, [loadBudget, entries]);

  const groups = useMemo(() => {
    return groupByDate(entries).map(([date, items]) => [
      date,
      items,
      items.reduce((s, e) => s + e.amount, 0),
    ]);
  }, [entries]);

  const flashToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const handleSave = async (payload) => {
    try {
      if (editingEntry) {
        await client.put(`/expenses/${editingEntry._id}`, payload);
      } else {
        await client.post("/expenses", payload);
      }
      setModalOpen(false);
      setEditingEntry(null);
      await loadEntries();
      flashToast("Saved!");
    } catch (error) {
      flashToast(extractError(error));
    }
  };

  const handleDelete = async () => {
    try {
      await client.delete(`/expenses/${confirmTarget._id}`);
      setConfirmTarget(null);
      await loadEntries();
      flashToast("Deleted");
    } catch (error) {
      flashToast(extractError(error));
    }
  };

  return (
    <div className="app-shell-backdrop min-h-screen flex justify-center">
      <div className="app-shell-frame w-full bg-base-100 min-h-screen flex flex-col relative">
        <DateBar
          title="Expenses"
          right={
            <div className="flex items-center gap-1">
              <button onClick={() => navigate("/stats/expenses")} className="btn btn-ghost btn-sm btn-circle" title="Expense stats">
                📊
              </button>
              <button onClick={() => navigate("/home")} className="btn btn-ghost btn-sm btn-circle">
                ✕
              </button>
            </div>
          }
        />

        {budget && (
          <button onClick={() => navigate("/planner")} className="mx-5 mb-3 text-left bg-base-200 rounded-2xl p-3">
            <div className="flex justify-between text-xs font-semibold text-base-content/60 mb-1.5">
              <span>Monthly budget</span>
              <span className={budget.spent > budget.limit ? "text-error" : ""}>
                <Money v={budget.spent} /> / <Money v={budget.limit} />
              </span>
            </div>
            <ProgressBar
              value={budget.spent}
              max={budget.limit}
              tone={budget.spent > budget.limit ? "error" : budget.spent / budget.limit >= 0.8 ? "warning" : "secondary"}
            />
          </button>
        )}

        <FilterTabs value={filter} onChange={setFilter} accent="secondary" />

        <div className="flex gap-1.5 overflow-x-auto px-5 pb-3" style={{ scrollbarWidth: "none" }}>
          {["", ...EXPENSE_CATEGORIES].map((c) => (
            <button
              key={c || "all"}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${
                category === c ? "bg-secondary/15 border-secondary text-secondary" : "bg-base-100 border-base-300 text-base-content/60"
              }`}
            >
              {c ? `${CATEGORY_EMOJI[c]} ${c}` : "All categories"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-md text-secondary" />
          </div>
        ) : (
          <DateGroupList
            groups={groups}
            onDateClick={(date) => navigate(`/day/${date}`)}
            emptyMessage="No expenses logged for this period yet"
            renderItem={(entry) => (
              <div key={entry._id} className="flex items-center justify-between bg-base-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">{CATEGORY_EMOJI[entry.category] || "💸"}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-base-content truncate">{entry.note}</p>
                    {entry.subcategory && (
                      <p className="text-xs text-base-content/50 truncate">
                        {entry.category} · {entry.subcategory}
                      </p>
                    )}
                    <p className="font-display font-bold text-secondary"><Money v={entry.amount} /></p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingEntry(entry);
                      setModalOpen(true);
                    }}
                    className="btn btn-ghost btn-xs btn-circle"
                  >
                    ✏️
                  </button>
                  <button onClick={() => setConfirmTarget(entry)} className="btn btn-ghost btn-xs btn-circle">
                    🗑️
                  </button>
                </div>
              </div>
            )}
          />
        )}

        <button
          onClick={() => {
            setEditingEntry(null);
            setModalOpen(true);
          }}
          className="btn btn-secondary btn-circle fixed bottom-8 right-8 md:right-[calc(50%-232px)] shadow-xl shadow-secondary/30 h-16 w-16 text-3xl"
        >
          ＋
        </button>

        {toast && (
          <div className="toast toast-bottom toast-center z-[60]">
            <div className="alert bg-neutral text-neutral-content">
              <span>{toast}</span>
            </div>
          </div>
        )}

        <ExpenseModal
          open={modalOpen}
          initial={editingEntry}
          onClose={() => {
            setModalOpen(false);
            setEditingEntry(null);
          }}
          onSave={handleSave}
        />
        <ConfirmDialog
          open={!!confirmTarget}
          title="Delete this expense?"
          message="This expense entry will be removed permanently."
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
};

export default Expenses;
