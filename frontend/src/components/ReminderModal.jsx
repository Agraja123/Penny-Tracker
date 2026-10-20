import { useState, useEffect } from "react";
import Sheet, { Field } from "./Sheet";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const KINDS = [
  { key: "saving", label: "🐷 Savings", title: "Log today's savings" },
  { key: "expense", label: "🧾 Expenses", title: "Note down today's expenses" },
  { key: "bill", label: "🏦 Bills", title: "Check my bills" },
  { key: "custom", label: "⏰ Custom", title: "" },
];

// Create or edit a reminder with its own time and repeat schedule.
const ReminderModal = ({ open, initial, onClose, onSave }) => {
  const [kind, setKind] = useState("saving");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("21:00");
  const [frequency, setFrequency] = useState("daily");
  const [weekdays, setWeekdays] = useState([1, 2, 3, 4, 5]);
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setKind(initial?.kind || "saving");
    setTitle(initial?.title || "Log today's savings");
    setTime(initial?.time || "21:00");
    setFrequency(initial?.frequency || "daily");
    setWeekdays(initial?.weekdays?.length ? initial.weekdays : [1, 2, 3, 4, 5]);
    setDayOfMonth(String(initial?.dayOfMonth || 1));
    setError("");
  }, [open, initial]);

  const pickKind = (k) => {
    const prevDefault = KINDS.find((x) => x.key === kind)?.title;
    setKind(k.key);
    if (!title.trim() || title === prevDefault) setTitle(k.title);
  };

  const toggleDay = (d) => setWeekdays((w) => (w.includes(d) ? w.filter((x) => x !== d) : [...w, d]));

  const handleSave = () => {
    if (!title.trim()) return setError("Give the reminder a title");
    if (!time) return setError("Pick a time");
    if (frequency === "weekly" && !weekdays.length) return setError("Pick at least one day");
    onSave({
      kind,
      title: title.trim(),
      time,
      frequency,
      weekdays: frequency === "weekly" ? weekdays : [],
      dayOfMonth: Math.min(31, Math.max(1, parseInt(dayOfMonth, 10) || 1)),
    });
  };

  return (
    <Sheet open={open} title={initial ? "Edit reminder" : "New reminder"} onClose={onClose} onSave={handleSave} accent="accent" error={error}>
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button key={k.key} onClick={() => pickKind(k)} className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${kind === k.key ? "bg-accent text-accent-content border-accent" : "bg-base-100 border-base-300 text-base-content/60"}`}>
            {k.label}
          </button>
        ))}
      </div>

      <Field label="Message">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className="input input-bordered w-full bg-base-200" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Time">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input input-bordered w-full bg-base-200" />
        </Field>
        <Field label="Repeats">
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="select select-bordered w-full bg-base-200">
            <option value="daily">Every day</option>
            <option value="weekly">Certain weekdays</option>
            <option value="monthly">Once a month</option>
          </select>
        </Field>
      </div>

      {frequency === "weekly" && (
        <div className="flex gap-1.5 flex-wrap">
          {DAYS.map((d, i) => (
            <button key={d} onClick={() => toggleDay(i)} className={`w-11 h-10 rounded-xl text-sm font-semibold border ${weekdays.includes(i) ? "bg-accent text-accent-content border-accent" : "bg-base-200 border-base-300 text-base-content/60"}`}>
              {d}
            </button>
          ))}
        </div>
      )}

      {frequency === "monthly" && (
        <Field label="Day of the month" hint="On shorter months it falls on the last day.">
          <input type="text" inputMode="numeric" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))} className="input input-bordered w-full bg-base-200" />
        </Field>
      )}
    </Sheet>
  );
};

export default ReminderModal;
