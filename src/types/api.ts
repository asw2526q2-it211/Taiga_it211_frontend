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

export interface StatusItem extends ColorResource {
  slug?: string;
  closed: boolean;
  is_default: boolean;
  order?: number;
}

export interface PriorityItem extends ColorResource {
  order?: number;
  is_default: boolean;
}

export interface SeverityItem extends ColorResource {
  order?: number;
  is_default: boolean;
}

export interface TypeItem extends ColorResource {
  order?: number;
  is_default: boolean;
}

export interface UserResource {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
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

export interface Attachment {
  id: number;
  file: string | null;
  created_at: string;
}

export interface Watcher {
  username: string;
}

export interface Comment {
  id: number;
  user: string;
  text: string;
  created_at: string;
}

export interface ActivityItem {
  id: number;
  issue: number;
  user: string;
  field: string;
  old: string;
  new: string;
  created_at: string;
}

export interface DetailedIssue extends Omit<Issue, 'is_blocked' | 'modified'> {
  description: string;
  created_by: string;
  blocked: boolean;
  due_date_reason?: string;
  attachments: Attachment[];
  watchers: Watcher[];
  comments: Comment[];
  activities: ActivityItem[];
}

/**
 * Respostes de llistat de l'API.
 */
export type IssueListResponse = Issue[];

/**
 * Representació d'un Priority segons l'API.
 */
export interface PriorityResource {
  id: number;
  name: string;
  color: string;
  order: number;
  is_default: boolean;
}

/**
 * Representació d'un Type (tipus d'incidència) segons l'API.
 */
export interface TypeResource {
  id: number;
  name: string;
  color: string;
  order: number;
  is_default: boolean;
}

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
