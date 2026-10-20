import { useEffect, useState, useCallback, useMemo } from "react";
import IncomeModal from "./IncomeModal";
import ConfirmDialog from "./ConfirmDialog";
import FilterTabs from "./FilterTabs";
import Money from "./Money";
import { useToast } from "../hooks/useToast";
import client, { extractError } from "../api/client";
import { rangeForFilter, formatShort } from "../utils/date";

// Extra income entries (freelance, gifts, interest...) with full add / edit / delete.
const IncomeManager = () => {
  const [filter, setFilter] = useState("monthly");
  const [entries, setEntries] = useState([]);
  const [toast, flash] = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    const { from, to } = rangeForFilter(filter);
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await client.get("/income", { params });
    setEntries(data);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const total = useMemo(() => entries.reduce((s, e) => s + e.amount, 0), [entries]);

  const save = async (payload) => {
    try {
      if (editing) await client.put(`/income/${editing._id}`, payload);
      else await client.post("/income", payload);
      setModalOpen(false);
      setEditing(null);
      await load();
      flash("Saved!");
    } catch (error) {
      flash(extractError(error));
    }
  };

  const remove = async () => {
    try {
      await client.delete(`/income/${deleteTarget._id}`);
      setDeleteTarget(null);
      await load();
      flash("Deleted");
    } catch (error) {
      flash(extractError(error));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-semibold">Other income</p>
          <p className="text-xs text-base-content/50">
            In this period: <Money v={total} />
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="btn btn-primary btn-sm rounded-full"
        >
          ＋ Add
        </button>
      </div>

      <div className="-mx-5">
        <FilterTabs value={filter} onChange={setFilter} accent="primary" />
      </div>

      <div className="space-y-2">
        {!entries.length && <p className="text-sm text-base-content/50 py-3 text-center">No extra income logged for this period</p>}
        {entries.map((e) => (
          <div key={e._id} className="flex items-center justify-between bg-base-200 rounded-2xl px-4 py-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">{e.note || e.source}</p>
              <p className="text-xs text-base-content/50">
                {e.source} · {formatShort(e.date)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <p className="font-display font-bold text-primary mr-1">
                +<Money v={e.amount} />
              </p>
              <button
                onClick={() => {
                  setEditing(e);
                  setModalOpen(true);
                }}
                className="btn btn-ghost btn-xs btn-circle"
              >
                ✏️
              </button>
              <button onClick={() => setDeleteTarget(e)} className="btn btn-ghost btn-xs btn-circle">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast}
      <IncomeModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={save}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this income entry?"
        message="It will be removed permanently."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </div>
  );
};

export default IncomeManager;
