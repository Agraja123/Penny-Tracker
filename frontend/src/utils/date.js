// Date helpers shared across the app.
// Dates are stored/compared as "YYYY-MM-DD" strings so backend filtering stays simple.

export const toDateKey = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const todayKey = () => toDateKey(new Date());

export const formatPretty = (dateKey) => {
  const date = new Date(dateKey + "T00:00:00");
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatShort = (dateKey) => {
  const date = new Date(dateKey + "T00:00:00");
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export const formatHeaderDate = (date = new Date()) => ({
  day: date.toLocaleDateString(undefined, { weekday: "long" }),
  date: date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }),
});

// Returns { from, to } date-key bounds (inclusive) for a given filter,
// anchored on "today".
export const rangeForFilter = (filter) => {
  const today = new Date();
  const to = toDateKey(today);

  if (filter === "daily") {
    return { from: to, to };
  }

  if (filter === "weekly") {
    const start = new Date(today);
    const dow = (start.getDay() + 6) % 7; // make Monday = 0
    start.setDate(start.getDate() - dow);
    return { from: toDateKey(start), to };
  }

  if (filter === "monthly") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toDateKey(start), to };
  }

  if (filter === "yearly") {
    const start = new Date(today.getFullYear(), 0, 1);
    return { from: toDateKey(start), to };
  }

  return { from: undefined, to: undefined };
};

// Groups a list of entries (each with a `date` field) into
// { dateKey: [entries] } sorted with most recent date first.
export const groupByDate = (items) => {
  const groups = {};
  for (const item of items) {
    if (!groups[item.date]) groups[item.date] = [];
    groups[item.date].push(item);
  }
  return Object.entries(groups).sort((a, b) => (a[0] < b[0] ? 1 : -1));
};

// ---- helpers added for bills, budgets, planner and overview ----

export const monthKey = (d = new Date()) => toDateKey(d).slice(0, 7);

// First and last date key of a "YYYY-MM" month.
export const monthBounds = (month) => {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
};

export const shiftMonth = (month, delta) => {
  const [y, m] = month.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
};

export const formatMonth = (month) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

// Whole days from dateA to dateB (both YYYY-MM-DD). Positive when B is later.
export const diffDays = (dateA, dateB) => {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.round((b - a) / 86400000);
};

export const daysLeftInMonth = () => {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return last - now.getDate() + 1; // including today
};
