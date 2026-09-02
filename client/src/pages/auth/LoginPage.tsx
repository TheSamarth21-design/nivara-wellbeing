import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { getDashboardRoute } from '../../utils/roleRoutes';
import { RoleMismatchError } from '../../services/authService';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // Validate and parse role from URL
  const roleParam = (searchParams.get('role') || 'student').toLowerCase() as UserRole;
  const selectedRole: UserRole = ['student', 'teacher', 'counselor'].includes(roleParam)
    ? roleParam
    : 'student';

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleMeta: Record<UserRole, { title: string; emoji: string; badge: string; color: string }> = {
    student: { title: 'Student', emoji: '🎓', badge: 'Personal Wellbeing Space', color: 'bg-primary-fixed text-on-primary-fixed' },
    teacher: { title: 'Teacher', emoji: '👨‍🏫', badge: 'Academic & Class Insights', color: 'bg-secondary-fixed text-on-secondary-fixed' },
    counselor: { title: 'Counselor', emoji: '🧑‍⚕️', badge: 'Clinical Support Desk', color: 'bg-tertiary-fixed text-on-tertiary-fixed' }
  };

  const meta = roleMeta[selectedRole];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long (Firebase requirement).');
      return;
    }

    if (isRegister && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, name, selectedRole);
      } else {
        await login(email, password, selectedRole);
      }

      // Redirect to correct dashboard
      navigate(getDashboardRoute(selectedRole), { replace: true });
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      if (err instanceof RoleMismatchError) {
        setError(err.message);
      } else {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl opacity-70 animate-subtle-float pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-fixed/30 rounded-full blur-3xl opacity-70 animate-subtle-float pointer-events-none" />

      <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl p-7 md:p-8 shadow-xl border border-surface-variant/60 flex flex-col gap-6 relative z-10 animate-fadeIn">
        {/* Top Role Indicator & Back Button */}
        <div className="flex items-center justify-between border-b border-surface-variant/40 pb-4">
          <button
            type="button"
            onClick={() => navigate('/select-role')}
            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Change Role</span>
          </button>

          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${meta.color}`}>
            <span>{meta.emoji}</span>
            <span>{meta.title}</span>
          </span>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-1">
          <h1 className="font-headline font-bold text-2xl text-on-background">
            {isRegister ? `Create ${meta.title} Account` : `${meta.title} Sign In`}
          </h1>
          <p className="text-xs text-on-surface-variant">
            {isRegister
              ? `Register a new ${meta.title.toLowerCase()} profile in Nivara.`
              : `Enter your email and password to access the ${meta.title.toLowerCase()} space.`}
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-error-container text-on-error-container text-xs font-medium flex items-start gap-2 border border-error/20 animate-fadeIn">
            <span className="material-symbols-outlined text-error text-base shrink-0 mt-0.5">error</span>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs focus:outline-none focus:border-primary text-on-background disabled:opacity-50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder={selectedRole === 'student' ? 'student@campus.edu' : `${selectedRole}@campus.edu`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs focus:outline-none focus:border-primary text-on-background disabled:opacity-50"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-on-surface">Password</label>
                <span className="text-[10px] text-on-surface-variant/70">(Min. 6 chars)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs focus:outline-none focus:border-primary text-on-background disabled:opacity-50"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-full bg-primary text-on-primary font-semibold text-xs tracking-wide hover:bg-primary-container transition-all shadow-md active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isRegister ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : (
              <span>{isRegister ? `Register as ${meta.title}` : `Sign In as ${meta.title}`}</span>
            )}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="pt-2 border-t border-surface-variant/40 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            disabled={loading}
            className="text-xs text-primary hover:underline font-medium"
          >
            {isRegister
              ? 'Already have an account? Sign in here'
              : `Need a ${meta.title.toLowerCase()} account? Create one`}
          </button>
        </div>

        {/* Security & Role Verification Note */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-[11px] text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base shrink-0">shield</span>
          <span>Role verification active: Your account will be verified against authorized {meta.title.toLowerCase()} records.</span>
        </div>
      </div>
    </div>
  );
};
