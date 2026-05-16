import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resolveMediaUrl } from '../config/env';
import {
  fetchUserAssignedIssues,
  fetchUserComments,
  fetchUserProfile,
  fetchUserWatchedIssues,
  updateProfileAvatar,
  updateProfileBio,
} from '../services/profile';
import type {
  Issue,
  UserCommentItem,
  UserProfileDetail,
} from '../types/api';
import '../styles/profile.css';

/* ─── Tipus auxiliars ──────────────────────────────────────────────────── */

type TabKey = 'assigned' | 'watched' | 'comments';

type OrderField = 'type' | 'severity' | 'priority' | 'issue' | 'status' | 'modified';

type OrderValue = OrderField | `-${OrderField}` | '';

const ORDER_FIELDS: OrderField[] = [
  'type',
  'severity',
  'priority',
  'issue',
  'status',
  'modified',
];

const isOrderValue = (v: string | null): v is OrderValue => {
  if (!v) return true;
  const stripped = v.startsWith('-') ? v.slice(1) : v;
  return (ORDER_FIELDS as string[]).includes(stripped);
};

/* ─── Utilitats de presentació ─────────────────────────────────────────── */

/**
 * Assigna un color de marca segons el nom (type / severity / status…).
 * Mirror simple del que ja fa `IssueCard` en el llistat.
 */
