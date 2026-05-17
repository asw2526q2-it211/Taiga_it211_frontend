import { apiRequest } from './client'
import type { Issue } from '../types/api'

/**
 * Crea incidències en massa (una per línia de text).
 * Equivalent a POST /api/issues/bulk del backend.
 */
export function bulkCreateIssues(subjects: string[]): Promise<Issue[]> {
  return apiRequest<Issue[]>('issues/bulk', {
    method: 'POST',
    body: { subjects },
  })
}

/**
 * Converteix el text del textarea en una llista de temes vàlids (sense línies buides).
 */
export function parseBulkSubjects(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}
