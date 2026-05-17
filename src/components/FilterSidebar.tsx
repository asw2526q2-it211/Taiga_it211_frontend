import React, { useState } from 'react';
import type { ColorResource, StatusResource, ApiUser, Issue } from '../types/api';

export interface FilterSidebarProps {
  types: ColorResource[];
  severities: ColorResource[];
  priorities: ColorResource[];
  statuses: StatusResource[];
  users: ApiUser[];
  allTags: string[];
  issues: Issue[];
  
  draftFilters: {
    types: string[];
    severities: string[];
    priorities: string[];
    statuses: string[];
    tags: string[];
    assignees: string[];
    creators: string[];
  };
  
  onToggleFilter: (category: 'types' | 'severities' | 'priorities' | 'statuses' | 'tags' | 'assignees' | 'creators', value: string) => void;
  onApply: () => void;
  onClear: () => void;
}

/**
 * Component de la barra lateral per filtrar les incidències de manera dinàmica.
 * Implementació elegant que reprodueix filtres, colors reals, avatars, cercles i pills amb comptadors de la maqueta premium.
 */
export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  types,
  severities,
  priorities,
  statuses,
  users,
  allTags,
  issues,
  draftFilters,
  onToggleFilter,
  onApply,
  onClear
}) => {
  // Estat de desplegament de cada secció (com a la maqueta, 'Type' comença obert)
  const [openSections, setOpenSections] = useState({
    types: true,
    severities: false,
    priorities: false,
    statuses: false,
    tags: false,
    assignees: false,
    creators: false
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Comprovar si hi ha filtres actius en el draft
  const hasActiveFilters = Object.values(draftFilters).some(arr => arr.length > 0);

  // Helper per a renderitzar la capçalera de secció amb chevron que gira
  const renderSectionHeader = (title: string, isOpen: boolean, onClick: () => void) => (
    <div 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        fontWeight: 600, 
        fontSize: '0.88rem', 
        color: 'var(--text-primary)', 
        cursor: 'pointer',
        padding: '0.4rem 0',
        userSelect: 'none'
      }}
    >
      <span>{title}</span>
      <span style={{ 
        color: 'var(--color-teal)', 
        fontSize: '0.85rem',
        fontWeight: 'bold',
        transition: 'transform 0.2s ease',
        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
      }}>
        ›
      </span>
    </div>
  );

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Títol i botons d'acció */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Custom filters</h3>
        <button
          type="button"
          onClick={onApply}
          style={{
            background: 'var(--color-teal)',
            border: 'none',
            color: 'white',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '0.3rem 0.75rem',
            borderRadius: '6px',
          }}
        >
          Apply
        </button>
      </div>

      {/* Reset button — always visible */}
      <button
        type="button"
        onClick={onClear}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          width: '100%',
          padding: '0.45rem 0.75rem',
          marginBottom: '1rem',
          borderRadius: '8px',
          border: hasActiveFilters ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border-color)',
          background: hasActiveFilters ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,0.03)',
          color: hasActiveFilters ? '#ef4444' : 'var(--text-secondary)',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box',
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: 'currentColor', fill: 'none', strokeWidth: 2.5 }}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Reset filters
        {hasActiveFilters && (
          <span style={{
            marginLeft: '0.2rem',
            background: '#ef4444',
            color: 'white',
            borderRadius: '10px',
            padding: '0 0.35rem',
            fontSize: '0.65rem',
            fontWeight: 700,
            lineHeight: '1.4',
          }}>
            {Object.values(draftFilters).filter(arr => arr.length > 0).length}
          </span>
        )}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        
        {/* 1. TYPE SECTION */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          {renderSectionHeader('Type', openSections.types, () => toggleSection('types'))}
          {openSections.types && (
            <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.25rem' }}>
              {types.map(t => {
                const isChecked = draftFilters.types.includes(t.name);
                const count = issues.filter(issue => issue.type === t.name).length;
                return (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: t.color || '#cccccc', display: 'inline-block' }} />
                      <span>{t.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => onToggleFilter('types', t.name)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#edf2f7', color: 'var(--text-secondary)', padding: '0.1rem 0.35rem', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>
                        {count}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. SEVERITY SECTION */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          {renderSectionHeader('Severity', openSections.severities, () => toggleSection('severities'))}
          {openSections.severities && (
            <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.25rem' }}>
              {severities.map(s => {
                const isChecked = draftFilters.severities.includes(s.name);
                const count = issues.filter(issue => issue.severity === s.name).length;
                return (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.color || '#cccccc', display: 'inline-block' }} />
                      <span>{s.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => onToggleFilter('severities', s.name)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#edf2f7', color: 'var(--text-secondary)', padding: '0.1rem 0.35rem', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>
                        {count}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. PRIORITIES SECTION */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          {renderSectionHeader('Priorities', openSections.priorities, () => toggleSection('priorities'))}
          {openSections.priorities && (
            <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.25rem' }}>
              {priorities.map(p => {
                const isChecked = draftFilters.priorities.includes(p.name);
                const count = issues.filter(issue => issue.priority === p.name).length;
                return (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: p.color || '#cccccc', display: 'inline-block' }} />
                      <span>{p.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => onToggleFilter('priorities', p.name)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#edf2f7', color: 'var(--text-secondary)', padding: '0.1rem 0.35rem', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>
                        {count}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. STATUS SECTION */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          {renderSectionHeader('Status', openSections.statuses, () => toggleSection('statuses'))}
          {openSections.statuses && (
            <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.25rem' }}>
              {statuses.map(s => {
                const isChecked = draftFilters.statuses.includes(s.name);
                const count = issues.filter(issue => issue.status === s.name).length;
                return (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.color || '#cccccc', display: 'inline-block' }} />
                      <span>{s.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => onToggleFilter('statuses', s.name)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#edf2f7', color: 'var(--text-secondary)', padding: '0.1rem 0.35rem', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>
                        {count}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. TAGS SECTION */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          {renderSectionHeader('Tags', openSections.tags, () => toggleSection('tags'))}
          {openSections.tags && (
            <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.25rem' }}>
              {allTags.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No tags available</div>
              ) : (
                allTags.map((tagName, idx) => {
                  const isChecked = draftFilters.tags.includes(tagName);
                  const count = issues.filter(issue => (issue.tags || []).some(t => t.name === tagName)).length;
                  // dynamic mock color for tag badges in list
                  const tagColor = '#009aa6'; 
                  return (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          borderColor: tagColor,
                          backgroundColor: `${tagColor}12`,
                          color: tagColor,
                          borderStyle: 'solid',
                          borderWidth: '1px',
                          padding: '0.08rem 0.35rem',
                          borderRadius: '8px',
                          fontSize: '0.65rem',
                          fontWeight: 700
                        }}>
                          {tagName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => onToggleFilter('tags', tagName)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#edf2f7', color: 'var(--text-secondary)', padding: '0.1rem 0.35rem', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>
                          {count}
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 6. ASSIGNED TO SECTION */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          {renderSectionHeader('Assigned to', openSections.assignees, () => toggleSection('assignees'))}
          {openSections.assignees && (
            <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.25rem' }}>
              {users.map(u => {
                const isChecked = draftFilters.assignees.includes(u.username);
                const count = issues.filter(issue => issue.assigned === u.username).length;
                const initial = u.username.charAt(0).toUpperCase();
                return (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {u.avatar ? (
                        <img 
                          src={u.avatar.startsWith('/') ? `https://taiga-it211.onrender.com${u.avatar}` : u.avatar} 
                          alt="" 
                          style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#c5a3cd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'white', fontWeight: 700 }}>
                          {initial}
                        </div>
                      )}
                      <span>{u.first_name || u.username}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => onToggleFilter('assignees', u.username)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#edf2f7', color: 'var(--text-secondary)', padding: '0.1rem 0.35rem', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>
                        {count}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 7. CREATED BY SECTION */}
        <div style={{ paddingBottom: '0.25rem' }}>
          {renderSectionHeader('Created by', openSections.creators, () => toggleSection('creators'))}
          {openSections.creators && (
            <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.25rem' }}>
              {users.map(u => {
                const isChecked = draftFilters.creators.includes(u.username);
                const count = issues.filter(issue => issue.creator === u.username).length;
                const initial = u.username.charAt(0).toUpperCase();
                return (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {u.avatar ? (
                        <img 
                          src={u.avatar.startsWith('/') ? `https://taiga-it211.onrender.com${u.avatar}` : u.avatar} 
                          alt="" 
                          style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#c5a3cd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'white', fontWeight: 700 }}>
                          {initial}
                        </div>
                      )}
                      <span>{u.first_name || u.username}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => onToggleFilter('creators', u.username)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#edf2f7', color: 'var(--text-secondary)', padding: '0.1rem 0.35rem', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>
                        {count}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
