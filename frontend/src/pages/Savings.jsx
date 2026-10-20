import Money from "../components/Money";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DateBar from "../components/DateBar";
import FilterTabs from "../components/FilterTabs";
import DateGroupList from "../components/DateGroupList";
import SavingEntryModal from "../components/SavingEntryModal";
import GoalModal from "../components/GoalModal";
import ConfirmDialog from "../components/ConfirmDialog";
import client, { extractError } from "../api/client";
import { rangeForFilter, groupByDate } from "../utils/date";

const Savings = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState("weekly");
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const loadGoals = useCallback(async () => {
    const { data } = await client.get("/goals");
    setGoals(data);
    return data;
  }, []);

  const loadEntries = useCallback(async () => {
    const { from, to } = rangeForFilter(filter);
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (activeGoalId) params.goalId = activeGoalId;
    const { data } = await client.get("/saving-entries", { params });
    setEntries(data);
  }, [filter, activeGoalId]);

  useEffect(() => {
    setLoading(true);
    loadGoals().finally(() => setLoading(false));
  }, [loadGoals]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const goalsById = useMemo(() => Object.fromEntries(goals.map((g) => [g._id, g])), [goals]);

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

  const handleSaveEntry = async ({ amount, date, goalId }) => {
    try {
      if (editingEntry) {
        await client.put(`/saving-entries/${editingEntry._id}`, { amount, date });
      } else {
        await client.post("/saving-entries", { amount, date, goalId: goalId || activeGoalId || goals[0]?._id });
      }
      setEntryModalOpen(false);
      setEditingEntry(null);
      await loadEntries();
      await loadGoals();
      flashToast("Saved!");
    } catch (error) {
      flashToast(extractError(error));
    }
  };

  const handleDelete = async () => {
    try {
      await client.delete(`/saving-entries/${confirmTarget._id}`);
      setConfirmTarget(null);
      await loadEntries();
      await loadGoals();
      flashToast("Deleted");
    } catch (error) {
      flashToast(extractError(error));
    }
  };

  const handleSaveGoal = async (payload) => {
    try {
      if (editingGoal) {
        await client.put(`/goals/${editingGoal._id}`, payload);
      } else {
        await client.post("/goals", payload);
      }
      setGoalModalOpen(false);
      setEditingGoal(null);
      await loadGoals();
      flashToast(editingGoal ? "Card updated" : "Card created");
    } catch (error) {
      flashToast(extractError(error));
    }
  };

  const handleDeleteGoal = async () => {
    try {
      await client.delete(`/goals/${goalToDelete._id}`);
      if (activeGoalId === goalToDelete._id) setActiveGoalId(null);
      setGoalToDelete(null);
      await loadGoals();
      await loadEntries();
      flashToast("Card deleted");
    } catch (error) {
      flashToast(extractError(error));
    }
  };

  const openAddEntry = () => {
    if (!goals.length) {
      setEditingGoal(null);
      setGoalModalOpen(true);
      return;
    }
    setEditingEntry(null);
    setEntryModalOpen(true);
  };

  return (
    <div className="app-shell-backdrop min-h-screen flex justify-center">
      <div className="app-shell-frame w-full bg-base-100 min-h-screen flex flex-col relative">
        <DateBar
          title="Savings"
          right={
            <div className="flex items-center gap-1">
              <button onClick={() => navigate("/stats/savings")} className="btn btn-ghost btn-sm btn-circle" title="Savings stats">
                📊
              </button>
              <button onClick={() => navigate("/home")} className="btn btn-ghost btn-sm btn-circle">
                ✕
              </button>
            </div>
          }
        />

        {/* Savings cards strip */}
        <div className="px-5 pb-3 flex gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveGoalId(null)}
            className={`shrink-0 rounded-2xl px-4 py-3 border-2 text-left min-w-[110px] ${
              activeGoalId === null ? "border-primary bg-primary/10" : "border-base-300 bg-base-200"
            }`}
          >
            <p className="text-xs font-semibold text-base-content/50">All cards</p>
            <p className="font-display font-bold text-lg mt-1">🐷</p>
          </button>
          {goals.map((g) => (
            <div
              key={g._id}
              className={`shrink-0 rounded-2xl border-2 min-w-[130px] ${
                activeGoalId === g._id ? "border-primary bg-primary/10" : "border-base-300 bg-base-200"
              }`}
            >
              <button onClick={() => setActiveGoalId(g._id)} className="w-full text-left px-4 pt-3 pb-1">
                <p className="text-xs font-semibold text-base-content/50 truncate max-w-[100px]">{g.name}</p>
                <p className="font-display font-bold text-lg mt-1">
                  {g.icon} <Money v={g.totalSaved || 0} />
                </p>
                {g.targetAmount > 0 && (
                  <div className="w-full h-1.5 bg-base-300 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, ((g.totalSaved || 0) / g.targetAmount) * 100)}%` }}
                    />
                  </div>
                )}
              </button>
              <div className="flex justify-end gap-0.5 px-2 pb-1.5">
                <button
                  onClick={() => {
                    setEditingGoal(g);
                    setGoalModalOpen(true);
                  }}
                  className="btn btn-ghost btn-xs btn-circle"
                  title="Edit card"
                >
                  ✏️
                </button>
                <button onClick={() => setGoalToDelete(g)} className="btn btn-ghost btn-xs btn-circle" title="Delete card">
                  🗑️
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              setEditingGoal(null);
              setGoalModalOpen(true);
            }}
            className="shrink-0 rounded-2xl px-4 py-3 border-2 border-dashed border-base-300 min-w-[80px] flex flex-col items-center justify-center text-base-content/40"
          >
            <span className="text-xl">＋</span>
            <span className="text-xs font-semibold mt-1">New card</span>
          </button>
        </div>

        <FilterTabs value={filter} onChange={setFilter} accent="primary" />

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : (
          <DateGroupList
            groups={groups}
            onDateClick={(date) => navigate(`/day/${date}`)}
            emptyMessage={goals.length ? "No savings logged for this period yet" : "Create a savings card to get started"}
            renderItem={(entry) => {
              const goal = goalsById[entry.goalId];
              return (
                <div key={entry._id} className="flex items-center justify-between bg-base-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{goal?.icon || "🐷"}</span>
                    <div>
                      <p className="font-semibold text-base-content">{goal?.name || "Savings"}</p>
                      <p className="font-display font-bold text-primary"><Money v={entry.amount} /></p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingEntry(entry);
                        setEntryModalOpen(true);
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
              );
            }}
          />
        )}

        <button
          onClick={openAddEntry}
          className="btn btn-primary btn-circle fixed bottom-8 right-8 md:right-[calc(50%-232px)] shadow-xl shadow-primary/30 h-16 w-16 text-3xl"
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

        <SavingEntryModal
          open={entryModalOpen}
          initial={editingEntry}
          goalName={goalsById[editingEntry?.goalId || activeGoalId]?.name}
          onClose={() => {
            setEntryModalOpen(false);
            setEditingEntry(null);
          }}
          onSave={handleSaveEntry}
        />
        <GoalModal
          open={goalModalOpen}
          initial={editingGoal}
          onClose={() => {
            setGoalModalOpen(false);
            setEditingGoal(null);
          }}
          onSave={handleSaveGoal}
        />
        <ConfirmDialog
          open={!!goalToDelete}
          title={`Delete "${goalToDelete?.name}"?`}
          message="This savings card and every saving logged on it will be removed permanently."
          onCancel={() => setGoalToDelete(null)}
          onConfirm={handleDeleteGoal}
        />
        <ConfirmDialog
          open={!!confirmTarget}
          title="Delete this entry?"
          message="This saving entry will be removed permanently."
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
};

export default Savings;
