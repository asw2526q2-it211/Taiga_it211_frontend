import { env } from '../config/env'

// Variable global per mantenir la clau d'API de l'usuari seleccionat
let currentApiKey = env.apiKey;

/**
 * Actualitza la clau d'API que s'utilitzarà en les peticions següents.
 */
export const setGlobalApiKey = (key: string) => {
  currentApiKey = key;
};

/**
 * Error personalitzat per a les respostes fallides de l'API.
 */
export class ApiError extends Error {
  status: number
  body?: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  params?: Record<string, string | number | undefined>
}

function buildUrl(path: string, params?: RequestOptions['params']) {
  const url = new URL(
    path.startsWith('/') ? path.slice(1) : path,
    `${env.apiBaseUrl}/`,
  )

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

/**
 * Funció principal per fer peticions fetch al backend.
 * Afegeix automàticament la URL base i la clau d'API d'autorització.
 */
export async function apiRequest<T>(
  path: string,
  { body, params, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(currentApiKey ? { 'X-Api-Key': currentApiKey } : {}),
      ...headers,
    },
    body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  })

  const text = await response.text()
  const data = text ? (JSON.parse(text) as unknown) : undefined

  if (!response.ok) {
    throw new ApiError(
      `API request failed: ${response.status} ${response.statusText}`,
      response.status,
      data,
    )
  }

  return data as T
}
