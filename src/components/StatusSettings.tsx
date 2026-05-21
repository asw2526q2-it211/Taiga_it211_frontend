import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../services/client';
import type { StatusResource } from '../types/api';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import '../styles/settings.css';

/* ─── Estat intern per al formulari d'edició ─── */
interface EditingState {
  id: number | null;
  name: string;
  color: string;
  order: number;
  closed: boolean;
  is_default: boolean;
}

const INITIAL_EDITING: EditingState = {
  id: null,
  name: '',
  color: '#999999',
  order: 1,
  closed: false,
  is_default: false,
};

/**
 * Component de gestió d'estats (Statuses).
 * Tots els estils provenen de settings.css (CSS custom properties).
 */
export const StatusSettings: React.FC = () => {
  const [statuses, setStatuses] = useState<StatusResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<EditingState>({ ...INITIAL_EDITING });
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StatusResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ── Carregar llistat ── */
  const fetchStatuses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<StatusResource[]>('statuses/');
      data.sort((a, b) => a.order - b.order);
      setStatuses(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<StatusResource[]>('statuses/');
        if (!cancelled) {
          data.sort((a, b) => a.order - b.order);
          setStatuses(data);
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch statuses');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Reordenar (drag & drop) ── */
  const handleReorder = useCallback(
    async (itemId: number, newOrder: number) => {
      // Optimistic local reorder: actualitza la llista visualment a l'instant
      setStatuses((prev) => {
        const items = [...prev];
        const draggedIndex = items.findIndex((it) => it.id === itemId);
        if (draggedIndex === -1) return prev;

        // Original target index (before removal)
        const originalTargetIndex = items.findIndex((it) => it.order === newOrder);
        if (originalTargetIndex === -1) return prev;

        // Treiem l'element arrossegat
        const [draggedItem] = items.splice(draggedIndex, 1);

        // After removal, if the dragged item was before the target,
        // the target shifted left by 1.
        const targetIndex = draggedIndex < originalTargetIndex
          ? originalTargetIndex - 1
          : originalTargetIndex;

        // If dragging DOWN (dragged was above target), insert AFTER target.
        // If dragging UP   (dragged was below target), insert BEFORE target.
        const insertAt = draggedIndex < originalTargetIndex
          ? targetIndex + 1
          : targetIndex;

        items.splice(insertAt, 0, draggedItem);

        // Reassignem els order perquè siguin 1-based consecutius
        return items.map((it, idx) => ({ ...it, order: idx + 1 }));
      });

      // Petició al backend en background
      try {
        await apiRequest<StatusResource>(`statuses/${itemId}/`, {
          method: 'PUT',
          body: { order: newOrder },
        });
      } catch (err: unknown) {
        // Si falla, refem la llista per tornar a un estat consistent
        setError(err instanceof Error ? err.message : 'Failed to reorder status');
        await fetchStatuses();
      }
    },
    [],
  );

  const {
    draggedId,
    dropTargetId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
  } = useDragAndDrop({ items: statuses, onReorder: handleReorder });

  /* ── Tancar formulari ── */
  const resetForm = () => {
    setEditing({ ...INITIAL_EDITING });
    setShowAddForm(false);
  };

  /* ── Obrir formulari de creació ── */
  const handleAddNew = () => {
    const nextOrder = statuses.length + 1;
    setEditing({ ...INITIAL_EDITING, order: nextOrder });
    setShowAddForm(true);
  };

  /* ── Obrir formulari d'edició ── */
  const handleEdit = (st: StatusResource) => {
    setEditing({
      id: st.id,
      name: st.name,
      color: st.color,
      order: st.order,
      closed: st.closed,
      is_default: st.is_default,
    });
    setShowAddForm(false);
  };

  /* ── Cancel·lar ── */
  const handleCancel = () => {
    resetForm();
  };

  /* ── Desa (crea o actualitza) ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.name.trim()) return;

    try {
      if (editing.id === null) {
        await apiRequest<StatusResource>('statuses/', {
          method: 'POST',
          body: {
            name: editing.name.trim(),
            color: editing.color,
            order: editing.order,
            closed: editing.closed,
            is_default: editing.is_default,
          },
        });
        await fetchStatuses();
      } else {
        await apiRequest<StatusResource>(`statuses/${editing.id}/`, {
          method: 'PUT',
          body: {
            name: editing.name.trim(),
            color: editing.color,
            order: editing.order,
            closed: editing.closed,
            is_default: editing.is_default,
          },
        });
        await fetchStatuses();
      }
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save status');
    }
  };

  /* ── Establir com a defecte ── */
  const handleSetDefault = async (st: StatusResource) => {
    try {
      await apiRequest<StatusResource>(`statuses/${st.id}/`, {
        method: 'PUT',
        body: { is_default: true },
      });
      await fetchStatuses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set default status');
    }
  };

  /* ── Eliminar ── */
  const handleDeleteClick = (st: StatusResource) => {
    setPendingDelete(st);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await apiRequest(`statuses/${pendingDelete.id}/`, { method: 'DELETE' });

      // Fetch remaining statuses and re-sequence their order values to close gaps
      const remaining = await apiRequest<StatusResource[]>('statuses/');
      remaining.sort((a, b) => a.order - b.order);

      await Promise.all(
        remaining.map((st, idx) => {
          const expectedOrder = idx + 1;
          if (st.order !== expectedOrder) {
            return apiRequest<StatusResource>(`statuses/${st.id}/`, {
              method: 'PUT',
              body: { order: expectedOrder },
            });
          }
          return Promise.resolve();
        }),
      );

      // Update local state with consecutive orders
      setStatuses(remaining.map((st, idx) => ({ ...st, order: idx + 1 })));
      setLoading(false);
      setPendingDelete(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete status');
      await fetchStatuses();
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── Renderitzat ── */
  return (
    <div>
      {/* ── Títol ── */}
      <h1 className="settings-section-title">Statuses</h1>
      <p className="settings-section-desc">Add, remove or edit the name of the issue statuses.</p>

      {/* ── Error ── */}
      {error && (
        <div className="set-error-banner">
          <span>{error}</span>
          <button className="set-error-dismiss" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* ── Header bar ── */}
      <div className="settings-header-bar">
        <span className="settings-header-label">Issue Statuses</span>
        <button className="settings-add-btn" onClick={handleAddNew}>
          ADD NEW STATUS
        </button>
      </div>

      {/* ── Graella ── */}
      <div className="statuses-grid-scroll">
        <div className="statuses-col-headers">
          <div />
          <div className="set-col-header" style={{ textAlign: 'center' }}>Color</div>
          <div className="set-col-header">Name</div>
          <div className="set-col-header" style={{ textAlign: 'center' }}>Order</div>
          <div className="set-col-header">Slug</div>
          <div className="set-col-header">Default</div>
          <div className="set-col-header" style={{ textAlign: 'center' }}>Is closed?</div>
          <div />
        </div>

        {loading ? (
          <div className="set-loading">Loading statuses...</div>
        ) : statuses.length === 0 && !showAddForm ? (
          <div className="set-empty">No statuses defined yet.</div>
        ) : (
          statuses.map((st) => {
            const isEditingThis = editing.id === st.id && !showAddForm;
            const isDragging = draggedId === st.id;
            const isDropTarget = dropTargetId === st.id;
            return (
              <div
                key={st.id}
                className={`statuses-row${isEditingThis ? ' is-editing' : ''}${isDragging ? ' is-dragging' : ''}${isDropTarget ? ' drag-over' : ''}`}
                draggable={!isEditingThis}
                onDragStart={!isEditingThis ? handleDragStart(st.id) : undefined}
                onDragOver={!isEditingThis ? handleDragOver(st.id) : undefined}
                onDrop={!isEditingThis ? handleDrop(st.id) : undefined}
                onDragEnd={!isEditingThis ? handleDragEnd : undefined}
              >
                {isEditingThis ? (
                  /* ── Formulari inline d'edició ── */
                  <>
                    <div className="set-drag-handle">⋮⋮</div>
                    <div />
                    <div style={{ gridColumn: '3 / -1' }}>
                      <div className="set-inline-form" style={{ margin: 0 }}>
                        <p className="set-inline-form-title">Edit Status</p>
                        <form onSubmit={handleSave}>
                          <div className="set-form-row">
                            <div className="set-form-group">
                              <label>Color</label>
                              <input
                                type="color"
                                className="set-form-color"
                                value={editing.color}
                                onChange={(e) =>
                                  setEditing((prev) => ({ ...prev, color: e.target.value }))
                                }
                              />
                            </div>
                            <div className="set-form-group">
                              <label>Name</label>
                              <input
                                type="text"
                                className="set-form-input wide"
                                value={editing.name}
                                required
                                onChange={(e) =>
                                  setEditing((prev) => ({ ...prev, name: e.target.value }))
                                }
                              />
                            </div>
                            <div className="set-form-group">
                              <label>Order</label>
                              <input
                                type="number"
                                className="set-form-number small"
                                value={editing.order}
                                min={1}
                                max={statuses.length}
                                onChange={(e) =>
                                  setEditing((prev) => ({
                                    ...prev,
                                    order: parseInt(e.target.value, 10) || 1,
                                  }))
                                }
                              />
                            </div>
                            <div className="set-form-group">
                              <label>Is closed?</label>
                              <select
                                className="set-form-select"
                                value={editing.closed ? 'true' : 'false'}
                                onChange={(e) =>
                                  setEditing((prev) => ({
                                    ...prev,
                                    closed: e.target.value === 'true',
                                  }))
                                }
                              >
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                              </select>
                            </div>
                            <div className="set-form-check">
                              <input
                                type="checkbox"
                                id="edit-default-check"
                                checked={editing.is_default}
                                onChange={(e) =>
                                  setEditing((prev) => ({
                                    ...prev,
                                    is_default: e.target.checked,
                                  }))
                                }
                              />
                              <label htmlFor="edit-default-check">Set as default</label>
                            </div>
                            <div className="set-form-actions">
                              <button type="submit" className="set-save-btn">Save</button>
                              <button type="button" className="set-cancel-link" onClick={handleCancel}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ── Visualització normal ── */
                  <>
                    <div className="set-drag-handle">⋮⋮</div>
                    <div style={{ textAlign: 'center' }}>
                      <span
                        className="set-color-swatch"
                        style={{ backgroundColor: st.color }}
                      />
                    </div>
                    <div className="set-name">{st.name}</div>
                    <div className="set-order-cell">{st.order}</div>
                    <div className="set-slug">{st.slug}</div>
                    <div className="set-default-cell">
                      {st.is_default ? (
                        <span className="set-default-badge">Default</span>
                      ) : (
                        <button className="set-default-btn" onClick={() => handleSetDefault(st)}>
                          Set default
                        </button>
                      )}
                    </div>
                    <div className="set-closed-cell">
                      {st.closed && (
                        <div className="set-closed-icon">
                          <svg style={{ width: '14px', height: '14px', fill: 'none', stroke: 'currentColor', strokeWidth: 3 }} viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="set-actions">
                      <button
                        className="set-action-btn edit"
                        title="Edit"
                        onClick={() => handleEdit(st)}
                      >
                        ✏
                      </button>
                      <button
                        className="set-action-btn delete"
                        title="Delete"
                        onClick={() => handleDeleteClick(st)}
                      >
                        🗑
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Formulari de creació ── */}
      {showAddForm && (
        <div style={{ padding: '12px 0 0 0' }}>
          <div className="set-inline-form">
            <p className="set-inline-form-title">New Status</p>
            <form onSubmit={handleSave}>
              <div className="set-form-row">
                <div className="set-form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    className="set-form-color"
                    value={editing.color}
                    onChange={(e) =>
                      setEditing((prev) => ({ ...prev, color: e.target.value }))
                    }
                  />
                </div>
                <div className="set-form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    className="set-form-input wide"
                    placeholder="Name"
                    value={editing.name}
                    required
                    onChange={(e) =>
                      setEditing((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="set-form-group">
                  <label>Order</label>
                  <input
                    type="number"
                    className="set-form-number small"
                    value={editing.order}
                    min={1}
                    max={statuses.length + 1}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                  />
                </div>
                <div className="set-form-group">
                  <label>Is closed?</label>
                  <select
                    className="set-form-select"
                    value={editing.closed ? 'true' : 'false'}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        closed: e.target.value === 'true',
                      }))
                    }
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div className="set-form-check">
                  <input
                    type="checkbox"
                    id="add-default-check"
                    checked={editing.is_default}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        is_default: e.target.checked,
                      }))
                    }
                  />
                  <label htmlFor="add-default-check">Set as default</label>
                </div>
                <div className="set-form-actions">
                  <button type="submit" className="set-save-btn">Add</button>
                  <button type="button" className="set-cancel-link" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={pendingDelete !== null}
        itemName={pendingDelete?.name ?? ''}
        entityLabel="Status"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
};
