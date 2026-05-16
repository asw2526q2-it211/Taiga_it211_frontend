import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { IssueList } from './pages/IssueList';
import { IssueDetail } from './pages/IssueDetail';
import { NewIssue } from './pages/NewIssue';
import { SettingsPage } from './pages/SettingsPage';

/**
 * Component arrel de l'aplicació.
 * Aquí configurem els proveïdors de context globals i les rutes.
 */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Pàgina de llistat d'incidències */}
            <Route path="/" element={<IssueList />} />
            {/* Pàgina de creació d'incidència */}
            <Route path="/issues/new" element={<NewIssue />} />
            {/* Pàgina de detall d'incidència */}
            <Route path="/issues/:id" element={<IssueDetail />} />
            {/* Pàgina de configuració */}
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
