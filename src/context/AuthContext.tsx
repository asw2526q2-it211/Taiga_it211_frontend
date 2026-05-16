/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { setGlobalApiKey } from '../services/client';
import { fetchCurrentProfile } from '../services/profile';
import { MOCK_USERS } from '../config/users';
import type { User } from '../config/users';
import type { CurrentProfile } from '../types/api';

interface AuthContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  /** Perfil real (username, avatar, bio, api_key) de l'usuari actiu, obtingut del backend. */
  profile: CurrentProfile | null;
  /** Indica si encara estem carregant el perfil per primer cop. */
  profileLoading: boolean;
  /** Força una nova petició a `GET /profile` (útil després d'editar el propi perfil). */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Proveïdor del context d'autenticació (mock).
 * Gestiona quin usuari està actiu, manté la clau d'API del client HTTP sincronitzada
 * i carrega el perfil real des del backend perquè la resta de l'app sàpiga
 * el `username`, `avatar` i altres dades del compte logat.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);

  // Carrega el perfil real associat a la clau d'API actual.
  const loadProfile = useCallback(async () => {
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
  }, []);

  // Sincronitza la clau d'API global i recarrega el perfil quan canvia d'usuari.
  useEffect(() => {
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
