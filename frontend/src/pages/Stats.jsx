import { useEffect, useState, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import PageShell, { Spinner } from "../components/PageShell";
import FilterTabs from "../components/FilterTabs";
import Money from "../components/Money";
import { BarSeries, Donut, ProgressBar, StatTile } from "../components/Charts";
import client from "../api/client";
import { rangeForFilter } from "../utils/date";
import { CATEGORY_EMOJI, CHART_COLORS } from "../utils/format";

// Statistics for ONE section (savings or expenses) over a chosen period.
const Stats = () => {
  const { section } = useParams();
  const [filter, setFilter] = useState("monthly");
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    const { from, to } = rangeForFilter(filter);
    const params = { groupBy: filter === "yearly" || filter === "all" ? "month" : "day" };
    if (from) params.from = from;
    if (to) params.to = to;
    client.get("/stats", { params }).then((r) => setData(r.data));
  }, [filter]);

  const isSavings = section === "savings";

  const derived = useMemo(() => {
    if (!data) return null;
    const days = new Set(data.series.filter((s) => (isSavings ? s.saved : s.spent) > 0).map((s) => s.key)).size;
    const total = isSavings ? data.totals.saved : data.totals.spent;
    const peak = [...data.series].sort((a, b) => (isSavings ? b.saved - a.saved : b.spent - a.spent))[0];
    return { total, average: days ? Math.round(total / days) : 0, peak };
  }, [data, isSavings]);

  if (section !== "savings" && section !== "expenses") return <Navigate to="/home" replace />;

  const accent = isSavings ? "primary" : "secondary";
  const backTo = isSavings ? "/savings" : "/expenses";
  const unit = data?.groupBy === "month" ? "month" : "day";

  return (
    <PageShell title={isSavings ? "Savings stats" : "Expense stats"} backTo={backTo}>
      <FilterTabs value={filter} onChange={setFilter} accent={accent} />
      {!data ? (
        <Spinner />
      ) : (
        <div className="px-5 pb-12 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <StatTile label={isSavings ? "Total saved" : "Total spent"} tone={accent}>
              <Money v={derived.total} />
            </StatTile>
            <StatTile label={`Average per ${unit}`}>
              <Money v={derived.average} />
            </StatTile>
            <StatTile label="Entries">{isSavings ? data.totals.savingCount : data.totals.expenseCount}</StatTile>
            <StatTile label={`Highest ${unit}`}>{derived.peak ? <Money v={isSavings ? derived.peak.saved : derived.peak.spent} /> : "-"}</StatTile>
          </div>

          {!derived.total ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="text-4xl mb-3">📊</span>
              <p className="text-base-content/50 font-medium">Nothing logged for this period yet</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-3">
                  {isSavings ? "Saved" : "Spent"} per {unit}
                </p>
                <BarSeries series={data.series} groupBy={data.groupBy} show={isSavings ? "saved" : "spent"} />
              </div>

              {isSavings ? (
                <div>
                  <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-3">By savings card</p>
                  <div className="space-y-3">
                    {data.goals.map((g) => (
                      <div key={g.goalId} className="bg-base-200 rounded-2xl p-4">
                        <div className="flex justify-between">
                          <p className="font-semibold">{g.icon} {g.name}</p>
                          <p className="font-display font-bold text-primary"><Money v={g.total} /></p>
                        </div>
                        <div className="mt-2">
                          <ProgressBar value={g.total} max={data.totals.saved} />
                        </div>
                        <p className="text-xs text-base-content/50 mt-1.5">
                          {Math.round((g.total / data.totals.saved) * 100)}% of savings · {g.count} entr{g.count === 1 ? "y" : "ies"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-3">By category</p>
                  <Donut items={data.categories.map((c) => ({ value: c.total }))} centerLabel="Spent" />
                  <div className="space-y-2 mt-5">
                    {data.categories.map((c, i) => (
                      <div key={c.category} className="flex items-center justify-between bg-base-200 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <div>
                            <p className="font-semibold">{CATEGORY_EMOJI[c.category]} {c.category}</p>
                            <p className="text-xs text-base-content/50">
                              {Math.round((c.total / data.totals.spent) * 100)}% · {c.count} entr{c.count === 1 ? "y" : "ies"}
                            </p>
                          </div>
                        </div>
                        <p className="font-display font-bold text-secondary"><Money v={c.total} /></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </PageShell>
  );
};

export default Stats;
