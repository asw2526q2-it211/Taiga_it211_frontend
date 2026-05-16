import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../services/client';
import type { StatusResource } from '../types/api';

/* ─── Estat intern per al formulari d'edició ─── */
interface EditingState {
  id: number | null;       // null = afegint, number = editant
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
 * Permet llistar, crear, editar i eliminar estats d'incidències
 * mitjançant l'API REST.
 */
export const StatusSettings: React.FC = () => {
  const [statuses, setStatuses] = useState<StatusResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<EditingState>({ ...INITIAL_EDITING });
  const [showAddForm, setShowAddForm] = useState(false);

  /* ── Carregar llistat ── */
  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<StatusResource[]>('statuses/');
      // Ordenar per ordre ascendent
      data.sort((a, b) => a.order - b.order);
      setStatuses(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statuses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

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
        // Crear
        const created = await apiRequest<StatusResource>('statuses/', {
          method: 'POST',
          body: {
            name: editing.name.trim(),
            color: editing.color,
            order: editing.order,
            closed: editing.closed,
            is_default: editing.is_default,
          },
        });
        setStatuses((prev) => [...prev, created].sort((a, b) => a.order - b.order));
      } else {
        // Actualitzar
        const updated = await apiRequest<StatusResource>(`statuses/${editing.id}/`, {
          method: 'PUT',
          body: {
            name: editing.name.trim(),
            color: editing.color,
            order: editing.order,
            closed: editing.closed,
            is_default: editing.is_default,
          },
        });
        setStatuses((prev) =>
          prev
            .map((s) => (s.id === editing.id ? { ...s, ...updated } : s))
            .filter(
              // Si s'ha canviat el default, actualitzem tots
              (s) => {
                if (editing.is_default && s.id !== editing.id) {
                  return { ...s, is_default: false };
                }
                return s;
              },
            )
            .sort((a, b) => a.order - b.order),
        );
        // Forcem re-fetch per assegurar consistència (sobretot per l'ordre i el default)
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
  const handleDelete = async (st: StatusResource) => {
    if (!window.confirm(`Are you sure you want to delete "${st.name}"?`)) return;
    try {
      await apiRequest(`statuses/${st.id}/`, { method: 'DELETE' });
      setStatuses((prev) => prev.filter((s) => s.id !== st.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete status');
    }
  };

  /* ── Estils (inline per consistència amb el projecte) ── */
  const styles: Record<string, React.CSSProperties> = {
    sectionTitle: {
      fontSize: '22px',
      fontWeight: 600,
      color: '#009aa6',
      margin: '0 0 6px 0',
    },
    sectionDesc: {
      fontSize: '13.5px',
      color: '#8c8fa5',
      margin: '0 0 28px 0',
    },
    headerBar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#d3d7e0',
      borderRadius: '3px 3px 0 0',
      padding: '10px 18px',
    },
    headerLabel: {
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      color: '#555770',
    },
    addBtn: {
      background: '#4dc1ae',
      color: '#fff',
      border: 'none',
      borderRadius: '3px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase' as const,
      padding: '7px 14px',
      cursor: 'pointer',
    },
    colHeaders: {
      display: 'grid',
      gridTemplateColumns: '32px 70px 150px 70px 150px 120px 1fr 100px',
      alignItems: 'center',
      padding: '10px 18px 10px 8px',
      borderBottom: '1px solid #e5e7ef',
    },
    colHeader: {
      fontSize: '12px',
      fontWeight: 700,
      color: '#000',
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '32px 70px 150px 70px 150px 120px 1fr 100px',
      alignItems: 'center',
      padding: '10px 18px 10px 8px',
      borderBottom: '1px solid #edf0f5',
      transition: 'background 0.12s',
    },
    dragHandle: {
      color: '#bbbdd0',
      fontSize: '15px',
      textAlign: 'center' as const,
      userSelect: 'none' as const,
    },
    colorSwatch: {
      width: '36px',
      height: '26px',
      borderRadius: '4px',
      border: '1px solid rgba(0,0,0,0.1)',
      display: 'inline-block',
      verticalAlign: 'middle' as const,
    },
    name: { fontSize: '14px', color: '#333' },
    slug: { fontSize: '14px', color: '#333' },
    defaultBadge: {
      display: 'inline-block',
      background: '#e6f9f7',
      color: '#009aa6',
      border: '1px solid #b0e8e2',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: 700,
      padding: '2px 10px',
    },
    setDefaultBtn: {
      background: 'none',
      border: '1px solid #c5c8d8',
      borderRadius: '10px',
      fontSize: '11px',
      color: '#7a7d96',
      padding: '2px 10px',
      cursor: 'pointer',
    },
    actionBtn: {
      background: 'none',
      border: 'none',
      padding: '4px 6px',
      cursor: 'pointer',
      borderRadius: '3px',
      fontSize: '16px',
      lineHeight: '1' as const,
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
    },
    closedIcon: {
      width: '18px',
      height: '18px',
      color: '#009aa6',
      border: '1px solid #009aa6',
      borderRadius: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inlineForm: {
      background: '#f5f7fb',
      border: '1px solid #d5d8e8',
      borderRadius: '4px',
      padding: '18px 24px',
      margin: '8px 0',
    },
    formTitle: {
      fontSize: '13px',
      fontWeight: 700,
      color: '#555770',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
      margin: '0 0 14px 0',
    },
    formRow: {
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-end',
      flexWrap: 'wrap' as const,
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    },
    formLabel: {
      fontSize: '11px',
      fontWeight: 600,
      color: '#777',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
    },
    formInput: {
      border: '1px solid #ccc',
      borderRadius: '3px',
      padding: '6px 10px',
      fontSize: '13px',
      color: '#333',
    },
    formNumber: {
      width: '60px',
      border: '1px solid #ccc',
      borderRadius: '3px',
      padding: '6px 10px',
      fontSize: '13px',
      color: '#333',
    },
    formSelect: {
      border: '1px solid #ccc',
      borderRadius: '3px',
      padding: '6px 10px',
      fontSize: '13px',
      color: '#333',
      width: '80px',
    },
    formColor: {
      width: '44px',
      height: '34px',
      border: '1px solid #ccc',
      borderRadius: '3px',
      padding: '2px',
      cursor: 'pointer',
    },
    formCheckGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      paddingBottom: '10px',
      fontSize: '13px',
      color: '#555',
    },
    formActions: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      paddingBottom: '2px',
    },
    saveBtn: {
      background: '#009aa6',
      color: '#fff',
      border: 'none',
      borderRadius: '3px',
      fontSize: '12px',
      fontWeight: 700,
      padding: '7px 18px',
      cursor: 'pointer',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    cancelLink: {
      fontSize: '12px',
      color: '#888',
      textDecoration: 'none',
      padding: '7px 6px',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
    },
    actions: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    empty: {
      padding: '20px 18px',
      color: '#aaa',
      fontSize: '13px',
    },
    isEditingRow: {
      background: '#f0fafa',
      borderLeft: '3px solid #009aa6',
    },
  };

  return (
    <div>
      {/* ── Responsive styles ── */}
      <style>{`
        .statuses-grid-wrapper {
          min-width: 0;
        }

        .statuses-col-headers,
        .statuses-row {
          display: grid;
          grid-template-columns: 32px 70px 150px 70px 150px 120px 1fr 100px;
          align-items: center;
        }

        .statuses-col-headers {
          padding: 10px 18px 10px 8px;
          border-bottom: 1px solid #e5e7ef;
        }

        .statuses-row {
          padding: 10px 18px 10px 8px;
          border-bottom: 1px solid #edf0f5;
          transition: background 0.12s;
        }

        /* Scrollable on small screens */
        @media (max-width: 900px) {
          .statuses-grid-scroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            margin: 0 -16px;
            padding: 0 16px;
          }

          .statuses-col-headers,
          .statuses-row {
            min-width: 692px;
          }
        }

        @media (max-width: 480px) {
          .statuses-grid-scroll {
            margin: 0 -12px;
            padding: 0 12px;
          }
        }
      `}</style>

      <h1 style={styles.sectionTitle}>Statuses</h1>
      <p style={styles.sectionDesc}>Add, remove or edit the name of the issue statuses.</p>

      {error && (
        <div
          style={{
            color: '#e3405c',
            padding: '10px 14px',
            background: '#fce8eb',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '13px',
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: '12px',
              background: 'none',
              border: 'none',
              color: '#e3405c',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Header bar ── */}
      <div style={styles.headerBar}>
        <span style={styles.headerLabel}>Issue Statuses</span>
        <button style={styles.addBtn} onClick={handleAddNew}>
          ADD NEW STATUS
        </button>
      </div>

      {/* ── Column headers + Rows wrapped in scrollable container ── */}
      <div className="statuses-grid-scroll">
        {/* ── Column headers ── */}
        <div className="statuses-col-headers">
          <div />
          <div style={{ ...styles.colHeader, textAlign: 'center' as const }}>Color</div>
          <div style={styles.colHeader}>Name</div>
          <div style={{ ...styles.colHeader, textAlign: 'center' as const }}>Order</div>
          <div style={styles.colHeader}>Slug</div>
          <div style={styles.colHeader}>Default</div>
          <div style={{ ...styles.colHeader, textAlign: 'center' as const }}>Is closed?</div>
          <div />
        </div>

        {/* ── Llistat ── */}
        {loading ? (
          <div style={{ padding: '24px 18px', color: '#888', fontSize: '13px' }}>Loading statuses...</div>
        ) : statuses.length === 0 && !showAddForm ? (
          <div style={styles.empty}>No statuses defined yet.</div>
        ) : (
          statuses.map((st) => {
            const isEditingThis = editing.id === st.id && !showAddForm;
            return (
              <div
                key={st.id}
                className={`statuses-row${isEditingThis ? ' is-editing' : ''}`}
                style={{
                  ...(isEditingThis ? styles.isEditingRow : {}),
                }}
                onMouseEnter={(e) => {
                  if (!isEditingThis) {
                  (e.currentTarget as HTMLElement).style.background = '#f0fafa';
                }
              }}
              onMouseLeave={(e) => {
                if (!isEditingThis) {
                  (e.currentTarget as HTMLElement).style.background = '';
                }
              }}
            >
              {isEditingThis ? (
                /* ── Formulari inline d'edició ── */
                <>
                  <div style={styles.dragHandle}>⋮⋮</div>
                  <div />
                  <div style={{ gridColumn: '3 / -1' }}>
                    <div style={{ ...styles.inlineForm, margin: 0 }}>
                      <p style={styles.formTitle}>Edit Status</p>
                      <form onSubmit={handleSave}>
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Color</label>
                            <input
                              type="color"
                              style={styles.formColor}
                              value={editing.color}
                              onChange={(e) =>
                                setEditing((prev) => ({ ...prev, color: e.target.value }))
                              }
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Name</label>
                            <input
                              type="text"
                              style={{ ...styles.formInput, width: '140px' }}
                              value={editing.name}
                              required
                              onChange={(e) =>
                                setEditing((prev) => ({ ...prev, name: e.target.value }))
                              }
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Order</label>
                            <input
                              type="number"
                              style={styles.formNumber}
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
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Is closed?</label>
                            <select
                              style={styles.formSelect}
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
                          <div style={styles.formCheckGroup}>
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
                                textTransform: 'none',
                                letterSpacing: 0,
                                fontSize: '13px',
                                color: '#555',
                              }}
                            >
                              Set as default
                            </label>
                          </div>
                          <div style={styles.formActions}>
                            <button type="submit" style={styles.saveBtn}>
                              Save
                            </button>
                            <button
                              type="button"
                              style={styles.cancelLink}
                              onClick={handleCancel}
                            >
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
                  <div style={styles.dragHandle}>⋮⋮</div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ ...styles.colorSwatch, backgroundColor: st.color }} />
                  </div>
                  <div style={styles.name}>{st.name}</div>
                  <div style={{ textAlign: 'center', fontSize: '14px', color: '#333' }}>
                    {st.order}
                  </div>
                  <div style={styles.slug}>{st.slug}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555' }}>
                    {st.is_default ? (
                      <span style={styles.defaultBadge}>Default</span>
                    ) : (
                      <button
                        style={styles.setDefaultBtn}
                        onClick={() => handleSetDefault(st)}
                      >
                        Set default
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {st.closed && (
                      <div style={styles.closedIcon}>
                        <svg
                          style={{ width: '14px', height: '14px', fill: 'none', stroke: 'currentColor', strokeWidth: 3 }}
                          viewBox="0 0 24 24"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div style={styles.actions}>
                    <button
                      style={{ ...styles.actionBtn, color: '#7a7d96' }}
                      title="Edit"
                      onClick={() => handleEdit(st)}
                    >
                      ✏
                    </button>
                    <button
                      style={{ ...styles.actionBtn, color: '#e05c5c' }}
                      title="Delete"
                      onClick={() => handleDelete(st)}
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
          <div style={styles.inlineForm}>
            <p style={styles.formTitle}>New Status</p>
            <form onSubmit={handleSave}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Color</label>
                  <input
                    type="color"
                    style={styles.formColor}
                    value={editing.color}
                    onChange={(e) =>
                      setEditing((prev) => ({ ...prev, color: e.target.value }))
                    }
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Name</label>
                  <input
                    type="text"
                    style={{ ...styles.formInput, width: '140px' }}
                    placeholder="Name"
                    value={editing.name}
                    required
                    onChange={(e) =>
                      setEditing((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Order</label>
                  <input
                    type="number"
                    style={styles.formNumber}
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
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Is closed?</label>
                  <select
                    style={styles.formSelect}
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
                <div style={styles.formCheckGroup}>
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
                      textTransform: 'none',
                      letterSpacing: 0,
                      fontSize: '13px',
                      color: '#555',
                    }}
                  >
                    Set as default
                  </label>
                </div>
                <div style={styles.formActions}>
                  <button type="submit" style={styles.saveBtn}>
                    Add
                  </button>
                  <button
                    type="button"
                    style={styles.cancelLink}
                    onClick={handleCancel}
                  >
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
