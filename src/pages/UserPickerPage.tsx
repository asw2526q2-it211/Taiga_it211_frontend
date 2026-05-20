import React, { useEffect, useMemo, useState } from 'react';
import type { ApiUser } from '../types/api';
import type { User } from '../config/users';
import { canLoginAs, findUserByUsername } from '../config/users';
import { resolveMediaUrl } from '../config/env';
import { fetchRegisteredUsers } from '../services/users';
import '../styles/user-picker.css';

interface UserPickerPageProps {
  onSelect: (user: User) => void;
}

function displayName(user: ApiUser): string {
  const full = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return full || user.username;
}

/**
 * Pantalla inicial: tria amb quin usuari vols utilitzar l'aplicació.
 */
export const UserPickerPage: React.FC<UserPickerPageProps> = ({ onSelect }) => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchRegisteredUsers();
        if (!cancelled) {
          setUsers(
            [...list].sort((a, b) =>
              displayName(a).localeCompare(displayName(b), undefined, {
                sensitivity: 'base',
              }),
            ),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'No s\'han pogut carregar els usuaris',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const label = displayName(u).toLowerCase();
      return (
        label.includes(q) ||
        u.username.toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const selectedAvailable = selectedUsername
    ? canLoginAs(selectedUsername)
    : false;

  const handleContinue = () => {
    if (!selectedUsername) return;
    const sessionUser = findUserByUsername(selectedUsername);
    if (!sessionUser || !canLoginAs(selectedUsername)) {
      setError(
        'Aquest usuari no està configurat al frontend. Revisa `src/config/users.ts`.',
      );
      return;
    }
    onSelect(sessionUser);
  };

  return (
    <div className="user-picker-page">
      <div className="user-picker-card glass-panel">
        <header className="user-picker-header">
          <div className="user-picker-brand">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>ISSUE TRACKER</span>
          </div>
          <h1 className="user-picker-title">Selecciona un usuari</h1>
          <p className="user-picker-subtitle">
            Tria el compte amb el qual vols treballar en aquesta sessió.
          </p>
        </header>

        <div className="user-picker-body">
          <div className="modal-search-bar">
            <input
              type="text"
              placeholder="Cerca per nom o usuari…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
            />
            <button type="button" className="search-btn" tabIndex={-1}>
              Cerca
            </button>
          </div>

          {error && (
            <p className="user-picker-error" role="alert">
              {error}
            </p>
          )}

          {loading ? (
            <p className="user-picker-status">Carregant usuaris…</p>
          ) : filteredUsers.length === 0 ? (
            <p className="user-picker-status">No s'han trobat usuaris.</p>
          ) : (
            <div className="modal-user-list user-picker-list">
              {filteredUsers.map((user) => {
                const isSelected = selectedUsername === user.username;
                const available = canLoginAs(user.username);
                const avatarUrl = resolveMediaUrl(user.avatar);

                return (
                  <button
                    key={user.id}
                    type="button"
                    className={`modal-user-row user-picker-row ${isSelected ? 'selected' : ''} ${!available ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!available) return;
                      setSelectedUsername(user.username);
                      setError(null);
                    }}
                    disabled={!available}
                    aria-pressed={isSelected}
                  >
                    <div className="modal-user-avatar">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={user.username} />
                      ) : (
                        <div className="modal-user-avatar-placeholder">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="user-picker-row-text">
                      <span className="modal-user-name">{displayName(user)}</span>
                      <span className="user-picker-username">@{user.username}</span>
                    </div>
                    {!available && (
                      <span className="user-picker-unavailable">No disponible</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="user-picker-footer">
          <button
            type="button"
            className="modal-add-btn user-picker-continue"
            onClick={handleContinue}
            disabled={!selectedAvailable || loading}
          >
            Continuar
          </button>
        </footer>
      </div>
    </div>
  );
};
