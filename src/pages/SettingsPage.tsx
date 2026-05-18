import React, { useState } from 'react';
import { StatusSettings } from '../components/StatusSettings';
import { PrioritySettings } from '../components/PrioritySettings';
import { TypeSettings } from '../components/TypeSettings';
import { SeveritySettings } from '../components/SeveritySettings';
import { TagSettings } from '../components/TagSettings';
import { DueDateSettings } from '../components/DueDateSettings';
import '../styles/settings.css';

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
 * Tots els estils provenen de settings.css (CSS custom properties).
 * En mòbil (<768px) la sidebar es converteix en pestanyes horitzontals.
 */
export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('statuses');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'statuses':
        return <StatusSettings />;
      case 'priorities':
        return <PrioritySettings />;
      case 'types':
        return <TypeSettings />;
      case 'severities':
        return <SeveritySettings />;
      case 'tags':
        return <TagSettings />;
      case 'due-dates':
        return <DueDateSettings />;
      default:
        return <PlaceholderTab title="Settings" description="Select a tab from the sidebar." />;
    }
  };

  return (
    <div className="settings-layout">
      <aside className="settings-sidebar">
        <div className="settings-sidebar-title">Settings</div>
        <ul className="settings-tab-list">
          {TABS.map((tab) => (
            <li key={tab.slug} className="settings-tab-item">
              <button
                onClick={() => setActiveTab(tab.slug)}
                className={`settings-tab-btn${activeTab === tab.slug ? ' active' : ''}`}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="settings-content">{renderTabContent()}</main>
    </div>
  );
};

/* ─── Component placeholder per a pestanyes no implementades ─── */

const PlaceholderTab: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div>
    <h1 className="settings-section-title" style={{ margin: '0 0 10px 0' }}>{title}</h1>
    <p className="settings-section-desc" style={{ margin: '0 0 36px 0' }}>{description}</p>
    <div className="set-placeholder">
      <svg style={{ width: '48px', height: '48px', fill: '#c8cad8' }} viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
      <p style={{ fontSize: '14px', margin: 0 }}>
        <strong style={{ fontSize: '16px', color: '#9294a8', display: 'block', marginBottom: '4px' }}>
          Coming Soon
        </strong>
        This section is not yet implemented.
      </p>
    </div>
  </div>
);
