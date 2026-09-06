import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';

import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ParticipantDashboard } from './pages/ParticipantDashboard.js';
import { TeamPage } from './pages/TeamPage.js';
import { CompetitionPage } from './pages/CompetitionPage.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { AdminEvents } from './pages/AdminEvents.js';
import { AdminQuestions } from './pages/AdminQuestions.js';
import { AdminSubmissions } from './pages/AdminSubmissions.js';
import { AdminAnalytics } from './pages/AdminAnalytics.js';

const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const RequireAdmin: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
};

export const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Participant Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <ParticipantDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/team"
            element={
              <RequireAuth>
                <TeamPage />
              </RequireAuth>
            }
          />
          <Route
            path="/competition"
            element={
              <RequireAuth>
                <CompetitionPage />
              </RequireAuth>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <RequireAuth>
                <LeaderboardPage />
              </RequireAuth>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/events"
            element={
              <RequireAdmin>
                <AdminEvents />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <RequireAdmin>
                <AdminQuestions />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/submissions"
            element={
              <RequireAdmin>
                <AdminSubmissions />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <RequireAdmin>
                <AdminAnalytics />
              </RequireAdmin>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
