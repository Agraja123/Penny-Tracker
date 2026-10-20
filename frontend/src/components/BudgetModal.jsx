import { useState, useEffect } from "react";
import Sheet, { Field } from "./Sheet";
import RupeeInput from "./RupeeInput";
import { CATEGORY_EMOJI, EXPENSE_CATEGORIES } from "../utils/format";

// Monthly spending limit - for everything ("Overall") or for one category.
const BudgetModal = ({ open, initial, takenCategories = [], onClose, onSave }) => {
  const options = ["Overall", ...EXPENSE_CATEGORIES].filter(
    (c) => c === initial?.category || !takenCategories.includes(c)
  );
  const [category, setCategory] = useState("Overall");
  const [limit, setLimit] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCategory(initial?.category || options[0] || "Overall");
    setLimit(initial?.limit ? String(initial.limit) : "");
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const handleSave = () => {
    const whole = parseInt(limit, 10);
    if (!whole) return setError("Enter a monthly limit, whole rupees only");
    onSave({ category, limit: whole });
  };

  return (
    <Sheet open={open} title={initial ? "Edit budget" : "New monthly budget"} subtitle="How much do you want to spend at most each month?" onClose={onClose} onSave={handleSave} accent="secondary" error={error}>
      <Field label="Applies to">
        <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={!!initial} className="select select-bordered w-full bg-base-200">
          {options.map((c) => (
            <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c === "Overall" ? "Overall (all expenses)" : c}</option>
          ))}
        </select>
      </Field>
      <RupeeInput value={limit} onChange={setLimit} autoFocus placeholder="3000" />
    </Sheet>
  );
};

export default BudgetModal;
