/**
 * Tokens de tema per a les pàgines de configuració.
 *
 * Per afegir un tema nou:
 * 1. Crea un objecte que implementi SettingsTheme
 * 2. Crida applyTheme(myTheme) per aplicar-lo en calent
 * 3. O sobreescriu les CSS custom properties a :root amb un fitxer CSS
 *
 * Totes les classes CSS de settings.css utilitzen aquestes variables.
 */

/* ─── Interfície del tema ─── */
export interface SettingsTheme {
  /* Layout */
  bgLayout: string;
  bgContent: string;
  bgHeaderBar: string;
  bgInlineForm: string;
  bgRowHover: string;
  bgRowEditing: string;
  bgTabActive: string;

  /* Accents */
  accent: string;
  addBtnBg: string;
  saveBtnBg: string;

  /* Text */
  titleColor: string;
  descColor: string;
  textColor: string;
  textSecondary: string;
  headerTextColor: string;
  sidebarTextColor: string;
  tabActiveTextColor: string;
  sidebarTitleColor: string;

  /* Badge "Default" */
  defaultBadgeBg: string;
  defaultBadgeText: string;
  defaultBadgeBorder: string;

  /* Botó "Set default" */
  setDefaultBtnColor: string;
  setDefaultBtnBorder: string;

  /* Accions */
  editBtnColor: string;
  deleteBtnColor: string;
  closedIconColor: string;

  editingBorderColor: string;

  /* Vores */
  borderColor: string;
  gridBorderColor: string;
  formBorderColor: string;
  tabBorderColor: string;

  /* Ombra */
  contentShadow: string;

  /* Dimensions */
  sidebarWidth: string;
  contentPadding: string;
}

/* ─── Tema per defecte (Taiga clar) ─── */
export const DEFAULT_THEME: SettingsTheme = {
  bgLayout: '#e8eaef',
  bgContent: '#ffffff',
  bgHeaderBar: '#d3d7e0',
  bgInlineForm: '#f5f7fb',
  bgRowHover: '#f0fafa',
  bgRowEditing: '#f0fafa',
  bgTabActive: '#dde0e8',

  accent: '#009aa6',
  addBtnBg: '#4dc1ae',
  saveBtnBg: '#009aa6',

  titleColor: '#009aa6',
  descColor: '#8c8fa5',
  textColor: '#333333',
  textSecondary: '#70728f',
  headerTextColor: '#555770',
  sidebarTextColor: '#70728f',
  tabActiveTextColor: '#009aa6',
  sidebarTitleColor: '#9b9db0',

  defaultBadgeBg: '#e6f9f7',
  defaultBadgeText: '#009aa6',
  defaultBadgeBorder: '#b0e8e2',

  setDefaultBtnColor: '#7a7d96',
  setDefaultBtnBorder: '#c5c8d8',

  editBtnColor: '#7a7d96',
  deleteBtnColor: '#e05c5c',
  closedIconColor: '#009aa6',

  editingBorderColor: '#009aa6',

  borderColor: '#d8dae3',
  gridBorderColor: '#edf0f5',
  formBorderColor: '#d5d8e8',
  tabBorderColor: '#d8dae3',

  contentShadow: '0 1px 4px rgba(0,0,0,0.07)',

  sidebarWidth: '210px',
  contentPadding: '40px 48px',
};

