import React, { useEffect, useState } from 'react';
import { apiRequest } from '../services/client';
import type { TagSettingResource } from '../types/api';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import '../styles/settings.css';

interface EditingState {
  id: number | null;
  name: string;
  color: string;
}

const INITIAL_EDITING: EditingState = {
  id: null,
  name: '',
  color: '#4dc1ae',
};

/**
 * Gestió d'etiquetes (equivalent a tags/tags.html).
 */
export const TagSettings: React.FC = () => {
  const [tags, setTags] = useState<TagSettingResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<EditingState>({ ...INITIAL_EDITING });
  const [showAddForm, setShowAddForm] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<number | null>(null);
  const [mergeSourceIds, setMergeSourceIds] = useState<Set<number>>(new Set());
  const [merging, setMerging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TagSettingResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTags = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<TagSettingResource[]>('tags/');
      data.sort((a, b) => a.name.localeCompare(b.name));
      setTags(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tags');
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
        const data = await apiRequest<TagSettingResource[]>('tags/');
        if (!cancelled) {
          data.sort((a, b) => a.name.localeCompare(b.name));
          setTags(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch tags');
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
    setEditing({ ...INITIAL_EDITING });
    setShowAddForm(true);
    setMergeTargetId(null);
    setMergeSourceIds(new Set());
  };

  const handleEdit = (tag: TagSettingResource) => {
    setEditing({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    });
    setShowAddForm(false);
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.name.trim()) return;

    try {
      if (editing.id === null) {
        const created = await apiRequest<TagSettingResource>('tags/', {
          method: 'POST',
          body: {
            name: editing.name.trim(),
            color: editing.color,
          },
        });
        setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        await apiRequest<TagSettingResource>(`tags/${editing.id}/`, {
          method: 'PUT',
          body: {
            name: editing.name.trim(),
            color: editing.color,
          },
        });
        await fetchTags();
      }
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save tag');
    }
  };

  const handleDeleteClick = (tag: TagSettingResource) => {
    setPendingDelete(tag);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await apiRequest(`tags/${pendingDelete.id}/`, { method: 'DELETE' });
      setTags((prev) => prev.filter((t) => t.id !== pendingDelete.id));
      if (mergeTargetId === pendingDelete.id) {
        setMergeTargetId(null);
        setMergeSourceIds(new Set());
      } else {
        setMergeSourceIds((prev) => {
          const next = new Set(prev);
          next.delete(pendingDelete.id);
          return next;
        });
      }
      setPendingDelete(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartMerge = (tag: TagSettingResource) => {
    resetForm();
    setMergeTargetId(tag.id);
    setMergeSourceIds(new Set());
  };

  const handleCancelMerge = () => {
    setMergeTargetId(null);
    setMergeSourceIds(new Set());
  };

  const handleToggleMergeSource = (tagId: number) => {
    setMergeSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const handleMergeSubmit = async () => {
    if (mergeTargetId === null) return;
    const sources = Array.from(mergeSourceIds);
    if (sources.length === 0) {
      setError('Select at least one tag to merge.');
      return;
    }

    setMerging(true);
    setError(null);
    try {
      await apiRequest(`tags/${mergeTargetId}/merge`, {
        method: 'POST',
        body: { merge_source: sources },
      });
      setMergeTargetId(null);
      setMergeSourceIds(new Set());
      await fetchTags();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to merge tags');
    } finally {
      setMerging(false);
    }
  };

  const renderTagForm = (submitLabel: string) => (
    <div className="set-form-row">
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
        <label>Name</label>
        <input
          type="text"
          className="set-form-input wide"
          placeholder="Tag name"
          value={editing.name}
          required
          onChange={(e) => setEditing((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>
      <div className="set-form-actions">
        <button type="submit" className="set-save-btn">
          {submitLabel}
        </button>
        <button type="button" className="set-cancel-link" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="settings-section-title">Tags</h1>
      <p className="settings-section-desc">View and edit the color of your tags</p>

      {error && (
        <div className="set-error-banner">
          <span>{error}</span>
          <button className="set-error-dismiss" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="settings-header-bar">
        <span className="settings-header-label">Tags</span>
        {!mergeTargetId && (
          <button className="settings-add-btn" onClick={handleAddNew}>
            NEW TAG
          </button>
        )}
      </div>

      <div className="tags-grid-scroll">
        <div className="tags-col-headers">
          <div className="set-col-header">Color</div>
          <div className="set-col-header">Name</div>
          <div />
        </div>

        {loading ? (
          <div className="set-loading">Loading tags...</div>
        ) : tags.length === 0 && !showAddForm ? (
          <div className="set-empty">No tags defined.</div>
        ) : (
          tags.map((tag) => {
            const isEditingThis = editing.id === tag.id && !showAddForm;
            const isMergeTarget = mergeTargetId === tag.id;
            const rowClass = [
              'tags-row',
              isEditingThis ? 'is-editing' : '',
              isMergeTarget ? 'is-merge-target' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div key={tag.id} className={rowClass}>
                {isEditingThis ? (
                  <div style={{ gridColumn: '1 / span 3' }}>
                    <div className="set-inline-form" style={{ margin: 0 }}>
                      <p className="set-inline-form-title">Edit Tag</p>
                      <form onSubmit={handleSave}>{renderTagForm('Save')}</form>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="tags-color-swatch" style={{ backgroundColor: tag.color }} />
                    </div>
                    <div className="set-name">{tag.name}</div>
                    <div className="set-actions">
                      {mergeTargetId !== null ? (
                        isMergeTarget ? (
                          <>
                            <span className="tags-merge-hint">
                              Select the tags that you want to merge
                            </span>
                            <button
                              type="button"
                              className="set-merge-btn"
                              disabled={merging || mergeSourceIds.size === 0}
                              onClick={handleMergeSubmit}
                            >
                              {merging ? 'Merging…' : 'Merge tags'}
                            </button>
                            <button
                              type="button"
                              className="set-cancel-link"
                              onClick={handleCancelMerge}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <input
                            type="checkbox"
                            className="tags-merge-checkbox"
                            checked={mergeSourceIds.has(tag.id)}
                            onChange={() => handleToggleMergeSource(tag.id)}
                            aria-label={`Merge into ${tags.find((t) => t.id === mergeTargetId)?.name}`}
                          />
                        )
                      ) : (
                        <>
                          <button
                            type="button"
                            className="set-action-btn merge"
                            title="Merge Tag"
                            onClick={() => handleStartMerge(tag)}
                          >
                            ⤤
                          </button>
                          <button
                            type="button"
                            className="set-action-btn edit"
                            title="Edit"
                            onClick={() => handleEdit(tag)}
                          >
                            ✏
                          </button>
                          <button
                            type="button"
                            className="set-action-btn delete"
                            title="Delete"
                            onClick={() => handleDeleteClick(tag)}
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {showAddForm && !mergeTargetId && (
        <div style={{ padding: '12px 0 0 0' }}>
          <div className="set-inline-form">
            <p className="set-inline-form-title">New Tag</p>
            <form onSubmit={handleSave}>{renderTagForm('Add')}</form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={pendingDelete !== null}
        itemName={pendingDelete?.name ?? ''}
        entityLabel="Tag"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
};
