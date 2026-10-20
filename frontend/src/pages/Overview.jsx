import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell, { Spinner } from "../components/PageShell";
import Money from "../components/Money";
import client from "../api/client";
import { monthKey, shiftMonth, formatMonth } from "../utils/date";
import { CATEGORY_EMOJI } from "../utils/format";

const Line = ({ dot, label, children, sub }) => (
  <div className="flex items-center justify-between py-3 border-b border-base-300 last:border-0">
    <div className="flex items-center gap-3 min-w-0">
      <span className={`w-3 h-3 rounded-full shrink-0 ${dot}`} />
      <div>
        <p className="font-semibold">{label}</p>
        {sub && <p className="text-xs text-base-content/50">{sub}</p>}
      </div>
    </div>
    <p className="font-display font-bold">{children}</p>
  </div>
);

// Overall analysis: how this month's income was split between spent / saved / left.
const Overview = () => {
  const navigate = useNavigate();
  const [month, setMonth] = useState(monthKey());
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    client.get("/stats/overview", { params: { month } }).then((r) => setData(r.data));
  }, [month]);

  const isCurrent = month === monthKey();

  return (
    <PageShell title="Overall analysis">
      <div className="px-5 pb-12 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setMonth(shiftMonth(month, -1))} className="btn btn-ghost btn-sm btn-circle">‹</button>
          <p className="font-display font-bold">{formatMonth(month)}</p>
          <button onClick={() => setMonth(shiftMonth(month, 1))} disabled={isCurrent} className="btn btn-ghost btn-sm btn-circle">›</button>
        </div>

        {!data ? (
          <Spinner />
        ) : data.income === 0 ? (
          <div className="bg-accent/15 rounded-2xl p-5 text-center">
            <p className="font-semibold">Add your salary to see the split</p>
            <p className="text-sm text-base-content/60 mt-1">
              Set your monthly salary in Settings and this screen will show how much you used and saved.
            </p>
            <button onClick={() => navigate("/settings")} className="btn btn-primary btn-sm mt-3">
              Open Settings
            </button>
          </div>
        ) : (
          <>
            <div className="bg-base-200 rounded-3xl p-5">
              <p className="font-display font-extrabold text-3xl">
                {data.percent.spent}% <span className="text-base font-semibold text-base-content/50">used</span>
              </p>
              <p className="font-display font-extrabold text-xl text-primary mt-0.5">
                {data.percent.saved}% <span className="text-sm font-semibold text-base-content/50">saved</span>
              </p>
              <div className="flex h-4 rounded-full overflow-hidden bg-base-300 mt-4">
                <div className="bg-secondary" style={{ width: `${Math.min(100, data.percent.spent)}%` }} />
                <div className="bg-primary" style={{ width: `${Math.min(100 - Math.min(100, data.percent.spent), data.percent.saved)}%` }} />
              </div>
              {data.overspent && (
                <p className="text-sm font-semibold text-error mt-3">
                  ⚠️ You've spent and saved <Money v={-data.left} /> more than your income this month.
                </p>
              )}
            </div>

            <div className="bg-base-200 rounded-3xl px-5 py-2">
              <Line dot="bg-base-content/30" label="Total income" sub={`Salary ${data.salary ? "" : "(not set) "}+ other income`}>
                <Money v={data.income} />
              </Line>
              <Line dot="bg-secondary" label="Used (expenses)" sub={`${data.percent.spent}% of income`}>
                <Money v={data.spent} />
              </Line>
              <Line dot="bg-primary" label="Saved" sub={`${data.percent.saved}% of income`}>
                <Money v={data.saved} />
              </Line>
              <Line dot="bg-accent" label="Left to use" sub="Income − used − saved">
                <span className={data.left < 0 ? "text-error" : ""}>
                  <Money v={data.left} />
                </span>
              </Line>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-base-200 rounded-2xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">Salary</p>
                <p className="font-display font-bold text-lg mt-1"><Money v={data.salary} /></p>
              </div>
              <div className="bg-base-200 rounded-2xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">Other income</p>
                <p className="font-display font-bold text-lg mt-1"><Money v={data.extraIncome} /></p>
              </div>
            </div>

            {data.billsPendingCount > 0 && (
              <button onClick={() => navigate("/bills")} className="w-full text-left bg-accent/15 rounded-2xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Bills & EMIs still to pay</p>
                <p className="font-display font-bold text-lg mt-1">
                  <Money v={data.billsPending} /> <span className="text-sm font-semibold opacity-60">({data.billsPendingCount})</span>
                </p>
              </button>
            )}

            {data.topCategories.length > 0 && (
              <div>
                <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2">Where most of it went</p>
                <div className="space-y-2">
                  {data.topCategories.map((c) => (
                    <div key={c.category} className="flex items-center justify-between bg-base-200 rounded-2xl px-4 py-3">
                      <p className="font-semibold">{CATEGORY_EMOJI[c.category]} {c.category}</p>
                      <p className="font-display font-bold text-secondary"><Money v={c.total} /></p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
};

export default Overview;
