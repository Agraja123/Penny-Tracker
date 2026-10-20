import { useState, useEffect } from "react";
import RupeeInput from "./RupeeInput";
import { todayKey } from "../utils/date";

// Add/edit modal for a single saving entry against a specific goal card.
const SavingEntryModal = ({ open, onClose, onSave, initial, goalName }) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayKey());
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(initial?.amount ? String(initial.amount) : "");
      setDate(initial?.date || todayKey());
      setError("");
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSave = () => {
    const whole = parseInt(amount, 10);
    if (!whole || whole < 1) {
      setError("Enter an amount, whole rupees only (e.g. 20)");
      return;
    }
    onSave({ amount: whole, date });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-base-100 w-full md:w-96 md:rounded-2xl rounded-t-2xl p-6">
        <h3 className="font-display font-bold text-lg text-base-content">
          {initial ? "Edit saving" : "Add saving"}
        </h3>
        {goalName && <p className="text-sm text-base-content/60 mt-0.5">for {goalName}</p>}

        <div className="mt-5 space-y-4">
          <RupeeInput value={amount} onChange={setAmount} autoFocus placeholder="20" />

          <div>
            <label className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={date}
              max={todayKey()}
              onChange={(e) => setDate(e.target.value)}
              className="input input-bordered w-full mt-1 bg-base-200"
            />
          </div>

          {error && <p className="text-error text-sm font-medium">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary flex-1">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavingEntryModal;
