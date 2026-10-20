import { useState, useEffect } from "react";
import Sheet, { Field } from "./Sheet";
import RupeeInput from "./RupeeInput";
import { todayKey } from "../utils/date";

const SOURCES = ["Freelance", "Gift", "Interest", "Salary", "Other"];

// Extra income entry (the monthly salary itself is set in Settings).
const IncomeModal = ({ open, initial, onClose, onSave }) => {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("Other");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayKey());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount(initial?.amount ? String(initial.amount) : "");
    setSource(initial?.source || "Other");
    setNote(initial?.note || "");
    setDate(initial?.date || todayKey());
    setError("");
  }, [open, initial]);

  const handleSave = () => {
    const whole = parseInt(amount, 10);
    if (!whole) return setError("Enter an amount, whole rupees only");
    onSave({ amount: whole, source, note: note.trim(), date });
  };

  return (
    <Sheet open={open} title={initial ? "Edit income" : "Add income"} onClose={onClose} onSave={handleSave} error={error}>
      <RupeeInput value={amount} onChange={setAmount} autoFocus placeholder="5000" />
      <Field label="Source">
        <select value={source} onChange={(e) => setSource(e.target.value)} className="select select-bordered w-full bg-base-200">
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Note (optional)">
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="e.g. logo design" className="input input-bordered w-full bg-base-200" />
      </Field>
      <Field label="Date">
        <input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} className="input input-bordered w-full bg-base-200" />
      </Field>
    </Sheet>
  );
};

export default IncomeModal;
