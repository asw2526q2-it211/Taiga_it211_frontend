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
    name: 'El meu Usuari (Joan)', 
    apiKey: env.apiKey || '30e4a9c5cb1aca0ad94ca39c5f138148eff0419b' 
  },
  { 
    id: 2, 
    name: 'Admin User', 
    apiKey: 'admin-token-placeholder' 
  },
  { 
    id: 3, 
    name: 'Test User', 
    apiKey: 'test-token-placeholder' 
  },
];
