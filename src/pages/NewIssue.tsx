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
import { TaigaSelect } from '../components/TaigaSelect'
import { getDueDateButtonStyle } from '../utils/dueDateStyle'
import { useAuth } from '../context/AuthContext'

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

  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false)
  const [assigneeSearch, setAssigneeSearch] = useState('')

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

  const filteredUsers = users.filter((u) => {
    const q = assigneeSearch.trim().toLowerCase()
    if (!q) return true
    return (
      u.username.toLowerCase().includes(q) ||
      displayName(u).toLowerCase().includes(q)
    )
  })

  const selectedUser = users.find((u) => u.username === assigneeUsername) ?? null
  const dueDateStyle = getDueDateButtonStyle(dueDate, dueDateRules)
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
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                      <button type="button" onClick={() => removeTag(tag.name)} title={`Remove ${tag.name}`}>
                        &times;
                      </button>
                    </span>
                  ))}
                </div>

                {allTags.length > 0 && (
                  <div className="new-issue-tags-row" style={{ opacity: 0.85 }}>
                    {allTags
                      .filter((t) => !selectedTags.some((s) => s.name === t.name))
                      .slice(0, 12)
                      .map((tag) => (
                        <button
                          key={tag.name}
                          type="button"
                          className="new-issue-add-tag-btn"
                          onClick={() => addExistingTag(tag)}
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

            <div className="new-issue-right">
              <div className="new-issue-status-select">
                <select value={statusName} onChange={(e) => setStatusName(e.target.value)}>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" /></svg>
              </div>

              <div className="assignee-select-container">
                <div className="assignee-display">
                  {!selectedUser ? (
                    <>
                      <div className="assignee-avatar-lg">
                        <svg style={{ width: 24, height: 24, fill: '#fff' }} viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <div className="assignee-name muted">Not assigned</div>
                    </>
                  ) : (
                    <>
                      <div className="assignee-avatar-lg">
                        {selectedUser.avatar ? (
                          <img src={selectedUser.avatar} alt="" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#c5a3cd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                            {userInitial(selectedUser)}
                          </div>
                        )}
                      </div>
                      <div className="assignee-name">
                        <span>{displayName(selectedUser)}</span>
                        <button type="button" className="assignee-clear" onClick={() => setAssigneeUsername(null)} title="Cancel assignment">
                          &times;
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="assignee-actions">
                  <div className={`menu-trigger-wrapper${assigneeMenuOpen ? ' open' : ''}`}>
                    <button
                      type="button"
                      className="btn-action"
                      onClick={() => setAssigneeMenuOpen((v) => !v)}
                    >
                      <span style={{ color: '#70728f', fontWeight: 600 }}>+</span> Add assigned
                    </button>
                    <div className="assignee-select-menu">
                      <div className="assignee-search">
                        <input
                          type="text"
                          placeholder="Search..."
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                        />
                      </div>
                      <button type="button" className="user-item-label" onClick={() => { setAssigneeUsername(null); setAssigneeMenuOpen(false) }}>
                        <div className="user-avatar-small">
                          <svg style={{ width: 18, height: 18, fill: '#ccc' }} viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                        <span className="user-item-name">None</span>
                      </button>
                      {filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          className="user-item-label"
                          onClick={() => {
                            setAssigneeUsername(u.username)
                            setAssigneeMenuOpen(false)
                          }}
                        >
                          <div className="user-avatar-small">
                            {u.avatar ? (
                              <img src={u.avatar} alt="" />
                            ) : (
                              <span style={{ color: '#434456', fontWeight: 600 }}>{userInitial(u)}</span>
                            )}
                          </div>
                          <span className="user-item-name">{displayName(u)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <button
                      type="button"
                      className="btn-action"
                      onClick={() => profile && setAssigneeUsername(profile.username)}
                    >
                      Assign to me
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <TaigaSelect label="type" options={types} value={typeName} onChange={setTypeName} />
                <TaigaSelect label="severity" options={severities} value={severityName} onChange={setSeverityName} />
                <TaigaSelect label="priority" options={priorities} value={priorityName} onChange={setPriorityName} />
              </div>

              <div className="new-issue-extras">
                <label
                  className="due-date-button"
                  title="Select due date"
                  style={{ background: dueDateStyle.background }}
                >
                  <svg
                    style={{ width: 18, height: 18, fill: 'none', stroke: dueDateStyle.iconColor, strokeWidth: 2, pointerEvents: 'none' }}
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    title="Select due date"
                  />
                </label>

                <button
                  type="button"
                  className={`block-toggle${isBlocked ? ' active' : ''}`}
                  title="Block issue"
                  onClick={() => setIsBlocked((v) => !v)}
                >
                  <svg style={{ width: 18, height: 18, stroke: '#009aa6', fill: 'none', strokeWidth: 2, pointerEvents: 'none' }} viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </button>

                {isBlocked && (
                  <input
                    type="text"
                    className="blocked-reason-input"
                    placeholder="Why is this blocked?"
                    value={blockedReason}
                    onChange={(e) => setBlockedReason(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          {error && <p className="new-issue-error">{error}</p>}

          <div className="new-issue-submit-wrap">
            <button type="submit" className="new-issue-submit" disabled={submitting}>
              {submitting ? 'CREATING...' : 'CREATE'}
            </button>
          </div>
        </form>
      </div>
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
  background: rgba(255, 255, 255, 0.96);
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
  color: #434456;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
.new-issue-title {
  text-align: center;
  font-size: 26px;
  font-weight: 500;
  color: #434456;
  margin-bottom: 40px;
  margin-top: 0;
}
.new-issue-form {
  display: flex;
  flex-direction: column;
  gap: 40px;
  align-items: center;
}
.new-issue-columns {
  display: flex;
  gap: 40px;
  width: 100%;
  justify-content: center;
}
.new-issue-left {
  width: 440px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.new-issue-right {
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.new-issue-subject {
  width: 100%;
  border: 1px solid #b5bbcd;
  border-radius: 3px;
  padding: 12px 15px;
  font-size: 18px;
  font-weight: 400;
  color: #434456;
  background: #fff;
  outline: none;
  box-sizing: border-box;
}
.new-issue-description {
  width: 100%;
  border: 1px solid #b5bbcd;
  border-radius: 3px;
  padding: 15px;
  font-size: 14px;
  color: #70728f;
  background: #fff;
  min-height: 200px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
}
.new-issue-tags-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.new-issue-add-tag-btn {
  border: 1px solid #e2e3e9;
  background: #f9f9fb;
  padding: 4px 10px;
  border-radius: 4px;
  color: #009aa6;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.new-issue-tag-badge {
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #fff;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;
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
  opacity: 0.6;
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
  border: 1px solid #b5bbcd;
  border-radius: 3px 0 0 3px;
  padding: 4px 8px;
  font-size: 13px;
  width: 120px;
  outline: none;
}
.new-issue-inline-tag button {
  background: #e2e3e9;
  border: none;
  border-radius: 0 3px 3px 0;
  color: #444;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  cursor: pointer;
}
.new-issue-attachments-bar {
  display: flex;
  background: #e2e3e9;
  border-radius: 3px;
  padding-left: 15px;
  align-items: center;
  justify-content: space-between;
  height: 38px;
}
.new-issue-attachments-bar span {
  color: #434456;
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
  background: #f0f1f5;
  height: 100%;
  padding: 0 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #434456;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  border-right: 1px solid #d1d2d9;
}
.new-issue-attachments-actions button.upload {
  background: #7de8cc;
  border: none;
  border-radius: 0 3px 3px 0;
  color: #0d4a34;
}
.new-issue-attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f9f9fb;
  border-radius: 3px;
}
.new-issue-status-select {
  background: #6a708a;
  border-radius: 3px;
  position: relative;
}
.new-issue-status-select select {
  width: 100%;
  appearance: none;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  padding: 10px 15px;
  cursor: pointer;
  outline: none;
  font-family: inherit;
}
.new-issue-status-select svg {
  position: absolute;
  right: 10px;
  top: 14px;
  width: 14px;
  height: 14px;
  fill: #fff;
  pointer-events: none;
}
.new-issue-attribute-row {
  background: #f8f9fb;
  border-radius: 3px;
  padding: 12px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.new-issue-attribute-row > span {
  color: #70728f;
  font-size: 14px;
  font-weight: 500;
  text-transform: lowercase;
}
.taiga-select {
  position: relative;
  cursor: pointer;
}
.taiga-select-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}
.taiga-select-trigger span {
  font-size: 15px;
  color: #434456;
}
.taiga-select .color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}
.taiga-select-menu {
  display: none;
  position: absolute;
  top: 100%;
  right: -10px;
  background: #fff;
  min-width: 140px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e3e9;
  border-radius: 3px;
  z-index: 100;
  padding: 5px 0;
  flex-direction: column;
}
.taiga-select.open .taiga-select-menu,
.taiga-select:hover .taiga-select-menu {
  display: flex;
}
.taiga-option {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 15px;
  color: #009aa6;
  gap: 12px;
  text-align: left;
  border: none;
  background: none;
  width: 100%;
  font-family: inherit;
}
.taiga-option:hover {
  background: #f4f6f8;
}
.assignee-select-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.assignee-display {
  display: flex;
  align-items: center;
  gap: 12px;
}
.assignee-avatar-lg {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: #e2e3e9;
  flex-shrink: 0;
}
.assignee-avatar-lg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.assignee-name {
  color: #434456;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}
.assignee-name.muted {
  color: #70728f;
}
.assignee-clear {
  cursor: pointer;
  font-size: 18px;
  color: #a1a1b5;
  line-height: 1;
  background: none;
  border: none;
  padding: 0;
}
.assignee-actions {
  display: flex;
  gap: 10px;
}
.btn-action {
  width: 100%;
  border: 1px solid #d8dee9;
  background: #fff;
  padding: 10px;
  font-size: 14px;
  color: #4c566a;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-family: inherit;
  transition: background 0.2s;
  box-sizing: border-box;
}
.btn-action:hover {
  background: #f8f9fb;
}
.menu-trigger-wrapper {
  position: relative;
  flex: 1;
}
.assignee-select-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  width: 280px;
  background: #fff;
  border: 1px solid #e2e3e9;
  border-radius: 4px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 5px 0;
  flex-direction: column;
  max-height: 250px;
  overflow-y: auto;
  box-sizing: border-box;
}
.menu-trigger-wrapper.open .assignee-select-menu {
  display: flex;
}
.assignee-search {
  padding: 10px;
  border-bottom: 1px solid #eee;
  background: #f9f9fb;
  display: flex;
  gap: 5px;
}
.assignee-search input {
  flex: 1;
  font-size: 13px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
}
.user-item-label {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  cursor: pointer;
  transition: background 0.1s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
}
.user-item-label:hover {
  background: #f4f6f8;
}
.user-avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e3e9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.user-avatar-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-item-name {
  font-size: 14px;
  color: #434456;
}
.new-issue-extras {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.due-date-button {
  width: 44px;
  height: 38px;
  border-radius: 3px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  border: none;
}
.due-date-button input[type='date'] {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
  background: transparent;
  z-index: 10;
}
.block-toggle {
  width: 44px;
  height: 38px;
  background: #f8f9fb;
  border-radius: 3px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}
.block-toggle.active {
  background-color: #e3405c !important;
}
.block-toggle.active svg {
  stroke: #ffffff !important;
}
.blocked-reason-input {
  width: 100%;
  margin-top: 10px;
  padding: 8px 12px;
  border: 1px solid #d8dee9;
  border-radius: 3px;
  font-size: 14px;
  outline: none;
  background: #fff;
  box-sizing: border-box;
}
.new-issue-submit-wrap {
  width: 740px;
}
.new-issue-submit {
  width: 100%;
  background: #7de8cc;
  border: none;
  border-radius: 3px;
  height: 40px;
  color: #0d4a34;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  font-family: inherit;
}
.new-issue-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.new-issue-error {
  color: #e3405c;
  text-align: center;
  font-size: 14px;
}
.new-issue-hint {
  font-size: 11px;
  color: #70728f;
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
