import { CHART_COLORS } from "../utils/format";
import Money from "./Money";

const TONES = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  warning: "bg-warning",
  error: "bg-error",
};

export const ProgressBar = ({ value, max, tone = "primary", height = "h-2" }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`w-full ${height} bg-base-300 rounded-full overflow-hidden`}>
      <div className={`h-full rounded-full ${TONES[tone] || TONES.primary}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

// Donut chart built with a conic-gradient - no chart library needed.
export const Donut = ({ items, centerLabel }) => {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!total) return null;
  let acc = 0;
  const stops = items.map((item, idx) => {
    const start = (acc / total) * 100;
    acc += item.value;
    const end = (acc / total) * 100;
    return `${CHART_COLORS[idx % CHART_COLORS.length]} ${start}% ${end}%`;
  });
  return (
    <div className="relative w-40 h-40 mx-auto">
      <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${stops.join(",")})` }} />
      <div className="absolute inset-5 rounded-full bg-base-100 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-semibold text-base-content/50 uppercase">{centerLabel}</span>
        <span className="font-display font-extrabold text-lg">
          <Money v={total} />
        </span>
      </div>
    </div>
  );
};

const labelFor = (key, groupBy) => {
  if (groupBy === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short" });
  }
  return String(Number(key.slice(8, 10)));
};

// Vertical bars over time. `show` can be "saved", "spent" or "both".
export const BarSeries = ({ series, groupBy = "day", show = "both" }) => {
  if (!series.length) return null;
  const max = Math.max(1, ...series.map((s) => Math.max(show !== "spent" ? s.saved : 0, show !== "saved" ? s.spent : 0)));
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-end gap-2 h-36 min-w-full" style={{ width: Math.max(series.length * 34, 0) || undefined }}>
        {series.map((s) => (
          <div key={s.key} className="flex flex-col items-center justify-end h-full w-7 shrink-0">
            <div className="flex items-end gap-0.5 flex-1 w-full justify-center">
              {show !== "spent" && (
                <div className="w-2.5 bg-primary rounded-t" style={{ height: `${(s.saved / max) * 100}%`, minHeight: s.saved ? 3 : 0 }} />
              )}
              {show !== "saved" && (
                <div className="w-2.5 bg-secondary rounded-t" style={{ height: `${(s.spent / max) * 100}%`, minHeight: s.spent ? 3 : 0 }} />
              )}
            </div>
            <span className="text-[10px] text-base-content/50 mt-1">{labelFor(s.key, groupBy)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatTile = ({ label, children, tone = "base" }) => {
  const cls = {
    base: "bg-base-200",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/15",
  }[tone];
  return (
    <div className={`rounded-2xl p-4 ${cls}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-xl font-display font-extrabold mt-1">{children}</p>
    </div>
  );
};
