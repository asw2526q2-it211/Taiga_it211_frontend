import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../services/client';
import type { PriorityResource } from '../types/api';

/* ─── Estat intern per al formulari d'edició ─── */
interface EditingState {
  id: number | null;       // null = afegint, number = editant
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
 * Permet llistar, crear, editar i eliminar prioritats d'incidències
 * mitjançant l'API REST.
 */
export const PrioritySettings: React.FC = () => {
  const [priorities, setPriorities] = useState<PriorityResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estat del formulari inline (creació o edició)
  const [editing, setEditing] = useState<EditingState>({ ...INITIAL_EDITING });
  // Quan true, mostra el formulari de creació
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

  /* ── Estils ── */
  const s: Record<string, React.CSSProperties> = {
    sectionTitle: {
      fontSize: '22px', fontWeight: 600, color: '#009aa6', margin: '0 0 6px 0',
    },
    sectionDesc: {
      fontSize: '13.5px', color: '#8c8fa5', margin: '0 0 28px 0',
    },
    headerBar: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#d3d7e0', borderRadius: '3px 3px 0 0', padding: '10px 18px',
    },
    headerLabel: {
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: '#555770',
    },
    addBtn: {
      background: '#4dc1ae', color: '#fff', border: 'none', borderRadius: '3px',
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase', padding: '7px 14px', cursor: 'pointer',
    },
    colHeaders: {
      display: 'grid',
      gridTemplateColumns: '32px 80px 1fr 120px 120px',
      alignItems: 'center', padding: '10px 18px 10px 8px',
      borderBottom: '1px solid #e5e7ef',
    },
    colHeader: { fontSize: '12px', fontWeight: 700, color: '#555770' },
    row: {
      display: 'grid',
      gridTemplateColumns: '32px 80px 1fr 120px 120px',
      alignItems: 'center', padding: '10px 18px 10px 8px',
      borderBottom: '1px solid #edf0f5', transition: 'background 0.12s',
    },
    dragHandle: {
      color: '#bbbdd0', fontSize: '15px', textAlign: 'center', userSelect: 'none',
    },
    colorSwatch: {
      width: '36px', height: '26px', borderRadius: '4px',
      border: '1px solid rgba(0,0,0,0.1)', display: 'inline-block',
    },
    name: { fontSize: '14px', color: '#333' },
    defaultBadge: {
      display: 'inline-block', background: '#e6f9f7', color: '#009aa6',
      border: '1px solid #b0e8e2', borderRadius: '10px', fontSize: '11px',
      fontWeight: 700, padding: '2px 10px',
    },
    setDefaultBtn: {
      background: 'none', border: '1px solid #c5c8d8', borderRadius: '10px',
      fontSize: '11px', color: '#7a7d96', padding: '2px 10px', cursor: 'pointer',
    },
    actionBtn: {
      background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer',
      borderRadius: '3px', fontSize: '16px', lineHeight: '1',
      textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
    },
    inlineForm: {
      background: '#f5f7fb', border: '1px solid #d5d8e8', borderRadius: '4px',
      padding: '18px 20px', margin: '8px 0',
    },
    formTitle: {
      fontSize: '13px', fontWeight: 700, color: '#555770',
      textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px 0',
    },
    formRow: {
      display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap',
    },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    formLabel: {
      fontSize: '11px', fontWeight: 600, color: '#777',
      textTransform: 'uppercase', letterSpacing: '0.06em',
    },
    formInput: {
      border: '1px solid #ccc', borderRadius: '3px', padding: '6px 10px',
      fontSize: '13px', color: '#333', width: '180px',
    },
    formNumber: {
      border: '1px solid #ccc', borderRadius: '3px', padding: '6px 10px',
      fontSize: '13px', color: '#333', width: '80px',
    },
    formColor: {
      width: '48px', height: '34px', border: '1px solid #ccc',
      borderRadius: '3px', padding: '2px', cursor: 'pointer',
    },
    formCheckGroup: {
      display: 'flex', alignItems: 'center', gap: '8px',
      paddingBottom: '6px', fontSize: '13px', color: '#555',
    },
    formActions: {
      display: 'flex', gap: '8px', alignItems: 'center', paddingBottom: '2px',
    },
    saveBtn: {
      background: '#009aa6', color: '#fff', border: 'none', borderRadius: '3px',
      fontSize: '12px', fontWeight: 700, padding: '7px 18px', cursor: 'pointer',
      textTransform: 'uppercase', letterSpacing: '0.05em',
    },
    cancelLink: {
      fontSize: '12px', color: '#888', textDecoration: 'none',
      padding: '7px 6px', cursor: 'pointer', background: 'none', border: 'none',
    },
    actions: {
      display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center',
    },
    empty: { padding: '20px 18px', color: '#aaa', fontSize: '13px' },
    isEditingRow: { background: '#f0fafa', borderLeft: '3px solid #009aa6' },
  };

