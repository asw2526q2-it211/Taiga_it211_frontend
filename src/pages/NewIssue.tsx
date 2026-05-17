import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest, apiRequestFormData } from '../services/client'
import type {
  ApiUser,
  ColorResource,
  CreateIssuePayload,
  DueDateRule,
  Issue,
  ProfileResponse,
  StatusResource,
  TagResource,
} from '../types/api'
import { useAuth } from '../context/AuthContext'
import { UserSelectionModal } from '../components/UserSelectionModal'

function pickDefault<T extends { name: string; is_default?: boolean }>(
  items: T[],
): T | undefined {
  return items.find((i) => i.is_default) ?? items[0]
}

function displayName(user: ApiUser): string {
  const full = `${user.first_name} ${user.last_name}`.trim()
  return full || user.username
}

function userInitial(user: ApiUser): string {
  return (user.username[0] ?? '?').toUpperCase()
}

/**
 * Vista de creació d'incidència (equivalent a issue_form.html).
 */
export const NewIssue: React.FC = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loadingMeta, setLoadingMeta] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [types, setTypes] = useState<ColorResource[]>([])
  const [severities, setSeverities] = useState<ColorResource[]>([])
  const [priorities, setPriorities] = useState<ColorResource[]>([])
  const [statuses, setStatuses] = useState<StatusResource[]>([])
  const [allTags, setAllTags] = useState<TagResource[]>([])
  const [users, setUsers] = useState<ApiUser[]>([])
  const [dueDateRules, setDueDateRules] = useState<DueDateRule[]>([])
  const [profile, setProfile] = useState<ProfileResponse | null>(null)

  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [typeName, setTypeName] = useState('')
  const [severityName, setSeverityName] = useState('')
  const [priorityName, setPriorityName] = useState('')
  const [statusName, setStatusName] = useState('')
  const [assigneeUsername, setAssigneeUsername] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState('')
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockedReason, setBlockedReason] = useState('')

  const [selectedTags, setSelectedTags] = useState<TagResource[]>([])
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#4dc1ae')

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])

  useEffect(() => {
    const load = async () => {
      setLoadingMeta(true)
      setError(null)
      try {
        const [typesRes, sevRes, priRes, statRes, tagsRes, usersRes, rulesRes, profileRes] =
          await Promise.all([
            apiRequest<ColorResource[]>('types/'),
            apiRequest<ColorResource[]>('severities/'),
            apiRequest<ColorResource[]>('priorities/'),
            apiRequest<StatusResource[]>('statuses/'),
            apiRequest<(TagResource & { id: number })[]>('tags/'),
            apiRequest<ApiUser[]>('users/'),
            apiRequest<DueDateRule[]>('duedates/'),
            apiRequest<ProfileResponse>('profile/'),
          ])

        setTypes(typesRes)
        setSeverities(sevRes)
        setPriorities(priRes)
        setStatuses(statRes)
        setAllTags(tagsRes.map((t) => ({ name: t.name, color: t.color })))
        setUsers(usersRes)
        setDueDateRules(rulesRes)
        setProfile(profileRes)

        const defType = pickDefault(typesRes)
        const defSev = pickDefault(sevRes)
        const defPri = pickDefault(priRes)
        const defStat = pickDefault(statRes)
        if (defType) setTypeName(defType.name)
        if (defSev) setSeverityName(defSev.name)
        if (defPri) setPriorityName(defPri.name)
        if (defStat) setStatusName(defStat.name)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load form data')
      } finally {
        setLoadingMeta(false)
      }
    }

    load()
  }, [currentUser])

  const handleAssignUser = (selectedUsernames: string[]) => {
    setAssigneeUsername(selectedUsernames[0] || null)
  }

  const selectedUser = users.find((u) => u.username === assigneeUsername) ?? null
  const attachmentCount = attachedFiles.length

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setPendingFiles(Array.from(files))
    e.target.value = ''
  }

  const handleUploadPending = () => {
    if (!pendingFiles.length) return
    setAttachedFiles((prev) => [...prev, ...pendingFiles])
    setPendingFiles([])
  }

  const removeAttached = (name: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.name !== name))
  }

  const addExistingTag = (tag: TagResource) => {
    if (selectedTags.some((t) => t.name === tag.name)) return
    setSelectedTags((prev) => [...prev, tag])
  }

  const removeTag = (name: string) => {
    setSelectedTags((prev) => prev.filter((t) => t.name !== name))
  }

  const handleAddInlineTag = async () => {
    const name = newTagName.trim()
    if (!name) return
    try {
      const created = await apiRequest<TagResource & { id: number }>('tags/', {
        method: 'POST',
        body: { name, color: newTagColor },
      })
      const tag = { name: created.name, color: created.color }
      setAllTags((prev) => (prev.some((t) => t.name === tag.name) ? prev : [...prev, tag]))
      setSelectedTags((prev) => [...prev, tag])
      setNewTagName('')
      setNewTagColor('#4dc1ae')
      setShowAddTag(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create tag')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) {
      setError('Subject is required')
      return
    }

    setSubmitting(true)
    setError(null)

    const payload: CreateIssuePayload = {
      subject: subject.trim(),
      description,
      type: typeName || undefined,
      severity: severityName || undefined,
      priority: priorityName || undefined,
      status: statusName || undefined,
      assigned: assigneeUsername ?? undefined,
      duedate: dueDate || undefined,
      blocked: isBlocked,
      tags: selectedTags.map((t) => t.name),
    }

    try {
      const created = await apiRequest<Issue>('issues/', {
        method: 'POST',
        body: payload,
      })

      if (isBlocked && blockedReason.trim()) {
        await apiRequest(`issues/${created.id}/block`, {
          method: 'POST',
          body: { reason: blockedReason.trim() },
        })
      }

      if (attachedFiles.length > 0) {
        const fd = new FormData()
        for (const file of attachedFiles) {
          fd.append('attachment1', file)
        }
        await apiRequestFormData(`issues/${created.id}/`, fd, 'PUT')
      }

      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create issue')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingMeta) {
    return (
      <div className="new-issue-lightbox">
        <style>{newIssueStyles}</style>
        <div className="new-issue-container" style={{ textAlign: 'center', paddingTop: 80 }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="new-issue-lightbox">
      <style>{newIssueStyles}</style>
      <div className="new-issue-container">
        <button
          type="button"
          className="new-issue-close"
          onClick={() => navigate('/')}
          aria-label="Close"
        >
          <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h1 className="new-issue-title">New issue</h1>

        <form className="new-issue-form" onSubmit={handleSubmit}>
          <div className="new-issue-columns">
            <div className="new-issue-left">
              <input
                type="text"
                className="new-issue-subject"
                placeholder="Subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="new-issue-tags-row">
                  {!showAddTag ? (
                    <button
                      type="button"
                      className="new-issue-add-tag-btn"
                      onClick={() => setShowAddTag(true)}
                    >
                      Add tag <span style={{ fontSize: 16, marginLeft: 2, fontWeight: 'bold' }}>+</span>
                    </button>
                  ) : (
                    <div className="new-issue-inline-tag">
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        style={{ width: 26, height: 26, padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }}
                      />
                      <div style={{ display: 'flex' }}>
                        <input
                          type="text"
                          placeholder="Tag name"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                        />
                        <button type="button" onClick={handleAddInlineTag}>
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedTags.map((tag) => (
                    <span
                      key={tag.name}
                      className="new-issue-tag-badge"
                      style={{ 
                        borderColor: tag.color,
                        backgroundColor: `${tag.color}15`,
                        color: tag.color,
                        borderStyle: 'solid',
                        borderWidth: '1px'
                      }}
                    >
                      {tag.name}
                      <button 
                        type="button" 
                        onClick={() => removeTag(tag.name)} 
                        title={`Remove ${tag.name}`}
                        style={{ color: tag.color }}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>

                {allTags.length > 0 && (
                  <div className="new-issue-tags-row" style={{ opacity: 0.95 }}>
                    {allTags
                      .filter((t) => !selectedTags.some((s) => s.name === t.name))
                      .slice(0, 12)
                      .map((tag) => (
                        <button
                          key={tag.name}
                          type="button"
                          className="new-issue-add-tag-btn"
                          onClick={() => addExistingTag(tag)}
                          style={{
                            borderColor: tag.color,
                            backgroundColor: `${tag.color}15`,
                            color: tag.color,
                            borderStyle: 'solid',
                            borderWidth: '1px',
                            fontWeight: 700
                          }}
                        >
                          {tag.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <textarea
                className="new-issue-description"
                placeholder="Please add descriptive text to help others better understand this issue"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="new-issue-attachments-bar">
                  <span>{attachmentCount} Attachments</span>
                  <div className="new-issue-attachments-actions">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      id="attachment-create-input"
                      style={{ display: 'none' }}
                      onChange={handleSelectFiles}
                    />
                    <label htmlFor="attachment-create-input">Select Files</label>
                    <button type="button" className="upload" onClick={handleUploadPending}>
                      Upload
                    </button>
                  </div>
                </div>
                <p className="new-issue-hint">
                  Select files first, then click &quot;Upload&quot; to attach them to this issue.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {attachedFiles.map((file) => (
                    <div key={file.name} className="new-issue-attachment-item">
                      <span style={{ color: '#009aa6', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg style={{ width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        {file.name}
                      </span>
                      <button type="button" onClick={() => removeAttached(file.name)} title="Delete" style={{ background: 'none', border: 'none', padding: 0, color: '#70728f', cursor: 'pointer' }}>
                        <svg style={{ width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="new-issue-right" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* 1. Status Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</h4>
                {(() => {
                  const currentStatusItem = statuses.find(s => s.name === statusName);
                  const statusColor = currentStatusItem?.color || '#cccccc';
                  const isClosed = currentStatusItem?.closed || false;
                  
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <select 
                          value={statusName} 
                          onChange={(e) => setStatusName(e.target.value)}
                          style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 700, 
                            padding: '0.45rem 2rem 0.45rem 0.75rem', 
                            borderRadius: '8px', 
                            border: `2px solid ${statusColor}`, 
                            backgroundColor: `${statusColor}18`,
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            outline: 'none',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.6rem center',
                            backgroundSize: '0.7em',
                            width: '100%',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>

                      <span style={{
                        backgroundColor: isClosed ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: isClosed ? 'rgb(220, 38, 38)' : 'rgb(5, 150, 105)',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '16px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        border: `1px solid ${isClosed ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                        transition: 'all 0.25s ease'
                      }}>
                        <span style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: isClosed ? 'rgb(220, 38, 38)' : 'rgb(5, 150, 105)',
                          transition: 'all 0.25s ease'
                        }} />
                        {isClosed ? 'Closed' : 'Open'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* 2. Assigned Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned</h4>
                
                {/* Two side-by-side elegant action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => profile && setAssigneeUsername(profile.username)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      backgroundColor: assigneeUsername === profile?.username ? 'rgba(20, 163, 142, 0.08)' : 'var(--bg-surface)',
                      color: assigneeUsername === profile?.username ? 'var(--color-teal)' : 'var(--text-primary)',
                      border: `1px solid ${assigneeUsername === profile?.username ? 'var(--color-teal)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      padding: '0.45rem 0.5rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                  >
                    <span>👤 Me</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(true)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.5rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                  >
                    <span>➕ Assign</span>
                  </button>
                </div>

                {/* Assigned User Info Card */}
                {selectedUser ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    backgroundColor: 'var(--bg-surface)', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    marginTop: '0.25rem'
                  }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#c5a3cd' }}>
                      {selectedUser.avatar ? (
                        <img 
                          src={selectedUser.avatar.startsWith('/') ? `https://taiga-it211.onrender.com${selectedUser.avatar}` : selectedUser.avatar} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ color: 'white', fontSize: '1rem', fontWeight: 700 }}>
                          {userInitial(selectedUser)}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {displayName(selectedUser)}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        @{selectedUser.username}
                      </span>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => setAssigneeUsername(null)} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--text-secondary)', 
                        cursor: 'pointer', 
                        fontSize: '0.95rem',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s ease'
                      }}
                      title="Remove assignee"
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-critical)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: '0.25rem', marginTop: '0.25rem' }}>
                    No one assigned
                  </div>
                )}
              </div>

              {/* 3. Attributes Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attributes</h4>
                
                {/* Type */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>Type</span>
                  {(() => {
                    const activeType = types.find(t => t.name === typeName);
                    const color = activeType?.color || '#cccccc';
                    return (
                      <select 
                        value={typeName} 
                        onChange={(e) => setTypeName(e.target.value)}
                        className="property-select"
                        style={{
                          borderColor: color,
                          backgroundColor: `${color}15`,
                          color: color,
                          width: '140px',
                          fontSize: '0.8rem',
                          padding: '0.35rem 1.5rem 0.35rem 0.6rem',
                          borderRadius: '8px'
                        }}
                      >
                        {types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                      </select>
                    );
                  })()}
                </div>

                {/* Severity */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>Severity</span>
                  {(() => {
                    const activeSev = severities.find(s => s.name === severityName);
                    const color = activeSev?.color || '#cccccc';
                    return (
                      <select 
                        value={severityName} 
                        onChange={(e) => setSeverityName(e.target.value)}
                        className="property-select"
                        style={{
                          borderColor: color,
                          backgroundColor: `${color}15`,
                          color: color,
                          width: '140px',
                          fontSize: '0.8rem',
                          padding: '0.35rem 1.5rem 0.35rem 0.6rem',
                          borderRadius: '8px'
                        }}
                      >
                        {severities.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    );
                  })()}
                </div>

                {/* Priority */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>Priority</span>
                  {(() => {
                    const activePrio = priorities.find(p => p.name === priorityName);
                    const color = activePrio?.color || '#cccccc';
                    return (
                      <select 
                        value={priorityName} 
                        onChange={(e) => setPriorityName(e.target.value)}
                        className="property-select"
                        style={{
                          borderColor: color,
                          backgroundColor: `${color}15`,
                          color: color,
                          width: '140px',
                          fontSize: '0.8rem',
                          padding: '0.35rem 1.5rem 0.35rem 0.6rem',
                          borderRadius: '8px'
                        }}
                      >
                        {priorities.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    );
                  })()}
                </div>
              </div>

              {/* 4. Due Date Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</h4>
                {(() => {
                  const defaultRule = dueDateRules.find(r => r.by_default === 'Past' || r.days_to_due === null) 
                                    || dueDateRules.find(r => r.name.toLowerCase() === 'default') 
                                    || { name: 'Default', color: '#009aa6' };

                  let color = '#718096'; // Neutral slate gray
                  let text = 'No due date';
                  let bg = '#f3f4f6';

                  if (dueDate) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const due = new Date(dueDate);
                    due.setHours(0, 0, 0, 0);
                    
                    const diffTime = due.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    const sortedRules = [...dueDateRules]
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
                    const ruleName = matchedRule.name; // used if needed in tooltip
                    void ruleName;
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="date" 
                        value={dueDate} 
                        onChange={(e) => setDueDate(e.target.value)}
                        style={{
                          border: `1px solid ${dueDate ? color : 'var(--border-color)'}`,
                          backgroundColor: bg,
                          color: dueDate ? color : 'var(--text-primary)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          padding: '0.35rem 0.5rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          width: '140px'
                        }}
                        title="Due Date"
                      />
                      {dueDate && (
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          <span>({text})</span>
                          <button 
                            type="button"
                            onClick={() => setDueDate('')}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}
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

              {/* 5. Blocking Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blocking</h4>
                <button 
                  type="button"
                  onClick={() => setIsBlocked((v) => !v)} 
                  title={isBlocked ? "Unblock Issue" : "Block Issue"} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    backgroundColor: isBlocked ? 'var(--color-normal)' : 'rgba(239, 68, 68, 0.12)', 
                    color: isBlocked ? '#fff' : 'rgb(220, 38, 38)', 
                    border: isBlocked ? 'none' : '1px solid rgba(239, 68, 68, 0.3)', 
                    borderRadius: '8px', 
                    padding: '0.45rem 1rem', 
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <span>{isBlocked ? '🔓 Unblock' : '🔒 Block'}</span>
                </button>
                {isBlocked && (
                  <input
                    type="text"
                    className="blocked-reason-input"
                    placeholder="Why is this blocked?"
                    value={blockedReason}
                    onChange={(e) => setBlockedReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginTop: '0.25rem',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)'
                    }}
                    required
                  />
                )}
              </div>
            </div>
          </div>

          {error && <p className="new-issue-error">{error}</p>}

          <div className="new-issue-submit-wrap" style={{ width: '100%', maxWidth: '740px', marginTop: '1rem' }}>
            <button 
              type="submit" 
              className="new-issue-submit" 
              disabled={submitting}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-teal)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.05em',
                borderRadius: '8px',
                height: '44px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(20, 163, 142, 0.2)'
              }}
            >
              {submitting ? 'CREATING...' : 'CREATE ISSUE'}
            </button>
          </div>
        </form>
      </div>

      <UserSelectionModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Add assigned"
        users={users.map(u => ({
          id: u.id,
          username: u.username,
          avatar: u.avatar ? (u.avatar.startsWith('/') ? `https://taiga-it211.onrender.com${u.avatar}` : u.avatar) : null,
          first_name: u.first_name,
          last_name: u.last_name
        }))}
        initialSelected={assigneeUsername ? [assigneeUsername] : []}
        isMultiple={false}
        onAdd={handleAssignUser}
      />
    </div>
  )
}

const newIssueStyles = `
.new-issue-lightbox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.98);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow-y: auto;
}
.new-issue-container {
  width: 100%;
  max-width: 900px;
  padding: 40px 20px;
  position: relative;
}
.new-issue-close {
  position: absolute;
  right: 0;
  top: 40px;
  color: var(--text-secondary);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: color 0.2s;
}
.new-issue-close:hover {
  color: var(--text-primary);
}
.new-issue-title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 40px;
  margin-top: 0;
}
.new-issue-form {
  display: flex;
  flex-direction: column;
  gap: 30px;
  align-items: center;
}
.new-issue-columns {
  display: flex;
  gap: 40px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}
.new-issue-left {
  flex: 1;
  min-width: 300px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.new-issue-right {
  width: 300px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
@media (max-width: 768px) {
  .new-issue-columns {
    flex-direction: column;
    gap: 20px;
  }
  .new-issue-right {
    width: 100%;
  }
  .new-issue-close {
    right: 20px !important;
    top: 20px !important;
  }
  .new-issue-title {
    margin-top: 20px !important;
    margin-bottom: 20px !important;
  }
}
.new-issue-subject {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 15px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  background: #fff;
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s ease;
}
.new-issue-subject:focus {
  border-color: var(--color-teal);
  box-shadow: 0 0 0 2px rgba(20, 163, 142, 0.15);
}
.new-issue-description {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 15px;
  font-size: 14px;
  color: var(--text-primary);
  background: #fff;
  min-height: 200px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
  transition: all 0.2s ease;
}
.new-issue-description:focus {
  border-color: var(--color-teal);
  box-shadow: 0 0 0 2px rgba(20, 163, 142, 0.15);
}
.new-issue-tags-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.new-issue-add-tag-btn {
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  padding: 5px 12px;
  border-radius: 8px;
  color: var(--color-teal);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}
.new-issue-add-tag-btn:hover {
  background: rgba(20, 163, 142, 0.08);
  border-color: rgba(20, 163, 142, 0.3);
}
.new-issue-tag-badge {
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #fff;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}
.new-issue-tag-badge button {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  opacity: 0.7;
  font-weight: bold;
}
.new-issue-tag-badge:hover button {
  opacity: 1;
}
.new-issue-inline-tag {
  display: flex;
  align-items: center;
  gap: 6px;
}
.new-issue-inline-tag input[type='text'] {
  border: 1px solid var(--border-color);
  border-radius: 8px 0 0 8px;
  padding: 6px 10px;
  font-size: 13px;
  width: 120px;
  outline: none;
}
.new-issue-inline-tag button {
  background: var(--color-teal);
  color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  cursor: pointer;
}
.new-issue-attachments-bar {
  display: flex;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding-left: 15px;
  align-items: center;
  justify-content: space-between;
  height: 40px;
}
.new-issue-attachments-bar span {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}
.new-issue-attachments-actions {
  display: flex;
  height: 100%;
  align-items: center;
}
.new-issue-attachments-actions label,
.new-issue-attachments-actions button {
  background: var(--bg-surface);
  height: 100%;
  padding: 0 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  border-left: 1px solid var(--border-color);
  transition: all 0.2s ease;
}
.new-issue-attachments-actions label:hover,
.new-issue-attachments-actions button:hover {
  background: rgba(0,0,0,0.02);
  color: var(--text-primary);
}
.new-issue-attachments-actions button.upload {
  background: var(--color-mint);
  border: none;
  border-radius: 0 8px 8px 0;
  color: #000;
}
.new-issue-attachments-actions button.upload:hover {
  filter: brightness(0.95);
}
.new-issue-attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}
.new-issue-error {
  color: var(--color-critical);
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}
.new-issue-hint {
  font-size: 11px;
  color: var(--text-secondary);
  font-style: italic;
  margin-top: -5px;
}
@media (max-width: 900px) {
  .new-issue-columns {
    flex-direction: column;
    align-items: center;
  }
  .new-issue-left,
  .new-issue-right,
  .new-issue-submit-wrap {
    width: 100%;
    max-width: 440px;
  }
}
`
