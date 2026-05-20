import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { IssueList } from './pages/IssueList';
import { IssueDetail } from './pages/IssueDetail';
import { NewIssue } from './pages/NewIssue';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { BulkInsert } from './pages/BulkInsert';
import { UserPickerPage } from './pages/UserPickerPage';

/** Base path de Vite (p. ex. `/Taiga_it211_frontend` en GitHub Pages). */
const routerBasename =
  import.meta.env.BASE_URL !== '/'
    ? import.meta.env.BASE_URL.replace(/\/$/, '')
    : undefined;

/**
 * Component arrel de l'aplicació.
 * Aquí configurem els proveïdors de context globals i les rutes.
 */
/** Rutes principals un cop triat l'usuari de sessió */
const AuthenticatedApp: React.FC = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<IssueList />} />
      <Route path="/issues" element={<Navigate to="/" replace />} />
      <Route path="/issues/new" element={<NewIssue />} />
      <Route path="/issues/bulk" element={<BulkInsert />} />
      <Route path="/issues/:id" element={<IssueDetail />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/profile/:username" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Layout>
);

const AppRouter: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();

  if (!currentUser) {
    return <UserPickerPage onSelect={setCurrentUser} />;
  }

  return <AuthenticatedApp />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename={routerBasename}>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
