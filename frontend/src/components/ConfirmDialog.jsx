// Small confirmation dialog used before any delete action.
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmLabel = "Delete", confirmClass = "btn btn-error text-error-content flex-1" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-base-100 w-full md:w-96 md:rounded-2xl rounded-t-2xl p-6 animate-[fadeIn_.15s_ease]">
        <h3 className="font-display font-bold text-lg text-base-content">{title}</h3>
        <p className="text-sm text-base-content/70 mt-2">{message}</p>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} className={confirmClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
