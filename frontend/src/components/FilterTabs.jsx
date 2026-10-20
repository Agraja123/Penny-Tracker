const FILTERS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "all", label: "All" },
];

// Daily / weekly / monthly / yearly filter, used identically on the
// Savings and Expenses pages. `accent` is "primary" (savings/green) or
// "secondary" (expenses/coral) - classes are written literally below so
// Tailwind's build-time scan can see them.
const FilterTabs = ({ value, onChange, accent = "primary" }) => {
  const activeClass =
    accent === "secondary"
      ? "bg-secondary text-secondary-content border-secondary"
      : "bg-primary text-primary-content border-primary";

  return (
    <div className="flex gap-1.5 overflow-x-auto px-5 pb-3" style={{ scrollbarWidth: "none" }}>
      {FILTERS.map((f) => {
        const active = value === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`pill-tab shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              active ? activeClass : "bg-base-100 text-base-content/60 border-base-300"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
};

export default FilterTabs;
