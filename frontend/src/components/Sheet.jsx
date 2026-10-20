// Shared bottom-sheet modal used by all the add/edit forms.
const SAVE_CLASS = {
  primary: "btn btn-primary flex-1",
  secondary: "btn btn-secondary flex-1",
  accent: "btn btn-accent flex-1",
};

export const Field = ({ label, children, hint }) => (
  <div>
    <label className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">{label}</label>
    <div className="mt-1">{children}</div>
    {hint && <p className="text-xs text-base-content/50 mt-1">{hint}</p>}
  </div>
);

const Sheet = ({ open, title, subtitle, onClose, onSave, saveLabel = "Save", accent = "primary", error, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-base-100 w-full md:w-96 md:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-display font-bold text-lg text-base-content">{title}</h3>
        {subtitle && <p className="text-sm text-base-content/60 mt-0.5">{subtitle}</p>}
        <div className="mt-5 space-y-4">
          {children}
          {error && <p className="text-error text-sm font-medium">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={onSave} className={SAVE_CLASS[accent] || SAVE_CLASS.primary}>
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sheet;
