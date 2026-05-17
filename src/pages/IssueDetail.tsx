import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/client';
import type { DetailedIssue, StatusItem, TypeItem, SeverityItem, PriorityItem, UserResource } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { UserSelectionModal } from '../components/UserSelectionModal';

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

  // Local UI State
  const [activeTab, setActiveTab] = useState<'comments' | 'activities'>('comments');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState('');
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState('');

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isWatchersModalOpen, setIsWatchersModalOpen] = useState(false);

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

  const fetchAllData = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [issueData, statusData, typeData, sevData, prioData, userData] = await Promise.all([
        apiRequest<DetailedIssue>(`issues/${id}`),
        apiRequest<StatusItem[]>('statuses'),
        apiRequest<TypeItem[]>('types'),
        apiRequest<SeverityItem[]>('severities'),
        apiRequest<PriorityItem[]>('priorities'),
        apiRequest<UserResource[]>('users')
      ]);
      setIssue(issueData);
      setStatuses(statusData);
      setTypes(typeData);
      setSeverities(sevData);
      setPriorities(prioData);
      setUsers(userData);
      setDescInput(issueData.description || '');
      setSubjectInput(issueData.subject || '');
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

  const handleDelete = async () => {
    if (!issue) return;
    if (confirm('Are you sure you want to delete this issue?')) {
      try {
        await apiRequest(`issues/${issue.id}`, { method: 'DELETE' });
        navigate('/');
      } catch (error) {
        console.error(error);
        alert('Forbidden: Only the creator can delete this issue.');
      }
    }
  };

  const handleToggleBlock = async () => {
    if (!issue) return;
    try {
      if (issue.blocked) {
        await apiRequest(`issues/${issue.id}/unblock`, { method: 'POST' });
      } else {
        const reason = prompt('Please provide a reason for blocking this issue:', 'Dependencies not met');
        if (reason === null) return; // User cancelled
        await apiRequest(`issues/${issue.id}/block`, { 
          method: 'POST',
          body: { reason }
        });
      }
      fetchAllData(); // Refresh to get activities and exact state
    } catch (error) {
      console.error(error);
      alert('Error changing block status');
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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregant detall de la incidència...</div>;
  if (error || !issue) return <div style={{ padding: '2rem', color: 'var(--color-critical)' }}>Error: {error || 'Issue not found'}</div>;

  return (
    <div className="issue-detail-layout">
      {/* Columna Esquerra: Contingut Principal */}
      <div className="issue-main-content">
        <Link to="/" style={{ color: 'var(--color-teal)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
          ← Back to issues
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }} onDoubleClick={() => setIsEditingSubject(true)}>
          <span style={{ color: 'var(--color-teal)', fontSize: '2rem', fontWeight: 300 }}>#{issue.id}</span>
          {isEditingSubject ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
              <input
                type="text"
                value={subjectInput}
                onChange={e => setSubjectInput(e.target.value)}
                style={{
                  fontSize: '2rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  border: '1px solid var(--color-teal)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  width: '100%',
                  fontFamily: 'inherit',
                  backgroundColor: 'var(--bg-surface)'
                }}
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
                className="sidebar-btn" 
                style={{ backgroundColor: 'var(--color-teal)', color: 'white', padding: '0.25rem 0.75rem', height: '36px' }}
              >
                Save
              </button>
              <button 
                onClick={() => { setIsEditingSubject(false); setSubjectInput(issue.subject); }} 
                className="sidebar-btn"
                style={{ padding: '0.25rem 0.75rem', height: '36px' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1 
              title="Doble clic per editar el títol" 
              style={{ margin: 0, fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
            >
              {issue.subject}
            </h1>
          )}
        </div>

        {issue.blocked && (
          <div style={{ backgroundColor: '#ffe6e6', color: 'var(--color-critical)', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600 }}>
            <span>🔒</span> BLOCKED {issue.due_date_reason ? `- ${issue.due_date_reason}` : ''}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Issue</h4>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button style={{ background: '#e0f2f1', border: 'none', color: 'var(--color-teal)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Add tag +</button>
              {issue.tags.map((tag, idx) => (
                <span key={idx} style={{ backgroundColor: tag.color || 'var(--color-teal)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{tag.name}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div>Created by <span style={{ color: 'var(--color-teal)' }}>{issue.created_by}</span></div>
            <div style={{ marginTop: '0.25rem' }}>
              <input 
                type="date" 
                value={issue.due_date || ''} 
                onChange={handleDueDateChange}
                style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 4px', fontSize: '0.75rem', color: 'inherit' }}
                title="Due Date"
              />
            </div>
          </div>
        </div>

        {/* Descripció Editable */}
        <div style={{ marginBottom: '2rem', minHeight: '100px', lineHeight: '1.6' }} onDoubleClick={() => setIsEditingDesc(true)}>
          {isEditingDesc ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea 
                value={descInput}
                onChange={e => setDescInput(e.target.value)}
                style={{ width: '100%', minHeight: '150px', padding: '0.5rem', fontFamily: 'inherit', borderRadius: '4px', border: '1px solid var(--color-teal)' }}
              />
              <div>
                <button onClick={() => { handleUpdateField('description', descInput); setIsEditingDesc(false); }} className="sidebar-btn" style={{ marginRight: '0.5rem', backgroundColor: 'var(--color-teal)', color: 'white' }}>Save</button>
                <button onClick={() => { setIsEditingDesc(false); setDescInput(issue.description); }} className="sidebar-btn">Cancel</button>
              </div>
            </div>
          ) : (
             <div title="Doble clic per editar la descripció" style={{ cursor: 'pointer' }}>
               {issue.description || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No description provided. Double click to edit.</span>}
             </div>
          )}
        </div>

        {/* Attachments */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#e2e8f0', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '4px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{issue.attachments.length} Attachments</span>
            <label style={{ backgroundColor: 'var(--color-mint)', border: 'none', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
              +
              <input type="file" hidden onChange={handleFileUpload} />
            </label>
          </div>
          {issue.attachments.length > 0 && (
            <div style={{ border: '1px solid var(--border-color)', borderTop: 'none', padding: '1rem', borderRadius: '0 0 4px 4px' }}>
              {issue.attachments.map(att => (
                <div key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                  <a href={att.file || '#'} target="_blank" rel="noreferrer" style={{ color: 'var(--color-teal)', textDecoration: 'none' }}>📄 Attachment {att.id}</a>
                  <button onClick={() => handleDeleteAttachment(att.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>🗑</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs for Comments & Activities */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setActiveTab('comments')}
              style={{ background: 'none', border: 'none', padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: 600, color: activeTab === 'comments' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'comments' ? '3px solid var(--text-primary)' : '3px solid transparent' }}
            >
              {issue.comments.length} Comments
            </button>
            <button 
              onClick={() => setActiveTab('activities')}
              style={{ background: 'none', border: 'none', padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: 600, color: activeTab === 'activities' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'activities' ? '3px solid var(--text-primary)' : '3px solid transparent' }}
            >
              {issue.activities.length} Activities
            </button>
          </div>
          
          <div style={{ padding: '1rem 0' }}>
            {activeTab === 'comments' && (
              <div>
                <textarea 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Type a new comment here" 
                  style={{ width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.5rem' }} 
                />
                <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                  <button onClick={handlePostComment} className="sidebar-btn" style={{ backgroundColor: 'var(--color-teal)', color: 'white' }}>Post Comment</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {issue.comments.map(c => {
                    const canEditComment = ownProfile?.username === c.user;
                    const isEditingComment = editingCommentId === c.id;

                    return (
                    <div key={c.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', display: 'flex', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eee', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getUserAvatar(c.user) ? (
                          <img src={getUserAvatar(c.user)!} alt={c.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontWeight: 'bold' }}>{c.user.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.user} <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>{new Date(c.created_at).toLocaleString()}</span></div>
                          {canEditComment && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => handleStartEditComment(c.id, c.text)}
                                title="Edit comment"
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                              >
                                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'currentColor' }}>
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c.id)}
                                title="Delete comment"
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                              >
                                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}>
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        {isEditingComment ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <textarea
                              value={commentDraft}
                              onChange={e => setCommentDraft(e.target.value)}
                              style={{ width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', resize: 'vertical', fontFamily: 'inherit' }}
                              required
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => handleUpdateComment(c.id)} className="sidebar-btn" style={{ backgroundColor: 'var(--color-teal)', color: 'white' }}>Save</button>
                              <button onClick={handleCancelEditComment} className="sidebar-btn">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap' }}>{c.text}</div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
            {activeTab === 'activities' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {issue.activities.map(act => (
                  <div key={act.id} style={{ fontSize: '0.9rem', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <strong style={{ color: 'var(--color-teal)' }}>{act.user}</strong> changed <strong>{act.field}</strong> from <em style={{ color: 'var(--color-bug)' }}>{act.old || 'null'}</em> to <em style={{ color: 'var(--color-enhancement)' }}>{act.new || 'null'}</em>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{new Date(act.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Columna Dreta: Sidebar Metadades */}
      <div className="issue-sidebar">
        
        {/* Status */}
        <div style={{ marginBottom: '2rem' }}>
          <select 
            value={issue.status || ''} 
            onChange={(e) => handleUpdateField('status', e.target.value)}
            style={{ fontSize: '1.25rem', fontWeight: 600, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', width: '100%', backgroundColor: 'var(--bg-surface)' }}
          >
            {statuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        {/* Properties list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span>type</span>
            <select value={issue.type || ''} onChange={(e) => handleUpdateField('type', e.target.value)} className="property-select">
              <option value="">--</option>
              {types.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span>severity</span>
            <select value={issue.severity || ''} onChange={(e) => handleUpdateField('severity', e.target.value)} className="property-select">
              <option value="">--</option>
              {severities.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span>priority</span>
            <select value={issue.priority || ''} onChange={(e) => handleUpdateField('priority', e.target.value)} className="property-select">
              <option value="">--</option>
              {priorities.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Assigned */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Assigned</h4>
          {issue.assigned ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ffcccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', overflow: 'hidden' }}>
                  {getUserAvatar(issue.assigned) ? (
                    <img src={getUserAvatar(issue.assigned)!} alt={issue.assigned} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    issue.assigned.charAt(0).toUpperCase()
                  )}
                </div>
                <span style={{ color: 'var(--color-teal)', fontWeight: 600 }}>{issue.assigned}</span>
              </div>
              <button onClick={() => handleUpdateField('assigned', null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>Unassigned</div>
          )}
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setIsAssignModalOpen(true)}
              className="sidebar-btn" 
              style={{ width: '100%', textAlign: 'center' }}
            >
              + Add assigned
            </button>
          </div>
        </div>

        {/* Watchers */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Watchers</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {issue.watchers.map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', overflow: 'hidden' }}>
                    {getUserAvatar(w.username) ? (
                      <img src={getUserAvatar(w.username)!} alt={w.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      w.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  {w.username}
                </div>
                <button onClick={() => handleRemoveWatcher(w.username)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setIsWatchersModalOpen(true)}
              className="sidebar-btn" 
              style={{ width: '100%', textAlign: 'center' }}
            >
              + Add watchers
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleToggleBlock} title={issue.blocked ? "Unblock Issue" : "Block Issue"} style={{ backgroundColor: issue.blocked ? 'var(--color-normal)' : 'var(--color-bug)', color: 'white', border: 'none', borderRadius: '4px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {issue.blocked ? '🔓' : '🔒'}
          </button>
          <button onClick={handleDelete} title="Delete Issue" style={{ backgroundColor: '#f4f6f8', color: 'var(--color-critical)', border: '1px solid var(--border-color)', borderRadius: '4px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            🗑
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
    </div>
  );
};
