import React, { useEffect, useState } from 'react';
import '../styles/issue-detail.css';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/client';
import { env } from '../config/env';
import type { Attachment, DetailedIssue, Issue, StatusItem, TypeItem, SeverityItem, PriorityItem, UserResource } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { UserSelectionModal } from '../components/UserSelectionModal';
import { UserProfileLink } from '../components/UserProfileLink';

export const IssueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, profile: ownProfile } = useAuth();
  
  const [issue, setIssue] = useState<DetailedIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Options for dropdowns
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [types, setTypes] = useState<TypeItem[]>([]);
  const [severities, setSeverities] = useState<SeverityItem[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [users, setUsers] = useState<UserResource[]>([]);
  const [globalTags, setGlobalTags] = useState<{ id: number; name: string; color: string }[]>([]);
  const [dueDates, setDueDates] = useState<{ id: number; name: string; color: string; days_to_due: number | null; by_default: string }[]>([]);

  // Local UI State
  const [activeTab, setActiveTab] = useState<'comments' | 'activities'>('comments');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState('');
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagColor, setTagColor] = useState('#14a38e');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState('');

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isWatchersModalOpen, setIsWatchersModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('Dependencies not met');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Helper to get avatar URL for a username
  const getUserAvatar = (username: string | null) => {
    if (!username) return null;
    const user = users.find(u => u.username === username);
    if (!user || !user.avatar) return null;
    
    // Si la URL és relativa (comença amb /media), li posem el host del backend
    if (user.avatar.startsWith('/')) {
      return `https://taiga-it211.onrender.com${user.avatar}`;
    }
    return user.avatar;
  };

  const getUserDisplayName = (username: string) => {
    const u = users.find(user => user.username === username);
    if (u && (u.first_name || u.last_name)) {
      return `${u.first_name || ''} ${u.last_name || ''}`.trim();
    }
    return username;
  };

  const formatActivityDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  };

  const formatActivity = (act: { field: string; old: string | null; new: string | null }) => {
    let badge: string;
    let text: string;

    if (act.field === 'comment_added') {
      badge = 'comment added';
      text = act.new || '';
    } else if (act.field === 'comment_edited') {
      badge = 'comment edited';
      text = act.new || '';
    } else if (act.field === 'comment_deleted') {
      badge = 'comment deleted';
      text = act.old || '';
    } else if (act.field === 'tags_added') {
      badge = 'tag added';
      text = act.new || '';
    } else if (act.field === 'tags_removed') {
      badge = 'tag removed';
      text = act.old || '';
    } else if (act.field === 'attachment_added') {
      badge = 'attachment added';
      text = act.new || '';
    } else if (act.field === 'attachment_deleted') {
      badge = 'attachment deleted';
      text = act.old || '';
    } else {
      badge = `${act.field} changed`;
      const oldVal = act.old || 'none';
      const newVal = act.new || 'none';
      text = `from ${oldVal} to ${newVal}`;
    }

    return { badge, text };
  };

  const getAttachmentName = (attachment: Attachment) => {
    if (!attachment.file) return `attachment-${attachment.id}`;

    try {
      const url = new URL(attachment.file, window.location.origin);
      const filename = url.pathname.split('/').filter(Boolean).pop();
      return filename ? decodeURIComponent(filename) : `attachment-${attachment.id}`;
    } catch {
      const filename = attachment.file.split('?')[0].split('/').filter(Boolean).pop();
      return filename ? decodeURIComponent(filename) : `attachment-${attachment.id}`;
    }
  };

  const getAttachmentDownloadUrl = (attachment: Attachment) =>
    `${env.backendOrigin}/attachments/${attachment.id}/download/`;

  const handleDownloadAttachment = (attachment: Attachment) => {
    window.location.href = getAttachmentDownloadUrl(attachment);
  };

  const fetchAllData = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [issueData, statusData, typeData, sevData, prioData, userData, tagsData, dueDatesData] = await Promise.all([
        apiRequest<DetailedIssue>(`issues/${id}`),
        apiRequest<StatusItem[]>('statuses'),
        apiRequest<TypeItem[]>('types'),
        apiRequest<SeverityItem[]>('severities'),
        apiRequest<PriorityItem[]>('priorities'),
        apiRequest<UserResource[]>('users'),
        apiRequest<{ id: number; name: string; color: string }[]>('tags'),
        apiRequest<{ id: number; name: string; color: string; days_to_due: number | null; by_default: string }[]>('duedates')
      ]);

      // El detall no sempre inclou created_at (API antiga); el llistat sí.
      let enrichedIssue = issueData;
      if (!issueData.created_at) {
        try {
          const listMatch = await apiRequest<Issue[]>('issues', { params: { id } });
          const fromList = listMatch.find((item) => item.id === Number(id));
          if (fromList?.created_at) {
            enrichedIssue = { ...issueData, created_at: fromList.created_at };
          }
        } catch {
          // Si falla el fallback, es mostra el detall sense data de creació.
        }
      }

      setIssue(enrichedIssue);
      setStatuses(statusData);
      setTypes(typeData);
      setSeverities(sevData);
      setPriorities(prioData);
      setUsers(userData);
      setGlobalTags(tagsData);
      setDueDates(dueDatesData);
      setDescInput(enrichedIssue.description || '');
      setSubjectInput(enrichedIssue.subject || '');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issue details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line
    fetchAllData();
  }, [fetchAllData, currentUser]);

  // Handlers for API Actions
  const handleUpdateField = async (field: string, value: string | number | boolean | null) => {
    if (!issue) return;
    try {
      const updated = await apiRequest<DetailedIssue>(`issues/${issue.id}`, {
        method: 'PUT',
        body: { [field]: value }
      });
      setIssue(updated);
    } catch (error) {
      console.error(error);
      alert('Error updating issue');
    }
  };

  const handleAddTag = async (tagName: string, selectedColor: string) => {
    if (!issue) return;
    const trimmed = tagName.trim();
    if (!trimmed) return;
    
    try {
      // Check if tag already exists globally
      const existingTag = globalTags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
      
      if (existingTag) {
        // If it exists but has a different color, update its color globally
        if (existingTag.color !== selectedColor) {
          await apiRequest(`tags/${existingTag.id}`, {
            method: 'PUT',
            body: { color: selectedColor }
          });
        }
      } else {
        // Create the tag globally first
        await apiRequest('tags', {
          method: 'POST',
          body: { name: trimmed, color: selectedColor }
        });
      }
      
      // Associate the tag with the issue (only if it wasn't already in the issue's tags)
      if (!issue.tags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
        const newTagsList = [...issue.tags.map(t => t.name), trimmed];
        const updated = await apiRequest<DetailedIssue>(`issues/${issue.id}`, {
          method: 'PUT',
          body: { tags: newTagsList }
        });
        setIssue(updated);
      }
      
      // Refresh global tags and issue details
      fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Error adding tag');
    }
  };

  const handleRemoveTag = async (tagNameToRemove: string) => {
    if (!issue) return;
    const newTagsList = issue.tags.map(t => t.name).filter(t => t !== tagNameToRemove);
    try {
      const updated = await apiRequest<DetailedIssue>(`issues/${issue.id}`, {
        method: 'PUT',
        body: { tags: newTagsList }
      });
      setIssue(updated);
    } catch (error) {
      console.error(error);
      alert('Error removing tag');
    }
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!issue) return;
    try {
      await apiRequest(`issues/${issue.id}`, { method: 'DELETE' });
      setIsDeleteModalOpen(false);
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Forbidden: Only the creator can delete this issue.');
    }
  };

  const handleToggleBlock = async () => {
    if (!issue) return;
    try {
      if (issue.blocked) {
        await apiRequest(`issues/${issue.id}/unblock`, { method: 'POST' });
        fetchAllData(); // Refresh to get activities and exact state
      } else {
        setIsBlockModalOpen(true);
      }
    } catch (error) {
      console.error(error);
      alert('Error changing block status');
    }
  };

  const handleBlockConfirm = async () => {
    if (!issue) return;
    try {
      await apiRequest(`issues/${issue.id}/block`, { 
        method: 'POST',
        body: { reason: blockReason }
      });
      setIsBlockModalOpen(false);
      fetchAllData(); // Refresh to get activities and exact state
    } catch (error) {
      console.error(error);
      alert('Error blocking issue');
    }
  };

  const handleDueDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!issue) return;
    const dateStr = e.target.value;
    try {
      if (dateStr) {
        await apiRequest(`issues/${issue.id}/duedate`, {
          method: 'POST',
          body: { duedate: dateStr, reason: 'Updated via UI' }
        });
      } else {
        // Remove due date (using PUT fallback)
        await handleUpdateField('duedate', null);
      }
      fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Error updating due date');
    }
  };

  const handleAssignUser = async (selectedUsers: string[]) => {
    if (!issue) return;
    const username = selectedUsers.length > 0 ? selectedUsers[0] : null;
    try {
      if (username) {
        await apiRequest(`issues/${issue.id}/assigned`, {
          method: 'PUT',
          body: { username }
        });
      } else {
        await handleUpdateField('assigned', null);
      }
      fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Error assigning user');
    }
  };

  const handleWatchersChange = async (selectedWatchers: string[]) => {
    if (!issue) return;
    try {
      await apiRequest(`issues/${issue.id}/watchers`, {
        method: 'PUT',
        body: { watchers: selectedWatchers }
      });
      fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Error updating watchers');
    }
  };

  const handleRemoveWatcher = async (usernameToRemove: string) => {
    if (!issue) return;
    const currentWatchers = issue.watchers.map(w => w.username).filter(u => u !== usernameToRemove);
    try {
      await apiRequest(`issues/${issue.id}/watchers`, {
        method: 'PUT',
        body: { watchers: currentWatchers }
      });
      fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Error removing watcher');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!issue || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('attachments', file);

    try {
      await apiRequest(`issues/${issue.id}`, {
        method: 'PUT',
        body: formData,
        headers: {} // Let browser set multipart/form-data with boundaries
      });
      fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Error uploading file');
    }
  };
  
  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!issue) return;
    try {
      await apiRequest(`issues/${issue.id}/attachments/${attachmentId}`, { method: 'DELETE' });
      fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Forbidden: Cannot delete attachment');
    }
  };

  const handlePostComment = async () => {
    if (!issue || !newComment.trim()) return;
    try {
      await apiRequest(`issues/${issue.id}/comments`, {
        method: 'POST',
        body: { text: newComment }
      });
      setNewComment('');
      fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Error posting comment');
    }
  };

  const handleStartEditComment = (commentId: number, text: string) => {
    setEditingCommentId(commentId);
    setCommentDraft(text);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setCommentDraft('');
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!issue || !commentDraft.trim()) return;
    try {
      await apiRequest(`issues/${issue.id}/comments/${commentId}`, {
        method: 'PUT',
        body: { text: commentDraft }
      });
      handleCancelEditComment();
      fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Forbidden: Only the comment creator can edit this comment.');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!issue) return;
    try {
      await apiRequest(`issues/${issue.id}/comments/${commentId}`, { method: 'DELETE' });
      if (editingCommentId === commentId) {
        handleCancelEditComment();
      }
      fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Forbidden: Only the comment creator can delete this comment.');
    }
  };

  if (loading) return <div className="issue-loading">Carregant detall de la incidència...</div>;
  if (error || !issue) return <div className="issue-error">Error: {error || 'Issue not found'}</div>;

  return (
    <div className="issue-detail-layout">
      {/* Columna Esquerra: Contingut Principal */}
      <div className="issue-main-content">
        <Link to="/" className="issue-detail-breadcrumb">
          ← Back to issues
        </Link>
        
        <div className="issue-detail-header" onDoubleClick={() => setIsEditingSubject(true)}>
          <span className="issue-detail-id">#{issue.id}</span>
          {isEditingSubject ? (
            <div className="issue-detail-subject-edit">
              <input
                type="text"
                className="issue-detail-subject-input"
                value={subjectInput}
                onChange={e => setSubjectInput(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleUpdateField('subject', subjectInput);
                    setIsEditingSubject(false);
                  } else if (e.key === 'Escape') {
                    setIsEditingSubject(false);
                    setSubjectInput(issue.subject);
                  }
                }}
              />
              <button 
                onClick={() => { handleUpdateField('subject', subjectInput); setIsEditingSubject(false); }} 
                className="issue-btn-compact primary"
              >
                Save
              </button>
              <button 
                onClick={() => { setIsEditingSubject(false); setSubjectInput(issue.subject); }} 
                className="issue-btn-compact secondary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1 
              title="Doble clic per editar el títol" 
              className="issue-detail-subject"
            >
              {issue.subject}
            </h1>
          )}
        </div>

        {issue.blocked && (
          <div className="issue-blocked-banner">
            <span>🔒</span> BLOCKED {issue.due_date_reason ? `- ${issue.due_date_reason}` : ''}
          </div>
        )}

        <div className="issue-info-bar">
          <div className="issue-info-left">
            <h4 className="issue-info-label">Issue</h4>
            <div className="issue-tags-row">
              {isAddingTag ? (
                <div className="issue-tag-add-form">
                  <div className="issue-tag-add-row">
                    <input
                      type="color"
                      value={tagColor}
                      onChange={e => setTagColor(e.target.value)}
                      className="issue-tag-color-picker"
                      title="Choose tag color"
                    />
                    <input
                      type="text"
                      placeholder="new tag..."
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleAddTag(tagInput, tagColor);
                          setTagInput('');
                          setIsAddingTag(false);
                        } else if (e.key === 'Escape') {
                          setIsAddingTag(false);
                          setTagInput('');
                        }
                      }}
                      autoFocus
                      className="issue-tag-add-input"
                    />
                    <button
                      onClick={() => {
                        handleAddTag(tagInput, tagColor);
                        setTagInput('');
                        setIsAddingTag(false);
                      }}
                      className="issue-tag-confirm-btn"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingTag(false);
                        setTagInput('');
                      }}
                      className="issue-tag-cancel-btn"
                    >
                      ✗
                    </button>
                  </div>

                  {/* Render available global tags that are not on the issue yet */}
                  {globalTags.length > 0 && (
                    <div className="issue-tag-global-list">
                      {globalTags
                        .filter(t => !issue.tags.some(it => it.name.toLowerCase() === t.name.toLowerCase()))
                        .map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={async () => {
                              await handleAddTag(t.name, t.color);
                              setIsAddingTag(false);
                            }}
                            className="issue-tag-global-btn"
                            style={{
                              borderColor: t.color,
                              backgroundColor: `${t.color}15`,
                              color: t.color
                            }}
                          >
                            {t.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="issue-tag-add-btn"
                >
                  Add tag +
                </button>
              )}
              {issue.tags.map((tag, idx) => {
                const tagInfo = globalTags.find(t => t.name.toLowerCase() === tag.name.toLowerCase());
                const tagColorVal = tag.color || 'var(--color-teal)';
                return (
                  <span
                    key={idx}
                    className="issue-tag"
                    style={{
                      borderColor: tagColorVal,
                      backgroundColor: `${tagColorVal}15`,
                      color: tagColorVal
                    }}
                  >
                    {tagInfo ? (
                      <label style={{ cursor: 'pointer' }} title="Click to change tag color">
                        {tag.name}
                        <input
                          type="color"
                          value={tagColorVal}
                          onChange={async (e) => {
                            const newColor = e.target.value;
                            try {
                              await apiRequest(`tags/${tagInfo.id}`, {
                                method: 'PUT',
                                body: { color: newColor }
                              });
                              fetchAllData();
                            } catch (err) {
                              console.error(err);
                              alert('Error updating tag color');
                            }
                          }}
                          className="issue-tag-color-input"
                        />
                      </label>
                    ) : (
                      tag.name
                    )}
                    <button
                      onClick={() => handleRemoveTag(tag.name)}
                      className="issue-tag-remove"
                      style={{ color: tagColorVal }}
                      title="Remove tag"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
          <div className="issue-info-right">
            <div className="issue-info-creator-row">
              <div className="issue-info-created-text">
                <div className="issue-info-created">
                  Created by{' '}
                  <UserProfileLink
                    username={issue.created_by}
                    className="issue-info-created-author"
                  >
                    {getUserDisplayName(issue.created_by)}
                  </UserProfileLink>
                </div>
                {issue.created_at && (
                  <div className="issue-info-created-date">
                    {formatActivityDate(issue.created_at)}
                  </div>
                )}
              </div>
              <Link
                to={`/profile/${encodeURIComponent(issue.created_by)}`}
                className="issue-info-creator-avatar"
                title={`View ${issue.created_by}'s profile`}
              >
                {getUserAvatar(issue.created_by) ? (
                  <img
                    src={getUserAvatar(issue.created_by)!}
                    alt={issue.created_by}
                    className="issue-avatar-image"
                  />
                ) : (
                  <span className="issue-info-creator-avatar-initial">
                    {issue.created_by.charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            </div>
            {(() => {
              // Resolve due date color, name, and days text
              const defaultRule = dueDates.find(r => r.by_default === 'Past' || r.days_to_due === null) 
                                || dueDates.find(r => r.name.toLowerCase() === 'default') 
                                || { name: 'Default', color: '#009aa6' };

              let color = 'var(--text-secondary)';
              let text = 'No due date';
              let name = 'No limit';
              let bg = 'var(--bg-surface)';

              if (issue.due_date) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const due = new Date(issue.due_date);
                due.setHours(0, 0, 0, 0);
                
                const diffTime = due.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Sort rules excluding defaults, by days_to_due ascending
                const sortedRules = [...dueDates]
                  .filter(r => r.days_to_due !== null && r.days_to_due !== undefined)
                  .sort((a, b) => (a.days_to_due || 0) - (b.days_to_due || 0));

                let matchedRule = null;
                for (const rule of sortedRules) {
                  if (rule.days_to_due !== null && diffDays <= rule.days_to_due) {
                    matchedRule = rule;
                    break;
                  }
                }

                if (!matchedRule) {
                  matchedRule = defaultRule;
                }

                color = matchedRule.color;
                name = matchedRule.name;
                bg = `${color}15`;

                if (diffDays === 0) {
                  text = 'Due today';
                } else if (diffDays < 0) {
                  text = `Overdue by ${Math.abs(diffDays)}d`;
                } else {
                  text = `${diffDays}d left`;
                }
              }

              return (
                <div className="issue-due-date-row">
                  <input 
                    type="date" 
                    value={issue.due_date || ''} 
                    onChange={handleDueDateChange}
                    className="issue-due-date-input"
                    style={{
                      border: `1px solid ${issue.due_date ? color : 'var(--border-color)'}`,
                      backgroundColor: bg,
                      color: issue.due_date ? color : 'var(--text-primary)'
                    }}
                    title="Due Date"
                  />
                  {issue.due_date && (
                    <div className="issue-due-date-display">
                      <span>{text} (Rule: <strong>{name}</strong>)</span>
                      <button 
                        onClick={() => handleUpdateField('duedate', null)}
                        className="issue-due-date-remove"
                        title="Remove due date"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Descripció Editable */}
        <div className="issue-desc-section" onDoubleClick={() => setIsEditingDesc(true)}>
          {isEditingDesc ? (
            <div className="issue-desc-edit-area">
              <textarea 
                value={descInput}
                onChange={e => setDescInput(e.target.value)}
                className="issue-desc-textarea"
              />
              <div className="issue-desc-actions">
                <button onClick={() => { handleUpdateField('description', descInput); setIsEditingDesc(false); }} className="issue-btn-compact primary">Save</button>
                <button onClick={() => { setIsEditingDesc(false); setDescInput(issue.description); }} className="issue-btn-compact secondary">Cancel</button>
              </div>
            </div>
          ) : (
             <div className="issue-desc-text" title="Doble clic per editar la descripció">
               {issue.description || <span className="issue-desc-placeholder">No description provided. Double click to edit.</span>}
             </div>
          )}
        </div>

        {/* Attachments */}
        <div className="issue-attachments-section">
          <div className="issue-attachments-header">
            <span className="issue-attachments-count">{issue.attachments.length} Attachments</span>
            <label className="issue-attachments-add-btn">
              +
              <input type="file" hidden onChange={handleFileUpload} />
            </label>
          </div>
          {issue.attachments.length > 0 && (
            <div className="issue-attachments-list">
              {issue.attachments.map(att => {
                const attachmentUrl = att.file ? getAttachmentDownloadUrl(att) : null;
                const attachmentName = getAttachmentName(att);

                return (
                  <div key={att.id} className="issue-attachment-item">
                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(att)}
                      disabled={!attachmentUrl}
                      className="issue-attachment-link"
                      title={`Download ${attachmentName}`}
                    >
                      <span>📄</span>
                      <span>{attachmentName}</span>
                    </button>
                    <button onClick={() => handleDeleteAttachment(att.id)} className="issue-attachment-delete">🗑</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tabs for Comments & Activities */}
        <div className="issue-comments-section">
          <div className="issue-comments-tabs">
            <button 
              onClick={() => setActiveTab('comments')}
              className={`issue-comments-tab ${activeTab === 'comments' ? 'active' : ''}`}
            >
              {issue.comments.length} Comments
            </button>
            <button 
              onClick={() => setActiveTab('activities')}
              className={`issue-comments-tab ${activeTab === 'activities' ? 'active' : ''}`}
            >
              {issue.activities.length} Activities
            </button>
          </div>
          
          <div className="issue-comments-tab-content">
            {activeTab === 'comments' && (
              <div>
                <textarea 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Type a new comment here" 
                  className="issue-new-comment-textarea"
                />
                <div className="issue-new-comment-actions">
                  <button onClick={handlePostComment} className="issue-new-comment-btn">Post Comment</button>
                </div>
                
                <div className="issue-comments-list">
                  {issue.comments.map(c => {
                    const canEditComment = ownProfile?.username === c.user;
                    const isEditingComment = editingCommentId === c.id;

                    return (
                    <div key={c.id} className="issue-comment-item">
                      <div className="issue-comment-avatar">
                        {getUserAvatar(c.user) ? (
                          <img src={getUserAvatar(c.user)!} alt={c.user} className="issue-avatar-image" />
                        ) : (
                          <span className="issue-avatar-initials">{c.user.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="issue-comment-body">
                        <div className="issue-comment-header">
                          <div>
                            <UserProfileLink
                              username={c.user}
                              className="issue-comment-author"
                            >
                              {getUserDisplayName(c.user)}
                            </UserProfileLink>
                            <span className="issue-comment-date"> {new Date(c.created_at).toLocaleString()}</span>
                          </div>
                          {canEditComment && (
                            <div className="issue-comment-actions">
                              <button
                                type="button"
                                onClick={() => handleStartEditComment(c.id, c.text)}
                                title="Edit comment"
                                className="issue-comment-action-btn"
                              >
                                <svg viewBox="0 0 24 24" className="issue-comment-action-icon fill">
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c.id)}
                                title="Delete comment"
                                className="issue-comment-action-btn danger"
                              >
                                <svg viewBox="0 0 24 24" className="issue-comment-action-icon stroke">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        {isEditingComment ? (
                          <div className="issue-comment-edit-form">
                            <textarea
                              value={commentDraft}
                              onChange={e => setCommentDraft(e.target.value)}
                              className="issue-comment-edit-textarea"
                              required
                            />
                            <div className="issue-comment-edit-actions">
                              <button onClick={() => handleUpdateComment(c.id)} className="issue-btn-compact primary">Save</button>
                              <button onClick={handleCancelEditComment} className="issue-btn-compact secondary">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="issue-comment-text">{c.text}</div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
            {activeTab === 'activities' && (
              <div className="issue-activities-list">
                {issue.activities.map(act => {
                  const { badge, text } = formatActivity(act);
                  const displayName = getUserDisplayName(act.user);
                  const avatarUrl = getUserAvatar(act.user);

                  return (
                    <div key={act.id} className="issue-activity-item">
                      {/* Avatar */}
                      <div className="issue-activity-avatar">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={act.user} className="issue-avatar-image" />
                        ) : (
                          <span className="issue-avatar-initials" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {act.user.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Content details */}
                      <div className="issue-activity-content">
                        {/* Header: User Display Name & Time */}
                        <div className="issue-activity-header">
                          <UserProfileLink
                            username={act.user}
                            className="issue-activity-author"
                          >
                            {displayName}
                          </UserProfileLink>
                          <span className="issue-activity-date">{formatActivityDate(act.created_at)}</span>
                        </div>

                        {/* Action badge & text */}
                        <div className="issue-activity-detail">
                          <span className="issue-activity-badge">
                            {badge}
                          </span>
                          <span className="issue-activity-text">
                            {text}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Columna Dreta: Sidebar Metadades */}
      <div className="issue-sidebar">
        
        {/* Status */}
        {(() => {
          const currentStatusItem = statuses.find(s => s.name === issue.status);
          const statusColor = currentStatusItem?.color || 'var(--border-color)';
          const isClosed = currentStatusItem?.closed || false;
          
          return (
            <div className="issue-sidebar-section">
              <h4 className="issue-prop-label">Status</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <select 
                  value={issue.status || ''} 
                  onChange={(e) => handleUpdateField('status', e.target.value)}
                  className="issue-prop-select"
                  style={{ 
                    border: `2px solid ${statusColor}`, 
                    backgroundColor: `${statusColor}18`
                  }}
                >
                  {statuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>

                <span className={`issue-status-badge ${isClosed ? 'closed' : 'open'}`}>
                  <span className="issue-status-badge-dot" />
                  {isClosed ? 'Closed' : 'Open'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Properties list */}
        <div className="issue-sidebar-props">
          
          {/* Type */}
          {(() => {
            const selectedColor = types.find(t => t.name === issue.type)?.color || 'var(--border-color)';
            return (
              <div className="issue-prop-row">
                <div className="issue-prop-name">
                  <span className="issue-prop-color-dot" style={{ backgroundColor: selectedColor }} />
                  <span>type</span>
                </div>
                <select 
                  value={issue.type || ''} 
                  onChange={(e) => handleUpdateField('type', e.target.value)} 
                  className="issue-prop-select-sm"
                  style={{
                    border: `1px solid ${selectedColor}`,
                    backgroundColor: `${selectedColor}15`
                  }}
                >
                  <option value="">--</option>
                  {types.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            );
          })()}
          
          {/* Severity */}
          {(() => {
            const selectedColor = severities.find(s => s.name === issue.severity)?.color || 'var(--border-color)';
            return (
              <div className="issue-prop-row">
                <div className="issue-prop-name">
                  <span className="issue-prop-color-dot" style={{ backgroundColor: selectedColor }} />
                  <span>severity</span>
                </div>
                <select 
                  value={issue.severity || ''} 
                  onChange={(e) => handleUpdateField('severity', e.target.value)} 
                  className="issue-prop-select-sm"
                  style={{
                    border: `1px solid ${selectedColor}`,
                    backgroundColor: `${selectedColor}15`
                  }}
                >
                  <option value="">--</option>
                  {severities.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            );
          })()}
          
          {/* Priority */}
          {(() => {
            const selectedColor = priorities.find(p => p.name === issue.priority)?.color || 'var(--border-color)';
            return (
              <div className="issue-prop-row">
                <div className="issue-prop-name">
                  <span className="issue-prop-color-dot" style={{ backgroundColor: selectedColor }} />
                  <span>priority</span>
                </div>
                <select 
                  value={issue.priority || ''} 
                  onChange={(e) => handleUpdateField('priority', e.target.value)} 
                  className="issue-prop-select-sm"
                  style={{
                    border: `1px solid ${selectedColor}`,
                    backgroundColor: `${selectedColor}15`
                  }}
                >
                  <option value="">--</option>
                  {priorities.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            );
          })()}
        </div>

        {/* Assigned */}
        <div className="issue-sidebar-section">
          <h4 className="issue-sidebar-heading">Assigned</h4>
          {issue.assigned ? (
            <div className="issue-assignee-row">
              <div className="issue-assignee-info">
                <div className="issue-avatar-small" style={{ backgroundColor: 'var(--danger-bg)' }}>
                  {getUserAvatar(issue.assigned) ? (
                    <img src={getUserAvatar(issue.assigned)!} alt={issue.assigned} className="issue-avatar-image" />
                  ) : (
                    issue.assigned.charAt(0).toUpperCase()
                  )}
                </div>
                <UserProfileLink
                  username={issue.assigned}
                  className="issue-username accent"
                >
                  {getUserDisplayName(issue.assigned)}
                </UserProfileLink>
              </div>
              <button onClick={() => handleUpdateField('assigned', null)} className="issue-remove-btn">✕</button>
            </div>
          ) : (
            <div className="issue-unassigned-text">Unassigned</div>
          )}
          
          <div className="issue-sidebar-btn-group">
            <button 
              onClick={() => setIsAssignModalOpen(true)}
              className="issue-sidebar-btn"
            >
              + Add assigned
            </button>
          </div>
        </div>

        {/* Watchers */}
        <div className="issue-sidebar-section">
          <h4 className="issue-sidebar-heading">Watchers</h4>
          <div className="issue-watchers-list">
            {issue.watchers.map((w, i) => (
              <div key={i} className="issue-watcher-row">
                <div className="issue-watcher-info">
                  <div className="issue-avatar-small" style={{ backgroundColor: 'var(--bg-hover)' }}>
                    {getUserAvatar(w.username) ? (
                      <img src={getUserAvatar(w.username)!} alt={w.username} className="issue-avatar-image" />
                    ) : (
                      w.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <UserProfileLink
                    username={w.username}
                    className="issue-username secondary"
                  >
                    {getUserDisplayName(w.username)}
                  </UserProfileLink>
                </div>
                <button onClick={() => handleRemoveWatcher(w.username)} className="issue-remove-btn">✕</button>
              </div>
            ))}
          </div>
          <div className="issue-sidebar-btn-group">
            <button 
              onClick={() => setIsWatchersModalOpen(true)}
              className="issue-sidebar-btn"
            >
              + Add watchers
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="issue-sidebar-actions">
          <button 
            onClick={handleToggleBlock} 
            title={issue.blocked ? "Unblock Issue" : "Block Issue"} 
            className={`issue-btn-block ${issue.blocked ? 'blocked' : 'unblocked'}`}
          >
            <span>{issue.blocked ? '🔓 Unblock' : '🔒 Block'}</span>
          </button>
          <button 
            onClick={handleDelete} 
            title="Delete Issue" 
            className="issue-btn-delete-action"
          >
            <span>🗑 Delete</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <UserSelectionModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Add assigned"
        users={users}
        initialSelected={issue.assigned ? [issue.assigned] : []}
        isMultiple={false}
        onAdd={handleAssignUser}
      />

      <UserSelectionModal 
        isOpen={isWatchersModalOpen}
        onClose={() => setIsWatchersModalOpen(false)}
        title="Add watchers"
        users={users}
        initialSelected={issue.watchers.map(w => w.username)}
        isMultiple={true}
        onAdd={handleWatchersChange}
      />

      {/* Block Reason Modal */}
      {isBlockModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <span>🔒</span> Block Issue
              </h3>
              <button onClick={() => setIsBlockModalOpen(false)} className="modal-close-btn">✕</button>
            </div>
            <div className="issue-modal-section">
              <p className="issue-modal-label">
                Please enter a reason for blocking this issue. This reason will be logged and visible in the activity timeline.
              </p>
              <input 
                type="text" 
                placeholder="Dependencies not met / Missing credentials..." 
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                className="issue-modal-textarea"
                autoFocus
                required
              />
            </div>
            <div className="issue-modal-footer">
              <button 
                onClick={() => setIsBlockModalOpen(false)} 
                className="issue-modal-cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleBlockConfirm}
                className="issue-modal-confirm-btn"
              >
                BLOCK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--danger)' }}>
                <span>🗑</span> Delete Issue
              </h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="modal-close-btn">✕</button>
            </div>
            <div className="issue-modal-section">
              <p className="issue-modal-warning">
                Are you absolutely sure you want to delete this issue?
              </p>
              <p className="issue-modal-desc">
                This action is permanent and cannot be undone. All comments, attachments, and activity timelines for this issue will be permanently deleted.
              </p>
            </div>
            <div className="issue-modal-footer">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="issue-modal-cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="issue-modal-confirm-btn"
              >
                DELETE PERMANENTLY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
