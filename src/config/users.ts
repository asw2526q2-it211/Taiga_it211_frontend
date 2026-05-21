import { env } from './env';

/**
 * Interfície per definir un usuari del sistema (Mock).
 */
export interface User {
  id: number;
  /** Nom mostrat al selector de la capçalera */
  name: string;
  /** Nom d'usuari al backend (GET /users/) */
  username: string;
  apiKey: string;
}

export const SELECTED_USER_STORAGE_KEY = 'taiga-selected-user-id';

/** Clau d'API per carregar la llista d'usuaris abans de triar sessió */
export function getBootstrapApiKey(): string {
  const configured = MOCK_USERS.find(
    (u) => u.apiKey && !u.apiKey.includes('placeholder'),
  );
  return env.apiKey || configured?.apiKey || '';
}

/** Resol l'usuari de sessió a partir del username del backend */
export function findUserByUsername(username: string): User | undefined {
  const normalized = username.trim().toLowerCase();
  return MOCK_USERS.find((u) => u.username.toLowerCase() === normalized);
}

export function canLoginAs(username: string): boolean {
  const user = findUserByUsername(username);
  return !!user?.apiKey && !user.apiKey.includes('placeholder');
}

/**
 * Llista d'usuaris per al selector.
 * Hem configurat el teu usuari real com a opció principal.
 */
export const MOCK_USERS: User[] = [
  {
    id: 1,
    name: 'Joan',
    username: 'joan',
    apiKey: env.apiKey || '30e4a9c5cb1aca0ad94ca39c5f138148eff0419b'
  },
  {
    id: 2,
    name: 'Hadeer',
    username: 'hadeer',
    apiKey: '131051b963fe74268917d6a173768d2e5da0e48a',
  },
  {
    id: 3,
    name: 'Yimin',
    username: 'yimin',
    apiKey: '44946fdd0fe338b206c21ae91e446b1163db27d4',
  },
  {
    id: 4,
    name: 'Lucas',
    username: 'lucas',
    apiKey: '24a83a5f3dfbd41a98bc3609efdabcc69cb05ccd'
  },
  {
    id: 5,
    name: 'Izan',
    username: 'izan',
    apiKey: 'e9d0b83e7739fb7248ca62755ef09ffaf60c30b6',
  },
  {
    id: 6,
    name: 'TEST-USER',
    username: 'test-user',
    apiKey: 'admin-token-placeholder'
  }
];
