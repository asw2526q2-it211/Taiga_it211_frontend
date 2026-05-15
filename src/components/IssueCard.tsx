import React from 'react';
import type { Issue } from '../types/api';

interface IssueCardProps {
  issue: Issue;
}

/**
 * Funció d'utilitat per assignar colors segons el nom del recurs,
 * ja que el backend retorna només el text en el llistat general.
 */
const getColorByName = (name: string | null): string => {
  if (!name) return '#ccc';
  const n = name.toLowerCase();
  if (n.includes('bug') || n.includes('critical')) return 'var(--color-bug)';
  if (n.includes('question') || n.includes('minor')) return 'var(--color-question)';
  if (n.includes('enhancement') || n.includes('normal')) return 'var(--color-enhancement)';
  if (n.includes('important') || n.includes('high')) return 'var(--color-important)';
  if (n.includes('ready') || n.includes('closed')) return 'var(--color-normal)';
  return 'var(--color-purple)';
};

/**
 * Component visual per a una incidència individual.
 * Adaptat per rebre les dades de l'API de Render (on tipus/estat són strings).
 */
export const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center', transition: 'transform 0.2s ease' }}>
      
      {/* Indicadors laterals de color */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '90px' }}>
        {issue.type && (
          <span className="badge" style={{ backgroundColor: getColorByName(issue.type), color: '#fff', textAlign: 'center' }}>
            {issue.type}
          </span>
        )}
        {issue.severity && (
          <span className="badge" style={{ backgroundColor: getColorByName(issue.severity), color: '#fff', textAlign: 'center', opacity: 0.9 }}>
            {issue.severity}
          </span>
        )}
      </div>
      
      {/* Contingut principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem' }}>#{issue.id}</span>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
            <a href={`/issues/${issue.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
              {issue.subject}
            </a>
          </h3>
          
          {/* Tags (etiquetes) */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {issue.tags && issue.tags.map((tag, idx) => (
              <span key={idx} className="badge" style={{ backgroundColor: tag.color || 'var(--color-teal)', color: '#fff', fontSize: '0.7rem' }}>
                {tag.name}
              </span>
            ))}
          </div>
        </div>
        
        {/* Metadades inferiors */}
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <span>
            Estat: <strong style={{ color: getColorByName(issue.status), fontWeight: 700 }}>{issue.status || 'Sense estat'}</strong>
          </span>
          <span>
            Assignat a: <strong style={{ color: 'var(--text-primary)' }}>{issue.assigned || 'Ningú'}</strong>
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            Modificat: {new Date(issue.modified).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      {/* Icona d'estat de bloqueig si existeix */}
      {issue.is_blocked && (
        <div title="Bloquejada" style={{ color: 'var(--color-bug)', display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      )}
    </div>
  );
};
