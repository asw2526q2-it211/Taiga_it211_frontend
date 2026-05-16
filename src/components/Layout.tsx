import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { UserSelector } from './UserSelector';
import { useAuth } from '../context/AuthContext';
import { resolveMediaUrl } from '../config/env';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Layout principal de l'aplicació.
 * Defineix l'estructura fixa: la capçalera (Header) amb navegació, el botó d'avatar
 * que porta a la pàgina de perfil i l'àrea de contingut.
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const avatarUrl = resolveMediaUrl(profile?.avatar ?? null);
  const initial = (profile?.username ?? '?').charAt(0).toUpperCase();
  const profileHref = profile ? `/profile/${profile.username}` : '/';

  return (
    <div className="app-container">
      {/* Capçalera amb Logo, Navegació i Selector d'Usuari */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={() => navigate('/')}
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
              onClick={() => navigate('/')}
              style={{
                background: isActive('/') ? '#f4f6f8' : 'none',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: isActive('/') ? 600 : 400,
                color: isActive('/') ? '#009aa6' : '#70728f',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Issues
            </button>
            <button
              onClick={() => navigate('/settings')}
              style={{
                background: isActive('/settings') ? '#f4f6f8' : 'none',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: isActive('/settings') ? 600 : 400,
                color: isActive('/settings') ? '#009aa6' : '#70728f',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Settings
            </button>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <UserSelector />

          {/* Avatar de l'usuari hardcoded; navega cap a la seva pàgina de perfil */}
          <button
            type="button"
            onClick={() => navigate(profileHref)}
            disabled={!profile}
            title={profile ? `View profile (@${profile.username})` : 'Loading profile…'}
            aria-label="Open my profile"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: profile ? 'pointer' : 'default',
              display: 'inline-flex',
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#222',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                border: '2px solid var(--border-color)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile?.username ?? 'avatar'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>{initial}</span>
              )}
            </span>
          </button>
        </div>
      </header>

      {/* Contingut principal variable segons la pàgina */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
