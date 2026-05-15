/**
 * Recursos que tenen color (Tipus, Gravetats, Prioritats, Estats).
 */
export interface ColorResource {
  id: number;
  name: string;
  color: string;
  is_default?: boolean;
  order?: number;
}

export interface StatusResource extends ColorResource {
  slug: string;
  closed: boolean;
}

export interface ApiUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
}

export interface DueDateRule {
  id: number;
  name: string;
  color: string;
  days_to_due: number | null;
  by_default?: string;
}

export interface ProfileResponse {
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  avatar: string | null;
}

export interface CreateIssuePayload {
  subject: string;
  description?: string;
  type?: string;
  status?: string;
  severity?: string;
  priority?: string;
  assigned?: string;
  duedate?: string;
  blocked?: boolean;
  tags?: string[];
}

/**
 * Representació d'un usuari segons l'API.
 */
export interface UserResource {
  id: number;
  name: string;
  avatar_url?: string;
}

/**
 * Representació d'una etiqueta (tag).
 */
export interface TagResource {
  name: string;
  color: string;
}

/**
 * Interfície que coincideix exactament amb el JSON que retorna el teu backend.
 */
export interface Issue {
  id: number;
  subject: string;
  type: string | null;      // El backend retorna el nom (string)
  severity: string | null;  // El backend retorna el nom (string)
  priority: string | null;  // El backend retorna el nom (string)
  status: string | null;    // El backend retorna el nom (string)
  assigned: string | null;  // El backend retorna el username (string)
  modified: string;         // ISO Date
  created_at: string;       // ISO Date
  due_date: string | null;  // ISO Date
  is_blocked?: boolean;     // Opcional segons la versió
  tags: TagResource[];
}

/**
 * Respostes de llistat de l'API.
 */
export type IssueListResponse = Issue[];
