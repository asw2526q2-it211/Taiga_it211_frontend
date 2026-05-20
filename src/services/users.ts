import { env } from '../config/env';
import { getBootstrapApiKey } from '../config/users';
import type { ApiUser } from '../types/api';

/**
 * Obté tots els usuaris registrats al backend.
 * Utilitza una clau d'API de bootstrap (`.env` o primer usuari configurat).
 */
export async function fetchRegisteredUsers(): Promise<ApiUser[]> {
  const key = getBootstrapApiKey();
  const url = `${env.apiBaseUrl}/users/`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...(key ? { 'X-Api-Key': key } : {}),
    },
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : undefined;

  if (!response.ok) {
    throw new Error(
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: string }).error)
        : `No s'han pogut carregar els usuaris (${response.status})`,
    );
  }

  return data as ApiUser[];
}
