import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/client';
import type { Issue, ColorResource, StatusResource, ApiUser } from '../types/api';
import { FilterSidebar } from '../components/FilterSidebar';
import { useAuth } from '../context/AuthContext';

/**
 * Pàgina principal del llistat d'incidències.
 * Redissenyada completament amb una estètica de taula premium i components coincidents.
 */
export const IssueList: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Metadata arrays per a resoldre els colors reals dels punts
  const [types, setTypes] = useState<ColorResource[]>([]);
  const [severities, setSeverities] = useState<ColorResource[]>([]);
  const [priorities, setPriorities] = useState<ColorResource[]>([]);
  const [statuses, setStatuses] = useState<StatusResource[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);

  // Estats de cerca i visualització
  const [searchQuery, setSearchQuery] = useState('');
  const [showTags, setShowTags] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Draft and committed filter selections for the dynamic sidebar
  const [draftFilters, setDraftFilters] = useState({
    types: [] as string[],
    severities: [] as string[],
    priorities: [] as string[],
    statuses: [] as string[],
    tags: [] as string[],
    assignees: [] as string[],
    creators: [] as string[],
  });
  const [appliedFilters, setAppliedFilters] = useState({
    types: [] as string[],
    severities: [] as string[],
    priorities: [] as string[],
    statuses: [] as string[],
    tags: [] as string[],
    assignees: [] as string[],
    creators: [] as string[],
  });

  const handleToggleFilter = (category: 'types' | 'severities' | 'priorities' | 'statuses' | 'tags' | 'assignees' | 'creators', value: string) => {
    setDraftFilters(prev => {
      const currentList = prev[category];
      const newList = currentList.includes(value)
        ? currentList.filter(item => item !== value)
        : [...currentList, value];
      return { ...prev, [category]: newList };
    });
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...draftFilters });
  };

  const handleClearFilters = () => {
    const cleared = {
      types: [],
      severities: [],
      priorities: [],
      statuses: [],
      tags: [],
      assignees: [],
      creators: [],
    };
    setDraftFilters(cleared);
    setAppliedFilters(cleared);
  };

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [typesRes, sevRes, priRes, statRes, usersRes] = await Promise.all([
          apiRequest<ColorResource[]>('types/'),
          apiRequest<ColorResource[]>('severities/'),
          apiRequest<ColorResource[]>('priorities/'),
          apiRequest<StatusResource[]>('statuses/'),
          apiRequest<ApiUser[]>('users/'),
        ]);

        setTypes(typesRes);
        setSeverities(sevRes);
        setPriorities(priRes);
        setStatuses(statRes);
        setUsers(usersRes);
      } catch (err) {
        console.error('Failed to load metadata', err);
      }
    };

    loadMeta();
  }, [currentUser]);

  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = 'issues/';
        const trimmed = searchQuery.trim();
        if (trimmed) {
          if (/^\d+$/.test(trimmed)) {
            url += `?id=${trimmed}`;
          } else {
            url += `?subject=${encodeURIComponent(trimmed)}`;
          }
        }
        const issuesRes = await apiRequest<Issue[]>(url);
        setIssues(issuesRes);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to fetch issues');
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchIssues();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  const allTags = Array.from(new Set(
    issues.flatMap(issue => (issue.tags || []).map(t => t.name))
  ));

  const filteredIssues = issues.filter(issue => {
    if (appliedFilters.types.length > 0 && !appliedFilters.types.includes(issue.type || '')) return false;
    if (appliedFilters.severities.length > 0 && !appliedFilters.severities.includes(issue.severity || '')) return false;
    if (appliedFilters.priorities.length > 0 && !appliedFilters.priorities.includes(issue.priority || '')) return false;
    if (appliedFilters.statuses.length > 0 && !appliedFilters.statuses.includes(issue.status || '')) return false;
    if (appliedFilters.assignees.length > 0 && !appliedFilters.assignees.includes(issue.assigned || '')) return false;
    if (appliedFilters.creators.length > 0 && !appliedFilters.creators.includes(issue.creator || '')) return false;
    if (appliedFilters.tags.length > 0) {
      const issueTagNames = (issue.tags || []).map(t => t.name);
      const hasTag = appliedFilters.tags.some(t => issueTagNames.includes(t));
      if (!hasTag) return false;
    }
    return true;
  });

  // Helpers de format i colors
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const day = d.getDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return '—';
    }
  };

  const checkIsOverdue = (dueDateStr: string | null) => {
    if (!dueDateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  };

  const handleStatusChange = async (issueId: number, newStatus: string) => {
    try {
      setError(null);
      await apiRequest(`issues/${issueId}/`, {
        method: 'PUT',
        body: { status: newStatus }
      });
      setIssues(prev => prev.map(issue => {
        if (issue.id === issueId) {
          return { ...issue, status: newStatus };
        }
        return issue;
      }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update status.');
      }
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleAssigneeChange = async (issueId: number, newAssignee: string) => {
    try {
      setError(null);
      await apiRequest(`issues/${issueId}/`, {
        method: 'PUT',
        body: { assigned: newAssignee || null }
      });
      setIssues(prev => prev.map(issue => {
        if (issue.id === issueId) {
          return { ...issue, assigned: newAssignee || null };
        }
        return issue;
      }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update assignee.');
      }
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: '3rem' }}>
      
      {/* Títol principal */}
      <h2 style={{ 
        color: 'var(--color-teal)', 
        fontWeight: 800, 
        margin: '0 0 1.5rem 0', 
        fontSize: '2rem',
        letterSpacing: '-0.02em'
      }}>
        Issues
      </h2>

      {/* Barra de controls premium dalt */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem', 
        backgroundColor: 'var(--bg-surface)', 
        padding: '0.75rem 1rem', 
        borderRadius: '8px', 
        border: '1px solid var(--border-color)', 
        marginBottom: '1.25rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
          
          {/* Botó de Filtres */}
          <button 
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: showFilters ? 'rgba(20, 163, 142, 0.1)' : 'var(--bg-surface)',
              color: showFilters ? 'var(--color-teal)' : 'var(--text-secondary)',
              border: `1px solid ${showFilters ? 'var(--color-teal)' : 'var(--border-color)'}`,
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}>
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            Filters
          </button>

          {/* Input de Cerca */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
            <input 
              type="text" 
              placeholder="subject or reference" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 2.2rem 0.45rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                outline: 'none',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                transition: 'all 0.2s'
              }}
            />
            <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 2.5 }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>

          {/* Toggle de Mostrar Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setShowTags(!showTags)}
              style={{
                position: 'relative',
                width: '38px',
                height: '20px',
                borderRadius: '10px',
                backgroundColor: showTags ? 'var(--color-teal)' : '#cbd5e0',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                padding: 0
              }}
            >
              <span style={{
                position: 'absolute',
                left: showTags ? '20px' : '2px',
                top: '2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Tags</span>
          </div>
        </div>

        {/* Accions dreta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => navigate('/issues/new')}
            style={{
              backgroundColor: 'var(--color-teal)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.03em',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(20, 163, 142, 0.15)',
              transition: 'all 0.2s ease'
            }}
          >
            + NEW ISSUE
          </button>

          <button
            type="button"
            style={{
              backgroundColor: '#edf2f7',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 2.5 }}>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contingut principal (Filtres + Taula) */}
      <div className="main-layout-container">
        {showFilters && (
          <aside className="filters-aside">
            <FilterSidebar 
              types={types}
              severities={severities}
              priorities={priorities}
              statuses={statuses}
              users={users}
              allTags={allTags}
              issues={issues}
              draftFilters={draftFilters}
              onToggleFilter={handleToggleFilter}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </aside>
        )}

        <div style={{ flex: 1, overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading issues...</div>
          ) : error ? (
            <div style={{ color: 'var(--color-bug)', padding: '1rem', background: '#fce8eb', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          ) : filteredIssues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              No issues found.
            </div>
          ) : (
            <div>
              {/* Capçaleres de Taula */}
              <div className="issue-list-grid hide-tablet" style={{
                padding: '0.5rem 1rem',
                marginBottom: '0.35rem',
                opacity: 0.85
              }}>
                <div style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</div>
                <div style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Severity</div>
                <div style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</div>
                <div style={{ textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue</div>
                <div style={{ textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                <div style={{ textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modified</div>
                <div style={{ textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assign To</div>
              </div>

              {/* Llista d'incidències */}
              {filteredIssues.map(issue => {
                const typeColor = types.find(t => t.name === issue.type)?.color || '#cccccc';
                const severityColor = severities.find(s => s.name === issue.severity)?.color || '#cccccc';
                const priorityColor = priorities.find(p => p.name === issue.priority)?.color || '#cccccc';
                const statusColor = statuses.find(s => s.name === issue.status)?.color || '#9f7aea';
                const assigneeUser = users.find(u => u.username === issue.assigned);
                const isOverdue = checkIsOverdue(issue.due_date);

                return (
                  <div 
                    key={issue.id}
                    onClick={() => navigate(`/issues/${issue.id}`)}
                    className="issue-list-grid"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      padding: '0.75rem 1rem',
                      marginBottom: '0.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(20, 163, 142, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    {/* 1. Type Dot */}
                    <div className="hide-tablet" style={{ display: 'flex', justifyContent: 'center' }}>
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: typeColor,
                        display: 'inline-block'
                      }} />
                    </div>

                    {/* 2. Severity Dot */}
                    <div className="hide-tablet" style={{ display: 'flex', justifyContent: 'center' }}>
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: severityColor,
                        display: 'inline-block'
                      }} />
                    </div>

                    {/* 3. Priority Dot */}
                    <div className="hide-tablet" style={{ display: 'flex', justifyContent: 'center' }}>
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: priorityColor,
                        display: 'inline-block'
                      }} />
                    </div>

                    {/* 4. Issue Info (Ref, Subject, Overdue Clock, Tags) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem 0.5rem', overflow: 'hidden', paddingRight: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--color-teal)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        #{issue.id}
                      </span>
                      <span style={{ 
                        fontWeight: 600, 
                        color: 'var(--text-primary)', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        fontSize: '0.9rem' 
                      }}>
                        {issue.subject}
                      </span>
                      
                      {isOverdue && (
                        <span title="Overdue!" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--color-critical)', flexShrink: 0 }}>
                          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 2.5 }}>
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </span>
                      )}

                      {/* Glassmorphic Tags Render */}
                      {showTags && issue.tags && issue.tags.map((tag, idx) => {
                        const tagColorVal = tag.color || 'var(--color-teal)';
                        return (
                          <span
                            key={idx}
                            style={{
                              borderColor: tagColorVal,
                              backgroundColor: `${tagColorVal}15`,
                              color: tagColorVal,
                              borderStyle: 'solid',
                              borderWidth: '1px',
                              padding: '0.12rem 0.4rem',
                              borderRadius: '8px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                          >
                            {tag.name}
                          </span>
                        );
                      })}
                    </div>

                    {/* 5. Status dropdown chevron */}
                    <div 
                      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '0.8rem', 
                        color: statusColor,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {issue.status || '—'}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                        ▼
                      </span>
                      <select
                        value={issue.status || ''}
                        onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          border: 'none',
                          outline: 'none'
                        }}
                      >
                        <option value="" disabled>Select Status</option>
                        {statuses.map(st => (
                          <option key={st.id} value={st.name}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 6. Date Modified */}
                    <div className="hide-tablet" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {formatDate(issue.modified)}
                    </div>

                    {/* 7. Assignee User Avatar + drop indicator */}
                    <div 
                      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {assigneeUser ? (
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#c5a3cd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {assigneeUser.avatar ? (
                            <img
                              src={assigneeUser.avatar.startsWith('/') ? `https://taiga-it211.onrender.com${assigneeUser.avatar}` : assigneeUser.avatar}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
                              {assigneeUser.first_name ? assigneeUser.first_name.charAt(0).toUpperCase() : assigneeUser.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          border: '1px dashed var(--border-color)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: 'var(--text-secondary)',
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}>
                          ☆
                        </div>
                      )}
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                        ▼
                      </span>
                      <select
                        value={issue.assigned || ''}
                        onChange={(e) => handleAssigneeChange(issue.id, e.target.value)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          border: 'none',
                          outline: 'none'
                        }}
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u.id} value={u.username}>
                            {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
