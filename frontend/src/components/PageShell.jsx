import { useNavigate } from "react-router-dom";
import DateBar from "./DateBar";

// Common frame for the newer pages: date header, close button and content.
const PageShell = ({ title, right = null, backTo = "/home", children }) => {
  const navigate = useNavigate();
  return (
    <div className="app-shell-backdrop min-h-screen flex justify-center">
      <div className="app-shell-frame w-full bg-base-100 min-h-screen flex flex-col relative">
        <DateBar
          title={title}
          right={
            <div className="flex items-center gap-1">
              {right}
              <button onClick={() => navigate(backTo)} className="btn btn-ghost btn-sm btn-circle">
                ✕
              </button>
            </div>
          }
        />
        {children}
      </div>
    </div>
  );
};

export const Fab = ({ onClick, accent = "primary", label = "＋" }) => {
  const cls = {
    primary: "btn btn-primary shadow-primary/30",
    secondary: "btn btn-secondary shadow-secondary/30",
    accent: "btn btn-accent shadow-accent/30",
  }[accent];
  return (
    <button
      onClick={onClick}
      className={`${cls} btn-circle fixed bottom-8 right-8 md:right-[calc(50%-232px)] shadow-xl h-16 w-16 text-3xl z-30`}
    >
      {label}
    </button>
  );
};

export const Spinner = () => (
  <div className="flex justify-center py-16">
    <span className="loading loading-spinner loading-md text-primary" />
  </div>
);

export default PageShell;
