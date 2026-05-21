import React, { useEffect, useState } from 'react';
import { apiRequest } from '../services/client';
import type { DueDateRule } from '../types/api';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import '../styles/settings.css';

interface EditingState {
  id: number | null;
  name: string;
  color: string;
  /** Dies absoluts (sense signe); buit si és preset sense offset (només API). */
  daysToDue: string;
  direction: 'Before' | 'Past';
}

const INITIAL_EDITING: EditingState = {
  id: null,
  name: '',
  color: '#cccccc',
  daysToDue: '',
  direction: 'Before',
};

/**
 * Regla sense dies (p. ex. preset per defecte del model): no es pot eliminar ni editar offset via API com a Django.
 */
function isOffsetlessPreset(d: DueDateRule): boolean {
  return d.days_to_due === null;
}

/**
 * Gestió de presets de data de venciment (equivalent a due_dates/due_dates.html).
 */
export const DueDateSettings: React.FC = () => {
  const [dueDates, setDueDates] = useState<DueDateRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<EditingState>({ ...INITIAL_EDITING });
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DueDateRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDueDates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<DueDateRule[]>('duedates/');
      data.sort((a, b) => a.id - b.id);
      setDueDates(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch due dates');
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
        const data = await apiRequest<DueDateRule[]>('duedates/');
        if (!cancelled) {
          data.sort((a, b) => a.id - b.id);
          setDueDates(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch due dates');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setEditing({ ...INITIAL_EDITING });
    setShowAddForm(false);
  };

  const handleAddNew = () => {
    setEditing({
      ...INITIAL_EDITING,
      color: '#cccccc',
      direction: 'Before',
    });
    setShowAddForm(true);
  };

  const handleEdit = (d: DueDateRule) => {
    const offsetless = isOffsetlessPreset(d);
    setEditing({
      id: d.id,
      name: d.name,
      color: d.color,
      daysToDue: offsetless || d.days_to_due === null ? '' : String(d.days_to_due),
      direction: (d.by_default === 'Past' ? 'Past' : 'Before') as 'Before' | 'Past',
    });
    setShowAddForm(false);
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.name.trim()) return;

    const offsetless =
      editing.id !== null && dueDates.some((d) => d.id === editing.id && isOffsetlessPreset(d));

    try {
      if (editing.id === null) {
        const daysParsed = editing.daysToDue.trim() === '' ? 0 : parseInt(editing.daysToDue, 10);
        if (Number.isNaN(daysParsed) || daysParsed < 0) {
          setError('Days to due date must be a non-negative integer.');
          return;
        }
        const created = await apiRequest<DueDateRule>('duedates/', {
          method: 'POST',
          body: {
            name: editing.name.trim(),
            color: editing.color,
            days_to_due: daysParsed,
            by_default: editing.direction,
          },
        });
        setDueDates((prev) => [...prev, created].sort((a, b) => a.id - b.id));
      } else if (offsetless) {
        await apiRequest<DueDateRule>(`duedates/${editing.id}/`, {
          method: 'PUT',
          body: {
            name: editing.name.trim(),
            color: editing.color,
          },
        });
        await fetchDueDates();
      } else {
        const daysParsed = editing.daysToDue.trim() === '' ? 0 : parseInt(editing.daysToDue, 10);
        if (Number.isNaN(daysParsed) || daysParsed < 0) {
          setError('Days to due date must be a non-negative integer.');
          return;
        }
        await apiRequest<DueDateRule>(`duedates/${editing.id}/`, {
          method: 'PUT',
          body: {
            name: editing.name.trim(),
            color: editing.color,
            days_to_due: daysParsed,
            by_default: editing.direction,
          },
        });
        await fetchDueDates();
      }
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save due date');
    }
  };

  const handleDeleteClick = (d: DueDateRule) => {
    if (isOffsetlessPreset(d)) return;
    setPendingDelete(d);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await apiRequest(`duedates/${pendingDelete.id}/`, { method: 'DELETE' });
      setDueDates((prev) => prev.filter((x) => x.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete due date');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="settings-section-title">Due Dates</h1>
      <p className="settings-section-desc">
        Specify the due dates status your issues will go through if selected
      </p>

      {error && (
        <div className="set-error-banner">
          <span>{error}</span>
          <button type="button" className="set-error-dismiss" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="settings-header-bar">
        <span className="settings-header-label">Issue Due Date Status</span>
        <button type="button" className="settings-add-btn" onClick={handleAddNew}>
          ADD NEW STATUS
        </button>
      </div>

      <div className="duedates-grid-scroll">
        <div className="duedates-col-headers">
          <div />
          <div className="set-col-header">Color</div>
          <div className="set-col-header">Name</div>
          <div className="set-col-header">Days to due date</div>
          <div className="set-col-header">Before / Past</div>
          <div />
        </div>

        {loading ? (
          <div className="set-loading">Loading due dates...</div>
        ) : dueDates.length === 0 && !showAddForm ? (
          <div className="set-empty">No due dates defined.</div>
        ) : (
          dueDates.map((d) => {
            const isEditingThis = editing.id === d.id && !showAddForm;
            const offsetless = isOffsetlessPreset(d);
            return (
              <div
                key={d.id}
                className={`duedates-row${isEditingThis ? ' is-editing' : ''}`}
              >
                {isEditingThis ? (
                  <>
                    <div className="set-drag-handle" style={{ opacity: 0.45, cursor: 'default' }}>
                      ⋮⋮
                    </div>
                    <div />
                    <div style={{ gridColumn: '3 / span 4' }}>
                      <div className="set-inline-form" style={{ margin: 0 }}>
                        <p className="set-inline-form-title">Edit Due Date</p>
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
                            {!offsetless && (
                              <>
                                <div className="set-form-group">
                                  <label>Days to due date</label>
                                  <input
                                    type="number"
                                    className="set-form-number"
                                    min={0}
                                    value={editing.daysToDue}
                                    onChange={(e) =>
                                      setEditing((prev) => ({ ...prev, daysToDue: e.target.value }))
                                    }
                                  />
                                </div>
                                <div className="set-form-group">
                                  <label>Before / Past</label>
                                  <select
                                    className="set-form-select compact"
                                    value={editing.direction}
                                    onChange={(e) =>
                                      setEditing((prev) => ({
                                        ...prev,
                                        direction: e.target.value === 'Past' ? 'Past' : 'Before',
                                      }))
                                    }
                                  >
                                    <option value="Before">Before</option>
                                    <option value="Past">Past</option>
                                  </select>
                                </div>
                              </>
                            )}
                            <div className="set-form-actions">
                              <button type="submit" className="set-save-btn">
                                Save
                              </button>
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
                  <>
                    <div className="set-drag-handle" style={{ opacity: 0.45, cursor: 'default' }}>
                      ⋮⋮
                    </div>
                    <div>
                      <span className="set-color-swatch" style={{ backgroundColor: d.color }} />
                    </div>
                    <div className="set-name">{d.name}</div>
                    <div className="set-days-cell">
                      {!offsetless && d.days_to_due !== null ? d.days_to_due : ''}
                    </div>
                    <div className="set-direction-cell">
                      {!offsetless && d.days_to_due !== null ? d.by_default ?? 'Before' : ''}
                    </div>
                    <div className="set-actions">
                      <button
                        type="button"
                        className="set-action-btn edit"
                        title="Edit"
                        onClick={() => handleEdit(d)}
                      >
                        ✏
                      </button>
                      {!offsetless && (
                        <button
                          type="button"
                          className="set-action-btn delete"
                          title="Delete"
                          onClick={() => handleDeleteClick(d)}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {showAddForm && (
        <div style={{ padding: '12px 0 0 0' }}>
          <div className="set-inline-form">
            <p className="set-inline-form-title">New Status</p>
            <form onSubmit={handleSave}>
              <div className="set-form-row">
                <div className="set-form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    className="set-form-input"
                    placeholder="Status name"
                    value={editing.name}
                    required
                    onChange={(e) => setEditing((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="set-form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    className="set-form-color larger"
                    value={editing.color}
                    onChange={(e) => setEditing((prev) => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                <div className="set-form-group">
                  <label>Days to due date</label>
                  <input
                    type="number"
                    className="set-form-number"
                    min={0}
                    placeholder="e.g. 14"
                    value={editing.daysToDue}
                    onChange={(e) => setEditing((prev) => ({ ...prev, daysToDue: e.target.value }))}
                  />
                </div>
                <div className="set-form-group">
                  <label>Before / Past</label>
                  <select
                    className="set-form-select compact"
                    value={editing.direction}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        direction: e.target.value === 'Past' ? 'Past' : 'Before',
                      }))
                    }
                  >
                    <option value="Before">Before</option>
                    <option value="Past">Past</option>
                  </select>
                </div>
                <div className="set-form-actions">
                  <button type="submit" className="set-save-btn">
                    Add
                  </button>
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
        entityLabel="Due Date"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
};
