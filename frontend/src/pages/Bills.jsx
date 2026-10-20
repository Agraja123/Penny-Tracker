import { useEffect, useState, useCallback, useMemo } from "react";
import PageShell, { Fab, Spinner } from "../components/PageShell";
import BillModal from "../components/BillModal";
import ConfirmDialog from "../components/ConfirmDialog";
import Money from "../components/Money";
import { ProgressBar, StatTile } from "../components/Charts";
import { useToast } from "../hooks/useToast";
import client, { extractError } from "../api/client";
import { todayKey, diffDays, formatShort, monthBounds, monthKey } from "../utils/date";

const FREQ_LABEL = { once: "one time", weekly: "weekly", monthly: "monthly", yearly: "yearly" };

const dueInfo = (bill) => {
  const days = diffDays(todayKey(), bill.nextDueDate);
  if (days < 0) return { text: `Overdue by ${-days} day${days === -1 ? "" : "s"}`, cls: "bg-error/15 text-error" };
  if (days === 0) return { text: "Due today", cls: "bg-warning/25 text-base-content" };
  if (days <= (bill.remindDaysBefore ?? 2)) return { text: `Due in ${days} day${days === 1 ? "" : "s"}`, cls: "bg-warning/25 text-base-content" };
  return { text: `Due ${formatShort(bill.nextDueDate)}`, cls: "bg-base-300 text-base-content/70" };
};

