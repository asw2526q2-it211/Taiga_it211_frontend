import React from 'react';

// Component de la barra lateral per filtrar les incidències.
// De moment és una representació estàtica de la UI.
export const FilterSidebar: React.FC = () => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      {/* Títol i botó d'aplicar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Custom filters</h3>
        <button style={{ background: 'none', border: 'none', color: 'var(--color-teal)', fontSize: '0.75rem', fontWeight: 600 }}>apply</button>
      </div>

      {/* Seccions de filtres desplegables (detalls) */}
      <details open style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <summary style={{ fontWeight: 600, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Type
          <span style={{ color: 'var(--color-teal)' }}>›</span>
        </summary>
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" /> <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-bug)' }}></span> Bug
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" /> <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-question)' }}></span> Question
          </label>
        </div>
      </details>

      <details style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <summary style={{ fontWeight: 600, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Severity
          <span style={{ color: 'var(--color-teal)' }}>›</span>
        </summary>
      </details>
      
      <details style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <summary style={{ fontWeight: 600, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Status
          <span style={{ color: 'var(--color-teal)' }}>›</span>
        </summary>
      </details>
    </div>
  );
};
