import React, { useState } from 'react';
import { StatusSettings } from '../components/StatusSettings';
import { PrioritySettings } from '../components/PrioritySettings';

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
    <>
      {/* ── Estils responsius ── */}
      <style>{`
        .settings-layout {
          display: flex;
          min-height: calc(100vh - 60px);
          background: #e8eaef;
          margin: -2rem;
        }

        .settings-sidebar {
          width: 210px;
          flex-shrink: 0;
          background: #e8eaef;
          padding: 32px 0;
          overflow-y: auto;
        }

        .settings-sidebar-title {
          font-size: 11px;
          font-weight: 700;
          color: #9b9db0;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0 24px 12px 24px;
        }

        .settings-tab-btn {
          display: block;
          width: 100%;
          text-align: left;
          padding: 13px 24px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #70728f;
          text-decoration: none;
          border: none;
          border-bottom: 1px solid #d8dae3;
          background: none;
          cursor: pointer;
          transition: color 0.15s, background 0.15s;
          white-space: nowrap;
        }

        .settings-tab-btn:first-of-type {
          border-top: 1px solid #d8dae3;
        }

        .settings-tab-btn:hover {
          color: #009aa6;
          background: #dde0e8;
        }

        .settings-tab-btn.active {
          color: #009aa6;
          background: #dde0e8;
        }

        .settings-content {
          flex: 1;
          background: #fff;
          margin: 20px 24px 20px 0;
          border-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
          padding: 40px 48px;
          min-height: 600px;
          overflow: hidden;
        }

        /* ── Responsive: <=768px ── */
        @media (max-width: 768px) {
          .settings-layout {
            flex-direction: column;
            margin: -1rem;
          }

          .settings-sidebar {
            width: 100%;
            padding: 0;
            display: flex;
            flex-direction: column;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .settings-sidebar-title {
            padding: 14px 20px 10px 20px;
          }

          .settings-tab-list {
            display: flex;
            flex-direction: row;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border-bottom: 2px solid #d8dae3;
            padding: 0 12px;
          }

          .settings-tab-btn {
            display: inline-block;
            width: auto;
            padding: 10px 16px;
            border-bottom: none;
            border-top: none !important;
            border-radius: 6px 6px 0 0;
            font-size: 12px;
          }

          .settings-tab-btn.active {
            background: #fff;
            color: #009aa6;
          }

          .settings-content {
            margin: 0;
            border-radius: 0;
            padding: 24px 16px;
            min-height: auto;
            box-shadow: none;
          }
        }

        @media (max-width: 480px) {
          .settings-content {
            padding: 16px 12px;
          }
        }
      `}</style>

      {/* ── Layout ── */}
      <div className="settings-layout">
        <aside className="settings-sidebar">
          <div className="settings-sidebar-title">Settings</div>
          <ul className="settings-tab-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {TABS.map((tab) => (
              <li key={tab.slug} style={{ margin: 0, padding: 0 }}>
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
    </>
  );
};

/* ─── Component placeholder per a pestanyes no implementades ─── */

const PlaceholderTab: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => {
  const ps: Record<string, React.CSSProperties> = {
    title: { fontSize: '22px', fontWeight: 600, color: '#009aa6', margin: '0 0 10px 0' },
    desc: { fontSize: '13.5px', color: '#8c8fa5', margin: '0 0 36px 0', lineHeight: 1.5 },
    box: {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '300px', border: '2px dashed #d5d8e2',
      borderRadius: '6px', color: '#b0b3c6', textAlign: 'center', gap: '12px',
    },
    text: { fontSize: '14px', margin: 0 },
  };

  return (
    <div>
      <h1 style={ps.title}>{title}</h1>
      <p style={ps.desc}>{description}</p>
      <div style={ps.box}>
        <svg style={{ width: '48px', height: '48px', fill: '#c8cad8' }} viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
        <p style={ps.text}>
          <strong style={{ fontSize: '16px', color: '#9294a8', display: 'block', marginBottom: '4px' }}>
            Coming Soon
          </strong>
          This section is not yet implemented.
        </p>
      </div>
    </div>
  );
};
