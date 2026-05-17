import { env } from './env';

/**
 * Interfície per definir un usuari del sistema (Mock).
 */
export interface User {
  id: number;
  name: string;
  apiKey: string;
}

/**
 * Llista d'usuaris per al selector.
 * Hem configurat el teu usuari real com a opció principal.
 */
export const MOCK_USERS: User[] = [
  { 
    id: 1, 
    name: 'Joan', 
    apiKey: env.apiKey || '30e4a9c5cb1aca0ad94ca39c5f138148eff0419b' 
  },
  {
    id: 2,
    name: 'Hadeer',
    apiKey: '131051b963fe74268917d6a173768d2e5da0e48a'
  },
  {
    id: 3,
    name: 'Yimin',
    apiKey: 'api-key-placeholder'
  },
  {
    id: 4,
    name: 'Lucas',
    apiKey: 'api-key-placeholder'
  },
  {
    id: 5,
    name: 'Izan',
    apiKey: 'api-key-placeholder'
  },
  {
    id: 6, 
    name: 'TEST-USER', 
    apiKey: 'admin-token-placeholder' 
  }
];
