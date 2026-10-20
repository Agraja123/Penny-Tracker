import { useEffect, useState } from "react";

// Shows the current day and date. Appears at the top of every main page,
// as requested, so the user always knows "today" while entering data.
const DateBar = ({ title, right = null }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // keep it accurate if the app is left open past midnight
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const day = now.toLocaleDateString(undefined, { weekday: "long" });
  const date = now.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <div>
        {title && <h1 className="font-display font-bold text-xl text-base-content leading-tight">{title}</h1>}
        <p className="text-sm text-base-content/60 font-medium mt-0.5">
          {day} · {date}
        </p>
      </div>
      {right}
    </div>
  );
};

export default DateBar;
