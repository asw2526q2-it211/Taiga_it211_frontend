import React from 'react';
import type { ReactNode } from 'react';
import { UserSelector } from './UserSelector';

type Page = 'issues' | 'settings';

interface LayoutProps {
  children: ReactNode;
  onNavigate: (page: Page) => void;
  currentPage: Page;
}

/**
 * Layout principal de l'aplicació.
 * Defineix l'estructura fixa: la capçalera (Header) amb navegació i l'àrea de contingut.
 */
export const Layout: React.FC<LayoutProps> = ({ children, onNavigate, currentPage }) => {
  return (
    <div className="app-container">
      {/* Capçalera amb Logo, Navegació i Selector d'Usuari */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={() => onNavigate('issues')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <div className="app-logo" style={{ cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              TAIGA IT211
            </div>
          </button>

          <nav style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => onNavigate('issues')}
              style={{
                background: currentPage === 'issues' ? '#f4f6f8' : 'none',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: currentPage === 'issues' ? 600 : 400,
                color: currentPage === 'issues' ? '#009aa6' : '#70728f',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Issues
            </button>
            <button
              onClick={() => onNavigate('settings')}
              style={{
                background: currentPage === 'settings' ? '#f4f6f8' : 'none',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: currentPage === 'settings' ? 600 : 400,
                color: currentPage === 'settings' ? '#009aa6' : '#70728f',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Settings
            </button>
          </nav>
        </div>

        <UserSelector />
      </header>
      
      {/* Contingut principal variable segons la pàgina */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
