import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { IssueList } from './pages/IssueList';
import { SettingsPage } from './pages/SettingsPage';

type Page = 'issues' | 'settings';

/**
 * Component arrel de l'aplicació.
 * Aquí configurem els proveïdors de context globals i la navegació entre pàgines.
 */
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('issues');

  return (
    // Proveïdor d'autenticació per tenir l'usuari seleccionat a tota l'app
    <AuthProvider>
      {/* Estructura base de la web */}
      <Layout onNavigate={setCurrentPage} currentPage={currentPage}>
        {currentPage === 'issues' ? <IssueList /> : <SettingsPage />}
      </Layout>
    </AuthProvider>
  );
};

export default App;
