import React, { useState } from 'react';
import { StatusSettings } from '../components/StatusSettings';

/* ─── Configuració de les pestanyes de configuració ─── */
interface TabConfig {
  slug: string;
  label: string;
}

const TABS: TabConfig[] = [
  { slug: 'statuses', label: 'Statuses' },
  { slug: 'priorities', label: 'Priorities' },
  { slug: 'types', label: 'Types' },
  { slug: 'severities', label: 'Severities' },
  { slug: 'tags', label: 'Tags' },
  { slug: 'due-dates', label: 'Due Dates' },
];

/**
 * Pàgina de configuració amb navegació per pestanyes laterals.
 * Cada pestanya mostra el seu contingut al panell principal.
 */
export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('statuses');

  /* ── Renderitza el contingut segons la pestanya activa ── */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'statuses':
        return <StatusSettings />;
      case 'priorities':
        return <PlaceholderTab title="Priorities" description="Manage issue priorities." />;
      case 'types':
        return <PlaceholderTab title="Types" description="Manage issue types." />;
      case 'severities':
        return <PlaceholderTab title="Severities" description="Manage issue severities." />;
      case 'tags':
        return <PlaceholderTab title="Tags" description="Manage issue tags." />;
      case 'due-dates':
        return <PlaceholderTab title="Due Dates" description="Manage due date presets." />;
      default:
        return <PlaceholderTab title="Settings" description="Select a tab from the sidebar." />;
    }
  };

  return (
    <div style={styles.layout}>
      {/* ── Sidebar ── */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTitle}>Settings</div>
        <ul style={styles.tabList}>
          {TABS.map((tab) => (
            <li key={tab.slug} style={styles.tabItem}>
              <button
                onClick={() => setActiveTab(tab.slug)}
                style={{
                  ...styles.tabLink,
                  ...(activeTab === tab.slug ? styles.tabLinkActive : {}),
                }}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── Contingut ── */}
      <main style={styles.content}>{renderTabContent()}</main>
    </div>
  );
};

/* ─── Component placeholder per a pestanyes no implementades ─── */

const PlaceholderTab: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div>
    <h1 style={styles.contentTitle}>{title}</h1>
    <p style={styles.contentDescription}>{description}</p>
    <div style={styles.placeholder}>
      <svg style={{ width: '48px', height: '48px', fill: '#c8cad8' }} viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
      <p style={styles.placeholderText}>
        <strong style={{ fontSize: '16px', color: '#9294a8', display: 'block', marginBottom: '4px' }}>
          Coming Soon
        </strong>
        This section is not yet implemented.
      </p>
    </div>
  </div>
);

/* ─── Estils ─── */

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: 'calc(100vh - 60px)',
    background: '#e8eaef',
    margin: '-2rem',
    padding: '0',
  },
  sidebar: {
    width: '210px',
    flexShrink: 0,
    background: '#e8eaef',
    padding: '32px 0',
  },
  sidebarTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#9b9db0',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '0 24px 12px 24px',
  },
  tabList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  tabItem: {
    margin: 0,
    padding: 0,
  },
  tabLink: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '13px 24px',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: '#70728f',
    textDecoration: 'none',
    borderBottom: '1px solid #d8dae3',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    background: 'none',
    cursor: 'pointer',
    transition: 'color 0.15s, background 0.15s',
  },
  tabLinkActive: {
    color: '#009aa6',
    background: '#dde0e8',
  },
  content: {
    flex: 1,
    background: '#fff',
    margin: '20px 24px 20px 0',
    borderRadius: '4px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    padding: '40px 48px',
    minHeight: '600px',
  },
  contentTitle: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#009aa6',
    margin: '0 0 10px 0',
  },
  contentDescription: {
    fontSize: '13.5px',
    color: '#8c8fa5',
    margin: '0 0 36px 0',
    lineHeight: 1.5,
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    border: '2px dashed #d5d8e2',
    borderRadius: '6px',
    color: '#b0b3c6',
    textAlign: 'center',
    gap: '12px',
  },
  placeholderText: {
    fontSize: '14px',
    margin: 0,
  },
};