/* ─── Tema fosc (exemple de com afegir-ne un de nou) ─── */
export const DARK_THEME: SettingsTheme = {
  bgLayout: '#1a1d2e',
  bgContent: '#252840',
  bgHeaderBar: '#2a2d42',
  bgInlineForm: '#2e3150',
  bgRowHover: '#2e3150',
  bgRowEditing: '#2e3150',
  bgTabActive: '#2a2d42',

  accent: '#4dc1ae',
  addBtnBg: '#4dc1ae',
  saveBtnBg: '#4dc1ae',

  titleColor: '#7de8cc',
  descColor: '#a0a3c0',
  textColor: '#e0e2f0',
  textSecondary: '#a0a3c0',
  headerTextColor: '#c0c2d8',
  sidebarTextColor: '#a0a3c0',
  tabActiveTextColor: '#7de8cc',
  sidebarTitleColor: '#707090',

  defaultBadgeBg: '#1a3d3a',
  defaultBadgeText: '#7de8cc',
  defaultBadgeBorder: '#2a5d5a',

  setDefaultBtnColor: '#a0a3c0',
  setDefaultBtnBorder: '#4a4d68',

  editBtnColor: '#a0a3c0',
  deleteBtnColor: '#e05c5c',
  closedIconColor: '#7de8cc',

  editingBorderColor: '#4dc1ae',

  borderColor: '#3a3d58',
  gridBorderColor: '#2e3150',
  formBorderColor: '#3a3d58',
  tabBorderColor: '#3a3d58',

  contentShadow: '0 1px 8px rgba(0,0,0,0.3)',

  sidebarWidth: '210px',
  contentPadding: '40px 48px',
};

/**
 * Aplica un tema al document mitjançant CSS custom properties.
 * Utilitza-ho per canviar de tema en calent des de qualsevol component:
 *
 *   import { DARK_THEME, applyTheme } from '../styles/theme';
 *   applyTheme(DARK_THEME);
 */
export function applyTheme(theme: SettingsTheme): void {
  const root = document.documentElement;

  root.style.setProperty('--set-bg-layout', theme.bgLayout);
  root.style.setProperty('--set-bg-content', theme.bgContent);
  root.style.setProperty('--set-bg-header-bar', theme.bgHeaderBar);
  root.style.setProperty('--set-bg-inline-form', theme.bgInlineForm);
  root.style.setProperty('--set-bg-row-hover', theme.bgRowHover);
  root.style.setProperty('--set-bg-row-editing', theme.bgRowEditing);
  root.style.setProperty('--set-bg-tab-active', theme.bgTabActive);

  root.style.setProperty('--set-accent', theme.accent);
  root.style.setProperty('--set-add-btn-bg', theme.addBtnBg);
  root.style.setProperty('--set-save-btn-bg', theme.saveBtnBg);

  root.style.setProperty('--set-title-color', theme.titleColor);
  root.style.setProperty('--set-desc-color', theme.descColor);
  root.style.setProperty('--set-text-color', theme.textColor);
  root.style.setProperty('--set-text-secondary', theme.textSecondary);
  root.style.setProperty('--set-header-text-color', theme.headerTextColor);
  root.style.setProperty('--set-sidebar-text-color', theme.sidebarTextColor);
  root.style.setProperty('--set-tab-active-text', theme.tabActiveTextColor);
  root.style.setProperty('--set-sidebar-title-color', theme.sidebarTitleColor);

  root.style.setProperty('--set-default-badge-bg', theme.defaultBadgeBg);
  root.style.setProperty('--set-default-badge-text', theme.defaultBadgeText);
  root.style.setProperty('--set-default-badge-border', theme.defaultBadgeBorder);

  root.style.setProperty('--set-default-btn-color', theme.setDefaultBtnColor);
  root.style.setProperty('--set-default-btn-border', theme.setDefaultBtnBorder);

  root.style.setProperty('--set-edit-btn-color', theme.editBtnColor);
  root.style.setProperty('--set-delete-btn-color', theme.deleteBtnColor);
  root.style.setProperty('--set-closed-icon-color', theme.closedIconColor);

  root.style.setProperty('--set-editing-border', theme.editingBorderColor);

  root.style.setProperty('--set-border-color', theme.borderColor);
  root.style.setProperty('--set-grid-border-color', theme.gridBorderColor);
  root.style.setProperty('--set-form-border-color', theme.formBorderColor);
  root.style.setProperty('--set-tab-border-color', theme.tabBorderColor);

  root.style.setProperty('--set-content-shadow', theme.contentShadow);

  root.style.setProperty('--set-sidebar-width', theme.sidebarWidth);
  root.style.setProperty('--set-content-padding', theme.contentPadding);
}