const getColorByName = (name: string | null | undefined): string => {
  if (!name) return '#a1aab0';
  const n = name.toLowerCase();
  if (n.includes('bug') || n.includes('critical')) return '#e3405c';
  if (n.includes('question') || n.includes('minor')) return '#4ca1bc';
  if (n.includes('enhancement') || n.includes('normal')) return '#25b9ad';
  if (n.includes('important') || n.includes('high')) return '#f2a933';
  if (n.includes('ready') || n.includes('closed')) return '#12f47c';
  return '#6f61ba';
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/* ─── Ordenació d'incidències ──────────────────────────────────────────── */

const sortIssues = (issues: Issue[], order: OrderValue): Issue[] => {
  if (!order) return issues;
  const dir = order.startsWith('-') ? -1 : 1;
  const field = (order.startsWith('-') ? order.slice(1) : order) as OrderField;

  const fieldOf = (issue: Issue): string | number => {
    switch (field) {
      case 'type':
        return issue.type ?? '';
      case 'severity':
        return issue.severity ?? '';
      case 'priority':
        return issue.priority ?? '';
      case 'status':
        return issue.status ?? '';
      case 'issue':
        return issue.id;
      case 'modified':
        return new Date(issue.modified).getTime();
    }
  };

  return [...issues].sort((a, b) => {
    const av = fieldOf(a);
    const bv = fieldOf(b);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
};

/* ─── Component d'una capçalera ordenable ──────────────────────────────── */

interface SortHeaderProps {
  field: OrderField;
  current: OrderValue;
  onToggle: (next: OrderValue) => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

/**
 * Imita el comportament del Django: clic alterna entre `field` i `-field`,
 * un tercer clic neteja l'ordenació.
 */
const SortHeader: React.FC<SortHeaderProps> = ({
  field,
  current,
  onToggle,
  children,
  align = 'left',
}) => {
  const handleClick = () => {
    if (current === field) onToggle(`-${field}` as OrderValue);
    else if (current === `-${field}`) onToggle('');
    else onToggle(field);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="profile-sort-header"
      style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}
    >
      <span>{children}</span>
      <span className="profile-sort-arrows">
        <span className={`profile-arrow${current === field ? ' active' : ''}`}>▴</span>
        <span className={`profile-arrow${current === `-${field}` ? ' active' : ''}`}>▾</span>
      </span>
    </button>
  );
};

/* ─── Capçalera completa d'una taula d'incidències ─────────────────────── */

interface IssuesTableHeaderProps {
  current: OrderValue;
  onToggle: (next: OrderValue) => void;
  subjectLabel?: string;
}

const IssuesTableHeader: React.FC<IssuesTableHeaderProps> = ({
  current,
  onToggle,
  subjectLabel = 'ISSUE',
}) => (
  <div className="profile-table-header">
    <div className="profile-dots-col">
      <SortHeader field="type" current={current} onToggle={onToggle}>
        <span className="profile-letter-box">T</span>
      </SortHeader>
      <SortHeader field="severity" current={current} onToggle={onToggle}>
        <span className="profile-letter-box">S</span>
      </SortHeader>
      <SortHeader field="priority" current={current} onToggle={onToggle}>
        <span className="profile-letter-box">P</span>
      </SortHeader>
    </div>
    <div className="profile-subject-col">
      <SortHeader field="issue" current={current} onToggle={onToggle}>
        {subjectLabel}
      </SortHeader>
    </div>
    <div className="profile-status-col">
      <SortHeader field="status" current={current} onToggle={onToggle} align="right">
        STATUS
      </SortHeader>
    </div>
    <div className="profile-date-col">
      <SortHeader field="modified" current={current} onToggle={onToggle} align="right">
        MODIFIED
      </SortHeader>
    </div>
  </div>
);

/* ─── Fila d'una incidència ────────────────────────────────────────────── */

const IssueRow: React.FC<{ issue: Issue }> = ({ issue }) => (
  <div className="profile-issue-row">
    <div className="profile-dots-col" style={{ gap: 8 }}>
      <span
        className="profile-dot"
        style={{ background: getColorByName(issue.type) }}
        title={`Type: ${issue.type ?? '—'}`}
      />
      <span
        className="profile-dot"
        style={{ background: getColorByName(issue.severity) }}
        title={`Severity: ${issue.severity ?? '—'}`}
      />
      <span
        className="profile-dot"
        style={{ background: getColorByName(issue.priority) }}
        title={`Priority: ${issue.priority ?? '—'}`}
      />
    </div>
    <div className="profile-subject-col">
      <span className="profile-issue-id">#{issue.id}</span>
      <Link to={`/issues/${issue.id}`} className="profile-issue-title">
        {issue.subject}
      </Link>
    </div>
    <div className="profile-status-col">{issue.status ?? 'None'}</div>
    <div className="profile-date-col">{formatDate(issue.modified)}</div>
  </div>
);

/* ─── Pàgina principal ─────────────────────────────────────────────────── */

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { profile: ownProfile, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState<UserProfileDetail | null>(null);
  const [assigned, setAssigned] = useState<Issue[]>([]);
  const [watched, setWatched] = useState<Issue[]>([]);
  const [comments, setComments] = useState<UserCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isOwner = Boolean(
    ownProfile && username && ownProfile.username === username,
  );

  const tabParam = searchParams.get('tab');
  const activeTab: TabKey =
    tabParam === 'watched' || tabParam === 'comments'
      ? tabParam
      : 'assigned';

  const orderParam = searchParams.get('order_by');
  const currentOrder: OrderValue = isOrderValue(orderParam)
    ? (orderParam ?? '') as OrderValue
    : '';

  /* ─── Càrrega de dades ─────────────────────────────────────────────── */

  const loadAll = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const [profileData, assignedData, commentsData] = await Promise.all([
        fetchUserProfile(username),
        fetchUserAssignedIssues(username),
        fetchUserComments(username),
      ]);
      setProfile(profileData);
      setAssigned(assignedData);
      setComments(commentsData);
      setBioDraft(profileData.bio ?? '');

      // Les tasques observades només són accessibles per al propi usuari.
      if (ownProfile && ownProfile.username === username) {
        try {
          const watchedData = await fetchUserWatchedIssues(username);
          setWatched(watchedData);
        } catch {
          setWatched([]);
        }
      } else {
        setWatched([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [username, ownProfile]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAll();
  }, [loadAll]);

  /* ─── Helpers d'URL (pestanyes / ordenació) ─────────────────────────── */

  const updateParams = (patch: Partial<{ tab: TabKey; order_by: OrderValue }>) => {
    const next = new URLSearchParams(searchParams);
    if (patch.tab !== undefined) {
      if (patch.tab === 'assigned') next.delete('tab');
      else next.set('tab', patch.tab);
    }
    if (patch.order_by !== undefined) {
      if (patch.order_by === '') next.delete('order_by');
      else next.set('order_by', patch.order_by);
    }
    setSearchParams(next, { replace: false });
  };

  const setTab = (tab: TabKey) => updateParams({ tab });
  const setOrder = (order: OrderValue) => updateParams({ order_by: order });

  /* ─── Edició del perfil (bio + avatar) ──────────────────────────────── */

  const handleBioSave = async () => {
    setSavingBio(true);
    try {
      await updateProfileBio(bioDraft);
      setIsEditingBio(false);
      await Promise.all([loadAll(), refreshProfile()]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update bio');
    } finally {
      setSavingBio(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPendingAvatar(file ?? null);
  };

  const handleAvatarSave = async () => {
    if (!pendingAvatar) return;
    setSavingAvatar(true);
    try {
      await updateProfileAvatar(pendingAvatar);
      setPendingAvatar(null);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      await Promise.all([loadAll(), refreshProfile()]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update avatar');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (!ownProfile?.api_key) return;
    try {
      await navigator.clipboard.writeText(ownProfile.api_key);
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard copy failed', err);
    }
  };

  /* ─── Estats derivats ──────────────────────────────────────────────── */

  const sortedAssigned = useMemo(
    () => sortIssues(assigned, currentOrder),
    [assigned, currentOrder],
  );
  const sortedWatched = useMemo(
    () => sortIssues(watched, currentOrder),
    [watched, currentOrder],
  );

  const avatarUrl = resolveMediaUrl(profile?.avatar ?? null);
  const fullName =
    profile && (profile.first_name || profile.last_name)
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : profile?.username ?? username ?? '';

  /* ─── Render ────────────────────────────────────────────────────────── */

  if (loading && !profile) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading profile…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <p style={{ color: 'var(--color-bug)' }}>{error}</p>
        <button className="btn btn-outline" onClick={() => navigate('/')}>
          Back to issues
        </button>
      </div>
    );
  }

  if (!profile) {
    return <div style={{ padding: 40 }}>User not found.</div>;
  }

  return (
    <div className="profile-page-container">
      {/* ─── Barra lateral ──────────────────────────────────────────── */}
      <aside className="profile-sidebar">
        <div className="profile-avatar-container">
          {avatarUrl ? (
            <img src={avatarUrl} alt={profile.username} className="profile-avatar-square" />
          ) : (
            <div className="profile-avatar-square profile-avatar-placeholder">
              <svg viewBox="0 0 24 24" style={{ width: 80, fill: '#777' }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
          )}

          {isOwner && (
            <>
              <button
                type="button"
                className="profile-edit-photo-btn"
                onClick={() => avatarInputRef.current?.click()}
                title="Choose photo"
              >
                <svg viewBox="0 0 24 24" style={{ width: 18, fill: 'white' }}>
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              {pendingAvatar && (
                <button
                  type="button"
                  className="profile-save-photo-btn"
                  onClick={handleAvatarSave}
                  disabled={savingAvatar}
                  title="Save photo"
                >
                  <svg viewBox="0 0 24 24" style={{ width: 20, fill: 'white' }}>
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

        <h1 className="profile-name">{fullName}</h1>
        <div className="profile-handle">@{profile.username}</div>

        <div className="profile-stats">
          <div className="profile-stat-item">
            <span className="profile-stat-number">{profile.stats.assigned_issues}</span>
            <span className="profile-stat-label">
              Open
              <br />
              Assigned Issues
            </span>
          </div>
          <div className="profile-stat-item">
            <span className="profile-stat-number">{profile.stats.watched_issues}</span>
            <span className="profile-stat-label">
              Watched
              <br />
              Issues
            </span>
          </div>
          <div className="profile-stat-item">
            <span className="profile-stat-number">{profile.stats.comments}</span>
            <span className="profile-stat-label">Comments</span>
          </div>
        </div>

        {/* Bio (only editable when viewing own profile) */}
        <div className="profile-bio-container">
          {!isEditingBio && (
            <div className="profile-bio">{profile.bio || 'No bio provided.'}</div>
          )}
          {isOwner && !isEditingBio && (
            <button
              type="button"
              className="profile-btn-edit-bio"
              onClick={() => {
                setBioDraft(profile.bio ?? '');
                setIsEditingBio(true);
              }}
            >
              EDIT BIO
            </button>
          )}
          {isOwner && isEditingBio && (
            <div>
              <textarea
                className="profile-bio-textarea"
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="profile-btn-edit-bio profile-btn-save"
                  disabled={savingBio}
                  onClick={handleBioSave}
                >
                  {savingBio ? 'SAVING…' : 'SAVE'}
                </button>
                <button
                  type="button"
                  className="profile-btn-edit-bio profile-btn-cancel"
                  onClick={() => {
                    setIsEditingBio(false);
                    setBioDraft(profile.bio ?? '');
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* API Key (only own profile) */}
        {isOwner && ownProfile?.api_key && (
          <div className="profile-api-key-box">
            <div className="profile-api-key-label">Tu API Key</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="text"
                value={ownProfile.api_key}
                readOnly
                className="profile-api-key-input"
              />
              <button
                type="button"
                onClick={handleCopyApiKey}
                className="profile-api-key-copy"
                title="Copy"
              >
                <svg viewBox="0 0 24 24" style={{ width: 16, fill: 'white' }}>
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
              </button>
            </div>
            {apiKeyCopied && (
              <div className="profile-api-key-copied">¡Copied!</div>
            )}
          </div>
        )}
      </aside>

      {/* ─── Contingut principal ───────────────────────────────────── */}
      <section className="profile-main-content">
        <div className="profile-tabs">
          <button
            type="button"
            onClick={() => setTab('assigned')}
            className={`profile-tab-item${activeTab === 'assigned' ? ' active' : ''}`}
          >
            Open Assigned Issues
          </button>
          <button
            type="button"
            onClick={() => setTab('watched')}
            className={`profile-tab-item${activeTab === 'watched' ? ' active' : ''}`}
          >
            Watched Issues
          </button>
          <button
            type="button"
            onClick={() => setTab('comments')}
            className={`profile-tab-item${activeTab === 'comments' ? ' active' : ''}`}
          >
            Comments
          </button>
        </div>

        {activeTab === 'assigned' && (
          <div className="profile-issues-list-table">
            <IssuesTableHeader current={currentOrder} onToggle={setOrder} />
            {sortedAssigned.length === 0 ? (
              <div className="profile-empty">No assigned issues found.</div>
            ) : (
              sortedAssigned.map((issue) => <IssueRow key={issue.id} issue={issue} />)
            )}
          </div>
        )}

        {activeTab === 'watched' && (
          <div className="profile-issues-list-table">
            {!isOwner ? (
              <div className="profile-empty">
                This content is only visible to the profile owner.
              </div>
            ) : (
              <>
                <IssuesTableHeader
                  current={currentOrder}
                  onToggle={setOrder}
                  subjectLabel="SUBJECT"
                />
                {sortedWatched.length === 0 ? (
                  <div className="profile-empty">No watched issues found.</div>
                ) : (
                  sortedWatched.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="profile-issues-list-table profile-comments-table">
            {comments.length === 0 ? (
              <div className="profile-empty">No comments found.</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="profile-comment-item">
                  <div className="profile-comment-header">
                    <Link
                      to={`/issues/${comment.issue_id}`}
                      className="profile-comment-link"
                    >
                      #{comment.issue_id}
                    </Link>
                    <span className="profile-comment-date">
                      {formatDateTime(comment.created_at)}
                    </span>
                  </div>
                  <div className="profile-comment-text">{comment.text}</div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
