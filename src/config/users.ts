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
    apiKey: '44946fdd0fe338b206c21ae91e446b1163db27d4'
  },
  {
    id: 4,
    name: 'Lucas',
    apiKey: 'api-key-placeholder'
  },
  {
    id: 5,
    name: 'Izan',
    apiKey: 'e9d0b83e7739fb7248ca62755ef09ffaf60c30b6'
  },
  {
    id: 6, 
    name: 'TEST-USER', 
    apiKey: 'admin-token-placeholder' 
  }
];
