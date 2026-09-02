import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { LoadingScreen } from '../common/LoadingScreen';

interface Props {
  allowedRole: UserRole;
  children: ReactNode;
}

export const ProtectedRoute: React.FC<Props> = ({ allowedRole, children }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Verifying security credentials..." />;
  }

  // Not authenticated -> redirect to role selection
  if (!user) {
    return <Navigate to="/select-role" state={{ from: location }} replace />;
  }

  // Role mismatch -> redirect to unauthorized page
  if (role !== allowedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
