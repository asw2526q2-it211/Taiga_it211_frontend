import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../services/client';
import type { PriorityResource } from '../types/api';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
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
 * Component de gestió de prioritats (Priorities).
 * Tots els estils provenen de settings.css (CSS custom properties).
 */
export const PrioritySettings: React.FC = () => {
  const [priorities, setPriorities] = useState<PriorityResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<EditingState>({ ...INITIAL_EDITING });
  const [showAddForm, setShowAddForm] = useState(false);

  /* ── Carregar llistat ── */
  const fetchPriorities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<PriorityResource[]>('priorities/');
      data.sort((a, b) => a.order - b.order);
      setPriorities(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch priorities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  /* ── Reordenar (drag & drop) ── */
  const handleReorder = useCallback(
    async (itemId: number, newOrder: number) => {
      // Optimistic local reorder
      setPriorities((prev) => {
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
        await apiRequest<PriorityResource>(`priorities/${itemId}/`, {
          method: 'PUT',
          body: { order: newOrder },
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to reorder priority');
        await fetchPriorities();
      }
    },
    [fetchPriorities],
  );

  const {
    draggedId,
    dropTargetId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
  } = useDragAndDrop({ items: priorities, onReorder: handleReorder });

  /* ── Tancar formulari ── */
  const resetForm = () => {
    setEditing({ ...INITIAL_EDITING });
    setShowAddForm(false);
  };

  /* ── Obrir formulari de creació ── */
  const handleAddNew = () => {
    const nextOrder = priorities.length + 1;
    setEditing({ ...INITIAL_EDITING, order: nextOrder });
    setShowAddForm(true);
  };

  /* ── Obrir formulari d'edició ── */
  const handleEdit = (p: PriorityResource) => {
    setEditing({
      id: p.id,
      name: p.name,
      color: p.color,
      order: p.order,
      is_default: p.is_default,
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
        const created = await apiRequest<PriorityResource>('priorities/', {
          method: 'POST',
          body: {
            name: editing.name.trim(),
            color: editing.color,
            order: editing.order,
            is_default: editing.is_default,
          },
        });
        setPriorities((prev) => [...prev, created].sort((a, b) => a.order - b.order));
      } else {
        await apiRequest<PriorityResource>(`priorities/${editing.id}/`, {
          method: 'PUT',
          body: {
            name: editing.name.trim(),
            color: editing.color,
            order: editing.order,
            is_default: editing.is_default,
          },
        });
        await fetchPriorities();
      }
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save priority');
    }
  };

  /* ── Establir com a defecte ── */
  const handleSetDefault = async (p: PriorityResource) => {
    try {
      await apiRequest<PriorityResource>(`priorities/${p.id}/`, {
        method: 'PUT',
        body: { is_default: true },
      });
      await fetchPriorities();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set default priority');
    }
  };

  /* ── Eliminar ── */
  const handleDelete = async (p: PriorityResource) => {
    if (!window.confirm(`Are you sure you want to delete "${p.name}"?`)) return;
    try {
      await apiRequest(`priorities/${p.id}/`, { method: 'DELETE' });
      setPriorities((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete priority');
    }
  };

  /* ── Renderitzat ── */
  return (
    <div>
      <h1 className="settings-section-title">Priorities</h1>
      <p className="settings-section-desc">Specify the priorities your issues will have.</p>

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
        <span className="settings-header-label">Issue Priorities</span>
        <button className="settings-add-btn" onClick={handleAddNew}>ADD NEW PRIORITY</button>
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
          <div className="set-loading">Loading priorities...</div>
        ) : priorities.length === 0 && !showAddForm ? (
          <div className="set-empty">No priorities defined yet.</div>
        ) : (
          priorities.map((p) => {
            const isEditingThis = editing.id === p.id && !showAddForm;
            const isDragging = draggedId === p.id;
            const isDropTarget = dropTargetId === p.id;
            return (
              <div
                key={p.id}
                className={`priorities-row${isEditingThis ? ' is-editing' : ''}${isDragging ? ' is-dragging' : ''}${isDropTarget ? ' drag-over' : ''}`}
                draggable={!isEditingThis}
                onDragStart={!isEditingThis ? handleDragStart(p.id) : undefined}
                onDragOver={!isEditingThis ? handleDragOver(p.id) : undefined}
                onDrop={!isEditingThis ? handleDrop(p.id) : undefined}
                onDragEnd={!isEditingThis ? handleDragEnd : undefined}
              >
                {isEditingThis ? (
                  /* ── Formulari inline d'edició ── */
                  <>
                    <div className="set-drag-handle">⋮⋮</div>
                    <div />
                    <div style={{ gridColumn: '3 / span 3' }}>
                      <div className="set-inline-form" style={{ margin: 0 }}>
                        <p className="set-inline-form-title">Edit Priority</p>
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
                                max={priorities.length}
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
                        style={{ backgroundColor: p.color }}
                      />
                    </div>
                    <div className="set-name">{p.name}</div>
                    <div className="set-default-cell">
                      {p.is_default ? (
                        <span className="set-default-badge">Default</span>
                      ) : (
                        <button className="set-default-btn" onClick={() => handleSetDefault(p)}>
                          Set default
                        </button>
                      )}
                    </div>
                    <div className="set-actions">
                      <button
                        className="set-action-btn edit"
                        title="Edit"
                        onClick={() => handleEdit(p)}
                      >
                        ✏
                      </button>
                      <button
                        className="set-action-btn delete"
                        title="Delete"
                        onClick={() => handleDelete(p)}
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
            <p className="set-inline-form-title">New Priority</p>
            <form onSubmit={handleSave}>
              <div className="set-form-row">
                <div className="set-form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    className="set-form-input"
                    placeholder="Priority name"
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
                    max={priorities.length + 1}
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
    </div>
  );
};
