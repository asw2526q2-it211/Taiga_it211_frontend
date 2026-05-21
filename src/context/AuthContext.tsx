/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { setGlobalApiKey } from '../services/client';
import { fetchCurrentProfile } from '../services/profile';
import {
  MOCK_USERS,
  SELECTED_USER_STORAGE_KEY,
  type User,
} from '../config/users';
import type { CurrentProfile } from '../types/api';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  /** Perfil real (username, avatar, bio, api_key) de l'usuari actiu, obtingut del backend. */
  profile: CurrentProfile | null;
  /** Indica si encara estem carregant el perfil per primer cop. */
  profileLoading: boolean;
  /** Força una nova petició a `GET /profile` (útil després d'editar el propi perfil). */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredUser(): User | null {
  try {
    const raw = sessionStorage.getItem(SELECTED_USER_STORAGE_KEY);
    if (!raw) return null;
    const id = parseInt(raw, 10);
    const user = MOCK_USERS.find((u) => u.id === id) ?? null;
    // Set the API key synchronously so it is ready before any useEffect fires.
    // This prevents a race condition where loadMeta (IssueList) calls the API
    // before AuthContext's useEffect has had a chance to call setGlobalApiKey.
    if (user) setGlobalApiKey(user.apiKey);
    return user;
  } catch {
    return null;
  }
}

/**
 * Proveïdor del context d'autenticació (mock).
 * Gestiona quin usuari està actiu, manté la clau d'API del client HTTP sincronitzada
 * i carrega el perfil real des del backend perquè la resta de l'app sàpiga
 * el `username`, `avatar` i altres dades del compte logat.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(readStoredUser);
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  const setCurrentUser = useCallback((user: User) => {
    // Set the API key synchronously BEFORE updating state, so that when
    // IssueList mounts and its useEffect fires loadMeta, the key is already
    // configured. This prevents the first-visit race condition.
    setGlobalApiKey(user.apiKey);
    setCurrentUserState(user);
    try {
      sessionStorage.setItem(SELECTED_USER_STORAGE_KEY, String(user.id));
    } catch {
      /* sessionStorage no disponible */
    }
  }, []);

  // Carrega el perfil real associat a la clau d'API actual.
  const loadProfile = useCallback(async () => {
    if (!currentUser) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    try {
      const data = await fetchCurrentProfile();
      setProfile(data);
    } catch (err) {
      console.warn('Could not load current profile', err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [currentUser]);

  // Sincronitza la clau d'API global i recarrega el perfil quan canvia d'usuari.
  useEffect(() => {
    if (!currentUser) {
      setGlobalApiKey('');
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setGlobalApiKey(currentUser.apiKey);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile();
  }, [currentUser, loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        profile,
        profileLoading,
        refreshProfile: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook per accedir fàcilment a l'usuari actual des de qualsevol component.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Usuari de sessió obligatori (dins de l'app ja autenticada).
 */
export const useRequiredAuth = () => {
  const auth = useAuth();
  if (!auth.currentUser) {
    throw new Error('useRequiredAuth requires a selected user');
  }
  return { ...auth, currentUser: auth.currentUser };
};
