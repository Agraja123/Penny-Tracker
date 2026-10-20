// Small shared helpers for the controllers.

// Whole rupees only - returns 0 when the value is not a usable whole amount.
export const wholeAmount = (value) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : 0;
};

export const isDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

const pad = (n) => String(n).padStart(2, "0");
const daysInMonth = (y, m) => new Date(y, m, 0).getDate(); // m is 1-12

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Moves a YYYY-MM-DD date forward by one billing period.
// `anchorDay` keeps a "31st" bill on the last day of shorter months
// instead of drifting to the 28th forever.
export const addPeriod = (dateKey, frequency, anchorDay) => {
  let [y, m, d] = dateKey.split("-").map(Number);
  if (frequency === "weekly") {
    const next = new Date(y, m - 1, d + 7);
    return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
  }
  const day = anchorDay || d;
  if (frequency === "yearly") {
    y += 1;
  } else {
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return `${y}-${pad(m)}-${pad(Math.min(day, daysInMonth(y, m)))}`;
};

// First and last date key of a "YYYY-MM" month.
export const monthBounds = (month) => {
  const [y, m] = month.split("-").map(Number);
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(daysInMonth(y, m))}` };
};

export const currentMonth = () => todayKey().slice(0, 7);

// Copies only the allowed keys from a request body.
export const pick = (body, keys) => {
  const out = {};
  for (const k of keys) if (body[k] !== undefined) out[k] = body[k];
  return out;
};
