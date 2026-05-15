import React, { useEffect, useState } from 'react';
import { apiRequest } from '../services/client';
import type { Issue } from '../types/api';
import { IssueCard } from '../components/IssueCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { useAuth } from '../context/AuthContext';

/**
 * Pàgina principal del llistat d'incidències.
 * Gestiona la càrrega de dades i reacciona als canvis d'usuari (API Key).
 */
export const IssueList: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]); // Estat per guardar la llista d'incidències
  const [loading, setLoading] = useState(true);      // Estat de càrrega
  const [error, setError] = useState<string | null>(null); // Estat d'errors
  const { currentUser } = useAuth(); // Accedim a l'usuari actual per detectar canvis de clau API

  useEffect(() => {
    // Funció asíncrona per demanar les dades al backend
    const fetchIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        // Cridem a l'API. El client ja posarà l'Authorization header correcte.
        const data = await apiRequest<Issue[]>('issues/');
        setIssues(data);
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

    fetchIssues();
  }, [currentUser]); // Si l'usuari canvia, tornem a carregar les dades automatically!

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <aside style={{ width: '250px', flexShrink: 0 }}>
        <FilterSidebar />
      </aside>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Issues</h2>
          <button className="btn btn-primary">
            + NEW ISSUE
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
        ) : error ? (
          <div style={{ color: 'var(--color-bug)', padding: '1rem', background: '#fce8eb', borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        ) : issues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            No issues found.
          </div>
        ) : (
          <div>
            {issues.map(issue => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
