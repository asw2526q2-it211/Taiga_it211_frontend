import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../services/client';
import type { TypeResource } from '../types/api';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import '../styles/settings.css';

/* ─── Estat intern per al formulari d'edició ─── */
interface EditingState {
  id: number | null;
  name: string;
  color: string;
  order: number;
  is_default: boolean;
}

const INITIAL_EDITING: EditingState = {
  id: null,
  name: '',
  color: '#cccccc',
  order: 1,
  is_default: false,
};

/**
 * Component de gestió de tipus d'incidència (Types).
 * Tots els estils provenen de settings.css (CSS custom properties).
 */
export const TypeSettings: React.FC = () => {
  const [types, setTypes] = useState<TypeResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<EditingState>({ ...INITIAL_EDITING });
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TypeResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ── Carregar llistat ── */
  const fetchTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<TypeResource[]>('types/');
      data.sort((a, b) => a.order - b.order);
      setTypes(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch types');
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
        const data = await apiRequest<TypeResource[]>('types/');
        if (!cancelled) {
          data.sort((a, b) => a.order - b.order);
          setTypes(data);
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch types');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Reordenar (drag & drop) ── */
  const handleReorder = useCallback(
    async (itemId: number, newOrder: number) => {
      // Optimistic local reorder
      setTypes((prev) => {
        const items = [...prev];
        const draggedIndex = items.findIndex((it) => it.id === itemId);
        if (draggedIndex === -1) return prev;

        const originalTargetIndex = items.findIndex((it) => it.order === newOrder);
        if (originalTargetIndex === -1) return prev;

        const [draggedItem] = items.splice(draggedIndex, 1);

        const targetIndex = draggedIndex < originalTargetIndex
          ? originalTargetIndex - 1
          : originalTargetIndex;

        const insertAt = draggedIndex < originalTargetIndex
          ? targetIndex + 1
          : targetIndex;

        items.splice(insertAt, 0, draggedItem);

        return items.map((it, idx) => ({ ...it, order: idx + 1 }));
      });

      try {
        await apiRequest<TypeResource>(`types/${itemId}/`, {
          method: 'PUT',
          body: { order: newOrder },
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to reorder type');
        await fetchTypes();
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
  } = useDragAndDrop({ items: types, onReorder: handleReorder });

  /* ── Tancar formulari ── */
  const resetForm = () => {
    setEditing({ ...INITIAL_EDITING });
    setShowAddForm(false);
  };

  /* ── Obrir formulari de creació ── */
  const handleAddNew = () => {
    const nextOrder = types.length + 1;
    setEditing({ ...INITIAL_EDITING, order: nextOrder });
    setShowAddForm(true);
  };

  /* ── Obrir formulari d'edició ── */
  const handleEdit = (t: TypeResource) => {
    setEditing({
      id: t.id,
      name: t.name,
      color: t.color,
      order: t.order,
      is_default: t.is_default,
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
        const created = await apiRequest<TypeResource>('types/', {
          method: 'POST',
          body: {
            name: editing.name.trim(),
            color: editing.color,
            order: editing.order,
            is_default: editing.is_default,
          },
        });
        setTypes((prev) => [...prev, created].sort((a, b) => a.order - b.order));
      } else {
        await apiRequest<TypeResource>(`types/${editing.id}/`, {
          method: 'PUT',
          body: {
            name: editing.name.trim(),
            color: editing.color,
            order: editing.order,
            is_default: editing.is_default,
          },
        });
        await fetchTypes();
      }
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save type');
    }
  };

  /* ── Establir com a defecte ── */
  const handleSetDefault = async (t: TypeResource) => {
    try {
      await apiRequest<TypeResource>(`types/${t.id}/`, {
        method: 'PUT',
        body: { is_default: true },
      });
      await fetchTypes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set default type');
    }
  };

  /* ── Eliminar ── */
  const handleDeleteClick = (t: TypeResource) => {
    setPendingDelete(t);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await apiRequest(`types/${pendingDelete.id}/`, { method: 'DELETE' });
      setTypes((prev) => prev.filter((x) => x.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete type');
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── Renderitzat ── */
  return (
    <div>
      <h1 className="settings-section-title">Types</h1>
      <p className="settings-section-desc">Specify the types your issues will have.</p>

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
        <span className="settings-header-label">Issue Types</span>
        <button className="settings-add-btn" onClick={handleAddNew}>ADD NEW TYPE</button>
      </div>

      {/* ── Graella ── */}
      <div className="priorities-grid-scroll">
        <div className="priorities-col-headers">
          <div />
          <div className="set-col-header">Color</div>
          <div className="set-col-header">Name</div>
          <div className="set-col-header">Default</div>
          <div />
        </div>

        {loading ? (
          <div className="set-loading">Loading types...</div>
        ) : types.length === 0 && !showAddForm ? (
          <div className="set-empty">No types defined yet.</div>
        ) : (
          types.map((t) => {
            const isEditingThis = editing.id === t.id && !showAddForm;
            const isDragging = draggedId === t.id;
            const isDropTarget = dropTargetId === t.id;
            return (
              <div
                key={t.id}
                className={`priorities-row${isEditingThis ? ' is-editing' : ''}${isDragging ? ' is-dragging' : ''}${isDropTarget ? ' drag-over' : ''}`}
                draggable={!isEditingThis}
                onDragStart={!isEditingThis ? handleDragStart(t.id) : undefined}
                onDragOver={!isEditingThis ? handleDragOver(t.id) : undefined}
                onDrop={!isEditingThis ? handleDrop(t.id) : undefined}
                onDragEnd={!isEditingThis ? handleDragEnd : undefined}
              >
                {isEditingThis ? (
                  /* ── Formulari inline d'edició ── */
                  <>
                    <div className="set-drag-handle">⋮⋮</div>
                    <div />
                    <div style={{ gridColumn: '3 / span 3' }}>
                      <div className="set-inline-form" style={{ margin: 0 }}>
                        <p className="set-inline-form-title">Edit Type</p>
                        <form onSubmit={handleSave}>
                          <div className="set-form-row">
                            <div className="set-form-group">
                              <label>Name</label>
                              <input
                                type="text"
                                className="set-form-input"
                                value={editing.name}
                                required
                                onChange={(e) =>
                                  setEditing((prev) => ({ ...prev, name: e.target.value }))
                                }
                              />
                            </div>
                            <div className="set-form-group">
                              <label>Color</label>
                              <input
                                type="color"
                                className="set-form-color larger"
                                value={editing.color}
                                onChange={(e) =>
                                  setEditing((prev) => ({ ...prev, color: e.target.value }))
                                }
                              />
                            </div>
                            <div className="set-form-group">
                              <label>Order</label>
                              <input
                                type="number"
                                className="set-form-number"
                                value={editing.order}
                                min={1}
                                max={types.length}
                                onChange={(e) =>
                                  setEditing((prev) => ({
                                    ...prev,
                                    order: parseInt(e.target.value, 10) || 1,
                                  }))
                                }
                              />
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
                    <div>
                      <span
                        className="set-color-swatch"
                        style={{ backgroundColor: t.color }}
                      />
                    </div>
                    <div className="set-name">{t.name}</div>
                    <div className="set-default-cell">
                      {t.is_default ? (
                        <span className="set-default-badge">Default</span>
                      ) : (
                        <button className="set-default-btn" onClick={() => handleSetDefault(t)}>
                          Set default
                        </button>
                      )}
                    </div>
                    <div className="set-actions">
                      <button
                        className="set-action-btn edit"
                        title="Edit"
                        onClick={() => handleEdit(t)}
                      >
                        ✏
                      </button>
                      <button
                        className="set-action-btn delete"
                        title="Delete"
                        onClick={() => handleDeleteClick(t)}
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
            <p className="set-inline-form-title">New Type</p>
            <form onSubmit={handleSave}>
              <div className="set-form-row">
                <div className="set-form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    className="set-form-input"
                    placeholder="Type name"
                    value={editing.name}
                    required
                    onChange={(e) =>
                      setEditing((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="set-form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    className="set-form-color larger"
                    value={editing.color}
                    onChange={(e) =>
                      setEditing((prev) => ({ ...prev, color: e.target.value }))
                    }
                  />
                </div>
                <div className="set-form-group">
                  <label>Order</label>
                  <input
                    type="number"
                    className="set-form-number"
                    value={editing.order}
                    min={1}
                    max={types.length + 1}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                  />
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
        entityLabel="Type"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
};
