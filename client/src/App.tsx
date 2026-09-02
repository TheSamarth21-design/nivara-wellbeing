import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoadingScreen } from './components/common/LoadingScreen';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { getDashboardRoute } from './utils/roleRoutes';

// Pages
import { RoleSelectionPage } from './pages/auth/RoleSelectionPage';
import { LoginPage } from './pages/auth/LoginPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage';
import { CounselorDashboardPage } from './pages/counselor/CounselorDashboardPage';

/**
 * RootRedirect handles checking initial Firebase session
 * and routing directly to the authenticated role dashboard.
 */
const RootRedirect: React.FC = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Connecting to your quiet space..." />;
  }

  if (user && role) {
    return <Navigate to={getDashboardRoute(role)} replace />;
  }

  return <Navigate to="/select-role" replace />;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="Nivara System">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root: Session detection and auto-routing */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Authentication Pages */}
            <Route path="/select-role" element={<RoleSelectionPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected Student Portal */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Teacher Portal */}
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute allowedRole="teacher">
                  <TeacherDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Counselor Portal */}
            <Route
              path="/counselor/dashboard"
              element={
                <ProtectedRoute allowedRole="counselor">
                  <CounselorDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
