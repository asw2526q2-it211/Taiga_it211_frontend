/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { setGlobalApiKey } from '../services/client';
import { MOCK_USERS } from '../config/users';
import type { User } from '../config/users';

interface AuthContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
}

// Context global per gestionar l'usuari seleccionat a tota l'app
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Proveïdor del context d'autenticació (mock).
 * Gestiona qui és l'usuari actiu i actualitza la clau d'API global quan canvia.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);

  // Sincronitza la clau d'API del client HTTP quan l'usuari seleccionat canvia
  useEffect(() => {
    setGlobalApiKey(currentUser.apiKey);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
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
