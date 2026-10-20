import { useState, useEffect } from "react";
import RupeeInput from "./RupeeInput";
import { todayKey } from "../utils/date";
import { EXPENSE_CATEGORIES as CATEGORIES, SUBCATEGORIES, CATEGORY_EMOJI } from "../utils/format";


// Add/edit modal for an expense - amount plus a required note
// (e.g. 20 rupees, note: "rickshaw").
const ExpenseModal = ({ open, onClose, onSave, initial }) => {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("Other");
  const [subcategory, setSubcategory] = useState("");
  const [date, setDate] = useState(todayKey());
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(initial?.amount ? String(initial.amount) : "");
      setNote(initial?.note || "");
      setCategory(initial?.category || "Other");
      setSubcategory(initial?.subcategory || "");
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
    if (!note.trim()) {
      setError("Add a short note for what this was spent on");
      return;
    }
    onSave({ amount: whole, note: note.trim(), category, subcategory: SUBCATEGORIES[category] ? subcategory : "", date });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-base-100 w-full md:w-96 md:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-display font-bold text-lg text-base-content">
          {initial ? "Edit expense" : "Add expense"}
        </h3>

        <div className="mt-5 space-y-4">
          <RupeeInput value={amount} onChange={setAmount} autoFocus placeholder="20" />

          <div>
            <label className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
              Note - what was it for?
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. rickshaw"
              maxLength={200}
              className="input input-bordered w-full mt-1 bg-base-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory("");
              }}
              className="select select-bordered w-full mt-1 bg-base-200"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
              ))}
            </select>
          </div>

          {SUBCATEGORIES[category] && (
            <div>
              <label className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Sub-category</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SUBCATEGORIES[category].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubcategory(subcategory === s ? "" : s)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
                      subcategory === s
                        ? "bg-secondary/15 border-secondary text-secondary"
                        : "bg-base-100 border-base-300 text-base-content/60"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

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
          <button onClick={handleSave} className="btn btn-secondary flex-1">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
