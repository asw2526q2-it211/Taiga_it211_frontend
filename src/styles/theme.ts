/**
 * theme.ts — Gestor de temes global
 *
 * Ara els temes s'apliquen via CSS custom properties definides a
 * styles/themes/light.css i styles/themes/dark.css.
 * Aquest fitxer només exposa la interfície de tema i funcions d'utilitat.
 */

export interface Theme {
  name: string;
  label: string;
}

export const AVAILABLE_THEMES: Theme[] = [
  { name: 'light', label: 'Clar' },
  { name: 'dark', label: 'Fosc' },
];

export function getSavedTheme(): string {
  try {
    return localStorage.getItem('taiga-theme') || 'light';
  } catch {
    return 'light';
  }
}

/**
 * Inicialitza el tema en carregar l'aplicació.
 * S'ha de cridar un sol cop a l'inici.
 */
export function initTheme(): void {
  const saved = getSavedTheme();
  document.documentElement.setAttribute('data-theme', saved);
}
