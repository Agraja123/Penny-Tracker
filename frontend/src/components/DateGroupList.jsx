import Money from "./Money";
import { formatPretty } from "../utils/date";

// Renders a list of { date, total, items } groups, most recent date first.
// `renderItem` decides how each individual entry looks (savings vs expenses).
const DateGroupList = ({ groups, renderItem, emptyMessage, totalLabel = "Total", onDateClick }) => {
  if (!groups.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-8">
        <span className="text-4xl mb-3">🗒️</span>
        <p className="text-base-content/50 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="px-5 space-y-5 pb-24">
      {groups.map(([date, items, total]) => (
        <div key={date}>
          <button
            onClick={() => onDateClick && onDateClick(date)}
            className="flex items-center justify-between mb-2 w-full text-left"
          >
            <p className="text-sm font-semibold text-base-content/60 underline decoration-dotted underline-offset-4">
              {formatPretty(date)}
            </p>
            <p className="text-sm font-bold text-base-content/70">
              {totalLabel} <Money v={total} />
            </p>
          </button>
          <div className="space-y-2">{items.map(renderItem)}</div>
        </div>
      ))}
    </div>
  );
};

export default DateGroupList;
