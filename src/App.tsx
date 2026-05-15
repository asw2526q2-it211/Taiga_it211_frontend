import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { IssueList } from './pages/IssueList';
import { IssueDetail } from './pages/IssueDetail';

/**
 * Component arrel de l'aplicació.
 * Aquí configurem els proveïdors de context globals i l'enrutament.
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* Proveïdor d'autenticació per tenir l'usuari seleccionat a tota l'app */}
      <AuthProvider>
        {/* Estructura base de la web */}
        <Layout>
          <Routes>
            {/* Pàgina de llistat d'incidències */}
            <Route path="/" element={<IssueList />} />
            {/* Pàgina de detall d'incidència */}
            <Route path="/issues/:id" element={<IssueDetail />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

