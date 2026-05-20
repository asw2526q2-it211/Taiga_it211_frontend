import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { IssueList } from './pages/IssueList';
import { IssueDetail } from './pages/IssueDetail';
import { NewIssue } from './pages/NewIssue';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { BulkInsert } from './pages/BulkInsert';

/** Base path de Vite (p. ex. `/Taiga_it211_frontend` en GitHub Pages). */
const routerBasename =
  import.meta.env.BASE_URL !== '/'
    ? import.meta.env.BASE_URL.replace(/\/$/, '')
    : undefined;

/**
 * Component arrel de l'aplicació.
 * Aquí configurem els proveïdors de context globals i les rutes.
 */
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename={routerBasename}>
          <Layout>
            <Routes>
              {/* Pàgina inicial: llistat d'incidències */}
              <Route path="/" element={<IssueList />} />
              <Route path="/issues" element={<Navigate to="/" replace />} />
              {/* Pàgina de creació d'incidència */}
              <Route path="/issues/new" element={<NewIssue />} />
              {/* Inserció massiva d'incidències */}
              <Route path="/issues/bulk" element={<BulkInsert />} />
              {/* Pàgina de detall d'incidència */}
              <Route path="/issues/:id" element={<IssueDetail />} />
              {/* Pàgina de configuració */}
              <Route path="/settings" element={<SettingsPage />} />
              {/* Pàgina del perfil d'un usuari */}
              <Route path="/profile/:username" element={<ProfilePage />} />
              {/* Qualsevol altra ruta redirigeix al llistat */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
