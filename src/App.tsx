import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { IssueList } from './pages/IssueList';

/**
 * Component arrel de l'aplicació.
 * Aquí configurem els proveïdors de context globals.
 */
const App: React.FC = () => {
  return (
    // Proveïdor d'autenticació per tenir l'usuari seleccionat a tota l'app
    <AuthProvider>
      {/* Estructura base de la web */}
      <Layout>
        {/* Pàgina de llistat d'incidències */}
        <IssueList />
      </Layout>
    </AuthProvider>
  );
};

export default App;
