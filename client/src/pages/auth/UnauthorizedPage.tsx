import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardRoute } from '../../utils/roleRoutes';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  const handleGoDashboard = () => {
    navigate(getDashboardRoute(role), { replace: true });
  };

  const handleSwitchAccount = async () => {
    await logout();
    navigate('/select-role', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden text-center">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-error-container/30 rounded-full blur-3xl opacity-70 pointer-events-none" />

      <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl p-8 shadow-xl border border-surface-variant/60 flex flex-col items-center gap-5 relative z-10 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center text-3xl shadow-sm">
          🚫
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="font-headline font-bold text-2xl text-on-background">Access Restricted</h1>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            You do not have permission to view this section. This portal is strictly partitioned based on assigned campus roles.
          </p>
        </div>

        {role && (
          <div className="px-3.5 py-1.5 rounded-full bg-surface-container text-xs text-on-surface font-medium border border-outline-variant/40">
            Currently authenticated as: <strong className="capitalize text-primary">{role}</strong>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2">
          <button
            onClick={handleGoDashboard}
            className="w-full py-3 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-md"
          >
            Return to My Dashboard
          </button>
          <button
            onClick={handleSwitchAccount}
            className="w-full py-3 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold transition-all"
          >
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
};
