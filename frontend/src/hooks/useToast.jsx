import { useState, useCallback } from "react";

// const [toast, flash] = useToast();  ...  {toast}  ...  flash("Saved!")
export const useToast = () => {
  const [message, setMessage] = useState("");
  const flash = useCallback((msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2200);
  }, []);
  const node = message ? (
    <div className="toast toast-bottom toast-center z-[60]">
      <div className="alert bg-neutral text-neutral-content">
        <span>{message}</span>
      </div>
    </div>
  ) : null;
  return [node, flash];
};
