import React from 'react';
import '../styles/confirm-modal.css';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  itemName: string;
  entityLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

/**
 * In-app confirmation dialog for destructive deletes (settings, etc.).
 */
export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  itemName,
  entityLabel,
  onCancel,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
      <div className="modal-container" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h3
            id="confirm-delete-title"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--danger)' }}
          >
            <span aria-hidden>🗑</span> Delete {entityLabel}
          </h3>
          <button type="button" onClick={onCancel} className="modal-close-btn" disabled={isLoading} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="confirm-modal-section">
          <p className="confirm-modal-warning">
            Are you sure you want to delete &quot;{itemName}&quot;?
          </p>
          <p className="confirm-modal-desc">
            This action cannot be undone. Issues using this {entityLabel.toLowerCase()} may be affected.
          </p>
        </div>
        <div className="confirm-modal-footer">
          <button type="button" onClick={onCancel} className="confirm-modal-cancel-btn" disabled={isLoading}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="confirm-modal-confirm-btn" disabled={isLoading}>
            {isLoading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