  return (
    <div>
      <h1 style={s.sectionTitle}>Priorities</h1>
      <p style={s.sectionDesc}>Specify the priorities your issues will have.</p>

      {error && (
        <div style={{
          color: '#e3405c', padding: '10px 14px', background: '#fce8eb',
          borderRadius: '4px', marginBottom: '16px', fontSize: '13px',
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: '12px', background: 'none', border: 'none',
              color: '#e3405c', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Header bar ── */}
      <div style={s.headerBar}>
        <span style={s.headerLabel}>Issue Priorities</span>
        <button style={s.addBtn} onClick={handleAddNew}>ADD NEW PRIORITY</button>
      </div>

      {/* ── Column headers ── */}
      <div style={s.colHeaders}>
        <div />
        <div style={s.colHeader}>Color</div>
        <div style={s.colHeader}>Name</div>
        <div style={s.colHeader}>Default</div>
        <div />
      </div>

      {/* ── Llistat ── */}
      {loading ? (
        <div style={{ padding: '24px 18px', color: '#888', fontSize: '13px' }}>
          Loading priorities...
        </div>
      ) : priorities.length === 0 && !showAddForm ? (
        <div style={s.empty}>No priorities defined yet.</div>
      ) : (
        priorities.map((p) => {
          const isEditingThis = editing.id === p.id && !showAddForm;
          return (
            <div
              key={p.id}
              style={{
                ...s.row,
                ...(isEditingThis ? s.isEditingRow : {}),
              }}
              onMouseEnter={(e) => {
                if (!isEditingThis) (e.currentTarget as HTMLElement).style.background = '#f0fafa';
              }}
              onMouseLeave={(e) => {
                if (!isEditingThis) (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              {isEditingThis ? (
                /* ── Formulari inline d'edició ── */
                <>
                  <div style={s.dragHandle}>⋮⋮</div>
                  <div />
                  <div style={{ gridColumn: '3 / span 3' }}>
                    <div style={{ ...s.inlineForm, margin: 0 }}>
                      <p style={s.formTitle}>Edit Priority</p>
                      <form onSubmit={handleSave}>
                        <div style={s.formRow}>
                          <div style={s.formGroup}>
                            <label style={s.formLabel}>Name</label>
                            <input
                              type="text"
                              style={s.formInput}
                              value={editing.name}
                              required
                              onChange={(e) =>
                                setEditing((prev) => ({ ...prev, name: e.target.value }))
                              }
                            />
                          </div>
                          <div style={s.formGroup}>
                            <label style={s.formLabel}>Color</label>
                            <input
                              type="color"
                              style={s.formColor}
                              value={editing.color}
                              onChange={(e) =>
                                setEditing((prev) => ({ ...prev, color: e.target.value }))
                              }
                            />
                          </div>
                          <div style={s.formGroup}>
                            <label style={s.formLabel}>Order</label>
                            <input
                              type="number"
                              style={s.formNumber}
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
                          <div style={s.formCheckGroup}>
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
                            <label
                              htmlFor="edit-default-check"
                              style={{
                                textTransform: 'none', letterSpacing: 0,
                                fontSize: '13px', color: '#555',
                              }}
                            >
                              Set as default
                            </label>
                          </div>
                          <div style={s.formActions}>
                            <button type="submit" style={s.saveBtn}>Save</button>
                            <button type="button" style={s.cancelLink} onClick={handleCancel}>
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
                  <div style={s.dragHandle}>⋮⋮</div>
                  <div>
                    <span style={{ ...s.colorSwatch, backgroundColor: p.color }} />
                  </div>
                  <div style={s.name}>{p.name}</div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '12px', color: '#555',
                  }}>
                    {p.is_default ? (
                      <span style={s.defaultBadge}>Default</span>
                    ) : (
                      <button style={s.setDefaultBtn} onClick={() => handleSetDefault(p)}>
                        Set default
                      </button>
                    )}
                  </div>
                  <div style={s.actions}>
                    <button
                      style={{ ...s.actionBtn, color: '#7a7d96' }}
                      title="Edit"
                      onClick={() => handleEdit(p)}
                    >
                      ✏
                    </button>
                    <button
                      style={{ ...s.actionBtn, color: '#e05c5c' }}
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

      {/* ── Formulari de creació ── */}
      {showAddForm && (
        <div style={{ padding: '12px 0 0 0' }}>
          <div style={s.inlineForm}>
            <p style={s.formTitle}>New Priority</p>
            <form onSubmit={handleSave}>
              <div style={s.formRow}>
                <div style={s.formGroup}>
                  <label style={s.formLabel}>Name</label>
                  <input
                    type="text"
                    style={s.formInput}
                    placeholder="Priority name"
                    value={editing.name}
                    required
                    onChange={(e) =>
                      setEditing((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.formLabel}>Color</label>
                  <input
                    type="color"
                    style={s.formColor}
                    value={editing.color}
                    onChange={(e) =>
                      setEditing((prev) => ({ ...prev, color: e.target.value }))
                    }
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.formLabel}>Order</label>
                  <input
                    type="number"
                    style={s.formNumber}
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
                <div style={s.formCheckGroup}>
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
                  <label
                    htmlFor="add-default-check"
                    style={{
                      textTransform: 'none', letterSpacing: 0,
                      fontSize: '13px', color: '#555',
                    }}
                  >
                    Set as default
                  </label>
                </div>
                <div style={s.formActions}>
                  <button type="submit" style={s.saveBtn}>Add</button>
                  <button type="button" style={s.cancelLink} onClick={handleCancel}>
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
