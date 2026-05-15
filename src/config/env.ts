const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'https://taiga-it211.onrender.com/api'

const apiKey = import.meta.env.VITE_API_KEY ?? ''

export const env = {
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
  apiKey,
} as const
