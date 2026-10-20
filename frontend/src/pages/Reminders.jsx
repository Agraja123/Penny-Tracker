import { useEffect, useState, useCallback } from "react";
import PageShell, { Fab, Spinner } from "../components/PageShell";
import ReminderModal from "../components/ReminderModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { notify } from "../components/ReminderEngine";
import { useToast } from "../hooks/useToast";
import client, { extractError } from "../api/client";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const KIND_ICON = { saving: "🐷", expense: "🧾", bill: "🏦", custom: "⏰" };

const scheduleText = (r) => {
  if (r.frequency === "daily") return "Every day";
  if (r.frequency === "weekly") return r.weekdays.map((d) => DAY_NAMES[d]).join(", ");
  return `Monthly on day ${r.dayOfMonth}`;
};

const to12h = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const Reminders = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, flash] = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [permission, setPermission] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get("/reminders");
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changed = () => window.dispatchEvent(new Event("penny:data-changed"));

  const save = async (payload) => {
    try {
      if (editing) await client.put(`/reminders/${editing._id}`, payload);
      else await client.post("/reminders", payload);
      setModalOpen(false);
      setEditing(null);
      await load();
      changed();
      flash("Saved!");
    } catch (error) {
      flash(extractError(error));
    }
  };

  const toggle = async (r) => {
    try {
      await client.put(`/reminders/${r._id}`, { enabled: !r.enabled });
      await load();
      changed();
    } catch (error) {
      flash(extractError(error));
    }
  };

  const remove = async () => {
    try {
      await client.delete(`/reminders/${deleteTarget._id}`);
      setDeleteTarget(null);
      await load();
      changed();
      flash("Deleted");
    } catch (error) {
      flash(extractError(error));
    }
  };

  const enableNotifications = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      await notify("Notifications are on 🎉", "Penny Tracker will remind you here.");
    }
  };

  return (
    <PageShell title="Reminders">
      <div className="px-5 pb-28 space-y-3">
        {permission !== "granted" && (
          <div className="bg-accent/15 rounded-2xl p-4">
            <p className="font-semibold text-sm">Get reminders as notifications</p>
            <p className="text-xs text-base-content/60 mt-1">
              {permission === "unsupported"
                ? "This browser can't show notifications. Reminders still appear inside the app."
                : permission === "denied"
                ? "Notifications are blocked for this site. Allow them in your browser's site settings."
                : "Allow notifications so reminders show up even when Penny Tracker is in the background."}
            </p>
            {permission === "default" && (
              <button onClick={enableNotifications} className="btn btn-accent btn-sm mt-3">
                Turn on notifications
              </button>
            )}
          </div>
        )}
        {permission === "granted" && (
          <button onClick={() => notify("Test reminder ⏰", "This is how your reminders will look.")} className="btn btn-ghost btn-xs">
            Send a test notification
          </button>
        )}

        {loading ? (
          <Spinner />
        ) : !items.length ? (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="text-4xl mb-3">⏰</span>
            <p className="text-base-content/50 font-medium">No reminders yet. Add one to remember to log your savings and expenses.</p>
          </div>
        ) : (
          items.map((r) => (
            <div key={r._id} className={`bg-base-200 rounded-2xl p-4 flex items-center gap-3 ${r.enabled ? "" : "opacity-55"}`}>
              <span className="text-2xl">{KIND_ICON[r.kind]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{r.title}</p>
                <p className="text-xs text-base-content/60 mt-0.5">
                  {to12h(r.time)} · {scheduleText(r)}
                </p>
              </div>
              <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={r.enabled} onChange={() => toggle(r)} />
              <div className="flex">
                <button
                  onClick={() => {
                    setEditing(r);
                    setModalOpen(true);
                  }}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  ✏️
                </button>
                <button onClick={() => setDeleteTarget(r)} className="btn btn-ghost btn-xs btn-circle">
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
        <p className="text-xs text-base-content/40 pt-2">
          Bills and EMIs also remind you automatically, a few days before they're due (set per bill).
        </p>
      </div>

      <Fab
        accent="accent"
        onClick={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      />
      {toast}
      <ReminderModal
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
        title="Delete this reminder?"
        message="It will stop reminding you."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </PageShell>
  );
};

export default Reminders;
