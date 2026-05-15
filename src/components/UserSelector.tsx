import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MOCK_USERS } from '../config/users';

/**
 * Component de la capçalera per canviar d'usuari "al vol".
 * Permet testejar l'API amb diferents claus d'autorització ràpidament.
 */
export const UserSelector: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();

  // Funció que s'executa quan l'usuari tria una opció del desplegable
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = parseInt(e.target.value, 10);
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user); // Actualitzem l'estat global
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <label htmlFor="user-selector" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
        Viewing as:
      </label>
      <select
        id="user-selector"
        value={currentUser.id}
        onChange={handleChange}
        className="input-control"
        style={{ padding: '0.4rem 0.75rem', borderRadius: '20px', cursor: 'pointer', background: 'var(--bg-primary)' }}
      >
        {MOCK_USERS.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </div>
  );
};
