import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { UserSelector } from './UserSelector';
import { useAuth } from '../context/AuthContext';
import { resolveMediaUrl } from '../config/env';
import { useTheme } from '../context/ThemeContext';

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
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const isActive = (path: string) => location.pathname === path;

  const avatarUrl = resolveMediaUrl(profile?.avatar ?? null);
  const initial = (profile?.username ?? '?').charAt(0).toUpperCase();
  const profileHref = profile ? `/profile/${profile.username}` : '/';

  // Close the mobile menu
  const closeMenu = () => setMenuOpen(false);

  // Navigate and close the mobile menu
  const navigateAndClose = (path: string) => {
    closeMenu();
    navigate(path);
  };

  // Close the menu when clicking outside (but ignore clicks on the toggle button)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        toggleRef.current &&
        !toggleRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

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

          <div className="hide-mobile">
            <nav style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: isActive('/') ? 'var(--bg-hover)' : 'none',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isActive('/') ? 600 : 400,
                  color: isActive('/') ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Issues
              </button>
              <button
                onClick={() => navigate('/settings')}
                style={{
                  background: isActive('/settings') ? 'var(--bg-hover)' : 'none',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isActive('/settings') ? 600 : 400,
                  color: isActive('/settings') ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Settings
              </button>
            </nav>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <UserSelector />

            {/* Botó de canvi de tema */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Canviar a mode fosc' : 'Canviar a mode clar'}
              aria-label="Toggle theme"
              style={{
                background: 'var(--bg-hover)',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.15s ease',
              }}
            >
              {theme === 'light' ? (
                /* Icona de lluna (mode fosc) */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                /* Icona de sol (mode clar) */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
          </div>

          {/* Botó de menú mòbil (hamburger) */}
          <button
            type="button"
            ref={toggleRef}
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Tancar menú' : 'Obrir menú'}
            style={{
              background: menuOpen ? 'var(--bg-hover)' : 'none',
              border: 'none',
              width: 36,
              height: 36,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '20px',
              transition: 'all 0.15s ease',
            }}
          >
            {menuOpen ? (
              /* Icona de tancament (X) */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              /* Icona d'hamburger */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          {/* Avatar de l'usuari; navega cap a la seva pàgina de perfil */}
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
                background: 'var(--text-primary)',
                color: 'var(--text-on-accent)',
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

      {/* Menú desplegable mòbil */}
      {menuOpen && (
        <div className="mobile-menu-dropdown" ref={menuRef}>
          <div className="mobile-menu-items">
            <button
              onClick={() => navigateAndClose('/')}
              className={`mobile-menu-item ${isActive('/') ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Issues
            </button>
            <button
              onClick={() => navigateAndClose('/settings')}
              className={`mobile-menu-item ${isActive('/settings') ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>
            <div className="mobile-menu-divider" />
            <div className="mobile-menu-item-row">
              <UserSelector />
            </div>
            <div className="mobile-menu-item-row">
              <button
                type="button"
                onClick={toggleTheme}
                className="mobile-menu-theme-btn"
              >
                {theme === 'light' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
                <span>{theme === 'light' ? 'Mode fosc' : 'Mode clar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contingut principal variable segons la pàgina */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
