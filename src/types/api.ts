/**
 * Recursos que tenen color (Tipus, Gravetats, Prioritats, Estats).
 */
export interface ColorResource {
  id: number;
  name: string;
  color: string;
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

/**
 * Representació d'un Status (estat d'incidència) segons l'API.
 */
export interface StatusResource {
  id: number;
  name: string;
  slug: string;
  color: string;
  closed: boolean;
  is_default: boolean;
  order: number;
}
