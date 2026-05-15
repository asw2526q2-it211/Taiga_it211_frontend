import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { IssueList } from './pages/IssueList';
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
            <Route path="/" element={<IssueList />} />
            <Route path="/issues/new" element={<NewIssue />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
