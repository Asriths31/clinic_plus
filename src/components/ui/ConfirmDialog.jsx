export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', isLoading = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--sm confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__icon">⚠️</div>
        <h3 className="confirm-dialog__title">{title || 'Are you sure?'}</h3>
        <p className="confirm-dialog__message">{message || 'This action cannot be undone.'}</p>
        <div className="confirm-dialog__actions">
          <button className="btn btn--outline" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button className="btn btn--danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
