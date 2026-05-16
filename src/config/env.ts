const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'https://taiga-it211.onrender.com/api'

const apiKey = import.meta.env.VITE_API_KEY ?? ''

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '')
const backendOrigin = normalizedApiBaseUrl.replace(/\/api$/, '')

export const env = {
  apiBaseUrl: normalizedApiBaseUrl,
  backendOrigin,
  apiKey,
} as const

/**
 * Resol una URL d'imatge que pot ser relativa (`/media/...`) o absoluta.
 * Retorna `null` si no s'ha proporcionat cap valor.
 */
export const resolveMediaUrl = (
  url: string | null | undefined,
): string | null => {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  return `${env.backendOrigin}${url.startsWith('/') ? '' : '/'}${url}`
}
