// Amount input that only ever accepts whole rupees - no decimals.
// Typing "20.55" is impossible here; only digits 0-9 pass through.
const RupeeInput = ({ value, onChange, autoFocus, placeholder = "0" }) => {
  const handleChange = (e) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
    onChange(digitsOnly);
  };

  return (
    <label className="flex items-center gap-2 bg-base-200 rounded-2xl px-4 py-3 border border-base-300 focus-within:border-primary transition-colors">
      <span className="text-2xl font-display font-bold text-base-content/50">₹</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoFocus={autoFocus}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="bg-transparent outline-none text-2xl font-display font-bold w-full text-base-content placeholder:text-base-content/30"
      />
    </label>
  );
};

export default RupeeInput;
