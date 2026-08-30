import React, { useState } from 'react';
import { ApiClient } from '../../lib/apiClient';
import { UserSession } from '../../types';

interface Props {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginSelection: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);
    try {
      await ApiClient.sendOtp(email, 'email');
      setOtpSent(true);
      setOtp('123456'); // Pre-fill mock OTP for smooth evaluator testing
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await ApiClient.verifyOtp(email, otp, 'email');
      ApiClient.setWellbeingId(res.user.wellbeingId);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'STUDENT' | 'COUNSELLOR' | 'ADMIN') => {
    setLoading(true);
    try {
      const res = await ApiClient.demoLogin(role);
      ApiClient.setWellbeingId(res.user.wellbeingId);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Serene Floating Blob */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-fixed/40 rounded-full blur-3xl opacity-70 animate-subtle-float pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-fixed/40 rounded-full blur-3xl opacity-70 animate-subtle-float pointer-events-none" />

      <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl p-8 shadow-xl border border-surface-variant/60 flex flex-col gap-6 relative z-10">
        <div className="text-center flex flex-col items-center gap-2">
          <img
            src="/logo.png"
            alt="Nivara Logo"
            className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-outline-variant/40"
          />
          <h1 className="font-headline font-bold text-2xl text-on-background">Welcome to your quiet space</h1>
          <p className="text-xs text-on-surface-variant max-w-xs">
            A private space to reflect, talk, and discover personalized wellbeing pathways.
          </p>
        </div>

        {/* Identity Separation Notice */}
        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-primary-fixed/60 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary text-lg mt-0.5">lock_person</span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-primary">Strict Identity Separation</span>
            <span className="text-[11px] text-on-surface-variant leading-tight">
              Your login identity is kept strictly separate from your wellbeing identity. Counsellors only see an anonymous ID (e.g. WELL-8F42).
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-medium">
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-on-surface mb-1.5">
                College or Personal Email
              </label>
              <input
                type="email"
                required
                placeholder="student@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/60 text-sm focus:outline-none focus:border-primary text-on-background"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-primary text-on-primary font-semibold text-xs tracking-wide hover:bg-primary-container transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? 'Sending Verification Code...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-on-surface">Enter 6-Digit Code</label>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-[11px] text-primary hover:underline"
                >
                  Change email
                </button>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/60 text-center font-mono text-lg font-bold tracking-widest text-on-background"
              />
              <span className="text-[10px] text-on-surface-variant block mt-1 text-center">
                Demo default code: <strong className="text-primary">123456</strong>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-primary text-on-primary font-semibold text-xs tracking-wide hover:bg-primary-container transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Enter Space'}
            </button>
          </form>
        )}

        {/* SIH 2026 Evaluation Quick Portal Access */}
        <div className="pt-4 border-t border-surface-variant/40 flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant text-center">
            Evaluator Instant Demo Login
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickDemo('STUDENT')}
              className="py-2 rounded-xl bg-surface-container hover:bg-surface-variant text-[11px] font-semibold text-on-surface text-center"
            >
              👤 Student
            </button>
            <button
              onClick={() => handleQuickDemo('COUNSELLOR')}
              className="py-2 rounded-xl bg-secondary-container/40 hover:bg-secondary-container text-[11px] font-semibold text-on-secondary-container text-center"
            >
              🧑‍⚕️ Counsellor
            </button>
            <button
              onClick={() => handleQuickDemo('ADMIN')}
              className="py-2 rounded-xl bg-tertiary-container/40 hover:bg-tertiary-container text-[11px] font-semibold text-on-tertiary-container text-center"
            >
              📊 Campus Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
