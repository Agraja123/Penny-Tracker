export const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Health",
  "Shopping",
  "Makeup & Skincare",
  "Gifts",
  "Festive",
  "Entertainment",
  "Bills",
  "Other",
];

// Sub-categories (only some categories have them)
export const SUBCATEGORIES = {
  Food: ["Meal", "Snacks"],
  Transport: ["Public transport", "Private transport"],
  Health: ["Checkups", "Medicines"],
  Shopping: ["Clothes", "Footwear", "Perfumes", "Bags"],
  Entertainment: ["Movie", "Game zone"],
};

export const CATEGORY_EMOJI = {
  Overall: "📊",
  Food: "🍔",
  Transport: "🛺",
  Health: "💊",
  Shopping: "🛍️",
  "Makeup & Skincare": "💄",
  Gifts: "🎁",
  Festive: "🪔",
  Entertainment: "🎬",
  Bills: "🧾",
  Other: "💸",
};

// Chart colours (kept literal so they work in every theme)
export const CHART_COLORS = [
  "#E8604C", "#0E7C66", "#F0A93B", "#2F8FBF", "#8E6BBF",
  "#D5779B", "#7A8B84", "#C2410C", "#4C9F38", "#5B6CFF",
];
