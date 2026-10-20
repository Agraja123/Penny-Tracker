import { useState, useEffect } from "react";

const ICONS = ["🐷", "🎯", "✈️", "🏠", "🚲", "📱", "🎓", "💍", "🚗", "🩺"];

// Create/edit modal for a savings "card" - what the user is saving towards.
const GoalModal = ({ open, onClose, onSave, initial }) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🐷");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setIcon(initial?.icon || "🐷");
      setTargetAmount(initial?.targetAmount ? String(initial.targetAmount) : "");
      setTargetDate(initial?.targetDate || "");
      setError("");
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) {
      setError("Give this savings card a name");
      return;
    }
    onSave({
      name: name.trim(),
      icon,
      targetAmount: targetAmount ? parseInt(targetAmount, 10) : 0,
      targetDate: targetDate || "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-base-100 w-full md:w-96 md:rounded-2xl rounded-t-2xl p-6">
        <h3 className="font-display font-bold text-lg text-base-content">
          {initial ? "Edit savings card" : "New savings card"}
        </h3>
        <p className="text-sm text-base-content/60 mt-0.5">What are you saving for?</p>

        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button
                key={i}
                onClick={() => setIcon(i)}
                className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center border-2 ${
                  icon === i ? "border-primary bg-primary/10" : "border-base-300 bg-base-200"
                }`}
              >
                {i}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goa Trip"
              maxLength={40}
              autoFocus
              className="input input-bordered w-full mt-1 bg-base-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
              Target amount (optional)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 10000"
              className="input input-bordered w-full mt-1 bg-base-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
              Reach it by (optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
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

export default GoalModal;