// Third section of the app: regular bills and loans/EMIs.
// The summary at the top only shows numbers for this section.
const Bills = () => {
  const [tab, setTab] = useState("bill");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, flash] = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [payTarget, setPayTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get("/bills");
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changed = () => window.dispatchEvent(new Event("penny:data-changed"));

  const list = useMemo(() => items.filter((i) => i.kind === tab), [items, tab]);
  const active = list.filter((i) => i.isActive);
  const closed = list.filter((i) => !i.isActive);

  const summary = useMemo(() => {
    const monthEnd = monthBounds(monthKey()).to;
    const dueThisMonth = active.filter((i) => i.nextDueDate <= monthEnd);
    return {
      dueTotal: dueThisMonth.reduce((s, i) => s + i.amount, 0),
      dueCount: dueThisMonth.length,
      overdue: active.filter((i) => diffDays(todayKey(), i.nextDueDate) < 0).length,
      perMonth: active.filter((i) => i.frequency === "monthly").reduce((s, i) => s + i.amount, 0),
      remaining: active.reduce((s, i) => s + (i.remainingAmount || 0), 0),
      emiTotal: active.reduce((s, i) => s + i.amount, 0),
    };
  }, [active]);

  const handleSave = async (payload) => {
    try {
      if (editing) await client.put(`/bills/${editing._id}`, payload);
      else await client.post("/bills", payload);
      setModalOpen(false);
      setEditing(null);
      await load();
      changed();
      flash("Saved!");
    } catch (error) {
      flash(extractError(error));
    }
  };

  const handleDelete = async () => {
    try {
      await client.delete(`/bills/${deleteTarget._id}`);
      setDeleteTarget(null);
      await load();
      changed();
      flash("Deleted");
    } catch (error) {
      flash(extractError(error));
    }
  };

  const handlePay = async () => {
    try {
      await client.post(`/bills/${payTarget._id}/pay`, {});
      setPayTarget(null);
      await load();
      changed();
      flash("Marked as paid ✓");
    } catch (error) {
      flash(extractError(error));
    }
  };

  const isLoan = tab === "loan";

  const renderCard = (b) => {
    const due = dueInfo(b);
    const paidShare = b.totalAmount > 0 ? b.totalAmount - (b.remainingAmount || 0) : 0;
    const emisLeft = b.amount > 0 ? Math.ceil((b.remainingAmount || 0) / b.amount) : 0;
    return (
      <div key={b._id} className={`bg-base-200 rounded-2xl p-4 ${b.isActive ? "" : "opacity-60"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">
              {b.kind === "loan" ? "🏦" : "🧾"} {b.title}
            </p>
            <p className="text-xs text-base-content/50 mt-0.5">
              {b.kind === "loan" && b.lender ? `${b.lender} · ` : ""}
              {FREQ_LABEL[b.frequency]}
              {b.kind === "loan" && b.interestRate ? ` · ${b.interestRate}% p.a.` : ""}
            </p>
          </div>
          <p className="font-display font-extrabold text-lg shrink-0">
            <Money v={b.amount} />
          </p>
        </div>

        {b.kind === "loan" && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-base-content/60 mb-1">
              <span>
                <Money v={b.remainingAmount || 0} /> left
              </span>
              <span>{b.isActive ? `~${emisLeft} EMI${emisLeft === 1 ? "" : "s"} to go` : "Fully paid 🎉"}</span>
            </div>
            <ProgressBar value={paidShare} max={b.totalAmount} tone="primary" />
          </div>
        )}

        <div className="flex items-center justify-between mt-3 gap-2">
          {b.isActive ? (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${due.cls}`}>{due.text}</span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-base-300">Closed ✓</span>
          )}
          <div className="flex items-center gap-1">
            {b.isActive && (
              <button onClick={() => setPayTarget(b)} className="btn btn-primary btn-xs rounded-full">
                Mark paid
              </button>
            )}
            <button
              onClick={() => {
                setEditing(b);
                setModalOpen(true);
              }}
              className="btn btn-ghost btn-xs btn-circle"
            >
              ✏️
            </button>
            <button onClick={() => setDeleteTarget(b)} className="btn btn-ghost btn-xs btn-circle">
              🗑️
            </button>
          </div>
        </div>
        {b.lastPaidDate && <p className="text-[11px] text-base-content/40 mt-2">Last paid {formatShort(b.lastPaidDate)}</p>}
      </div>
    );
  };

  return (
    <PageShell title="Bills & Loans">
      <div className="px-5 pb-3 flex gap-2">
        {[
          { key: "bill", label: "🧾 Bills" },
          { key: "loan", label: "🏦 Loans & EMI" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-full text-sm font-semibold border transition-colors ${
              tab === t.key ? "bg-accent text-accent-content border-accent" : "bg-base-100 text-base-content/60 border-base-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="px-5 pb-28 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {isLoan ? (
              <>
                <StatTile label="Total still to pay" tone="accent">
                  <Money v={summary.remaining} />
                </StatTile>
                <StatTile label="EMIs per month">
                  <Money v={summary.emiTotal} />
                </StatTile>
              </>
            ) : (
              <>
                <StatTile label="Due this month" tone="accent">
                  <Money v={summary.dueTotal} />
                  <span className="text-xs font-semibold opacity-60 ml-1">({summary.dueCount})</span>
                </StatTile>
                <StatTile label="Monthly bills total">
                  <Money v={summary.perMonth} />
                </StatTile>
              </>
            )}
          </div>
          {summary.overdue > 0 && (
            <p className="text-sm font-semibold text-error">
              ⚠️ {summary.overdue} overdue {isLoan ? "EMI" : "bill"}
              {summary.overdue > 1 ? "s" : ""}
            </p>
          )}

          {!list.length && (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="text-4xl mb-3">{isLoan ? "🏦" : "🧾"}</span>
              <p className="text-base-content/50 font-medium">
                {isLoan ? "No loans yet. Add one to track its EMI." : "No bills yet. Add wifi, electricity, credit card…"}
              </p>
            </div>
          )}

          <div className="space-y-3">{active.map(renderCard)}</div>
          {closed.length > 0 && (
            <>
              <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wide pt-2">Closed</p>
              <div className="space-y-3">{closed.map(renderCard)}</div>
            </>
          )}
        </div>
      )}

      <Fab
        accent="accent"
        onClick={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      />
      {toast}

      <BillModal
        open={modalOpen}
        kind={editing?.kind || tab}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.title}"?`}
        message="It will be removed permanently. Payments already logged in Expenses stay."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={!!payTarget}
        title={`Mark "${payTarget?.title}" as paid?`}
        message={`₹${payTarget?.amount ?? 0} will be added to today's expenses under Bills${
          payTarget?.kind === "loan" ? ", and your remaining loan balance goes down" : ""
        }. The next due date moves forward automatically.`}
        confirmLabel="Mark paid"
        confirmClass="btn btn-primary flex-1"
        onCancel={() => setPayTarget(null)}
        onConfirm={handlePay}
      />
    </PageShell>
  );
};

export default Bills;
