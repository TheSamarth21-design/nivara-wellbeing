import React from 'react';
import { UserRole } from '../../types';

interface Props {
  wellbeingId: string;
  role: UserRole;
  language: string;
  onLanguageChange: (lang: 'en' | 'hi' | 'mr') => void;
  onOpenSafety: () => void;
  onOpenPrivacy: () => void;
  onSwitchRole: (role: UserRole) => void;
}

export const TopAppBar: React.FC<Props> = ({
  wellbeingId,
  role,
  language,
  onLanguageChange,
  onOpenSafety,
  onOpenPrivacy,
  onSwitchRole
}) => {
  return (
    <header className="bg-background/95 backdrop-blur sticky top-0 z-40 border-b border-surface-variant/40">
      <div className="max-w-[1100px] mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Avatar & Identity Separation Display */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Nivara Logo"
            className="w-10 h-10 rounded-full object-cover shadow-sm border border-outline-variant/30"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline font-semibold text-primary text-base">Nivara</span>
              {role !== 'STUDENT' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-medium">
                  {role}
                </span>
              )}
            </div>
            <span className="text-xs text-on-surface-variant/80 font-mono tracking-tight">
              {role === 'STUDENT' ? `ID: ${wellbeingId}` : role === 'COUNSELLOR' ? 'Counsellor Desk' : 'Campus Admin'}
            </span>
          </div>
        </div>

        {/* Right Actions: Language Switcher, Role Switcher, Safety, Privacy */}
        <div className="flex items-center gap-2">
          {/* Quick Role Switcher for SIH 2026 Evaluators */}
          <select
            value={role}
            onChange={(e) => onSwitchRole(e.target.value as UserRole)}
            className="text-xs bg-surface-container px-2.5 py-1.5 rounded-lg border border-outline-variant/60 text-on-surface font-medium cursor-pointer focus:outline-none"
            title="Switch Prototype Portal"
          >
            <option value="STUDENT">Student Portal</option>
            <option value="COUNSELLOR">Counsellor Desk</option>
            <option value="ADMIN">Campus Radar Admin</option>
          </select>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as any)}
            className="text-xs bg-surface-container px-2 py-1.5 rounded-lg border border-outline-variant/60 text-on-surface cursor-pointer focus:outline-none"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
          </select>

          {/* Emergency Crisis Button (RED safety triggers) */}
          <button
            onClick={onOpenSafety}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-error-container/70 text-on-error-container text-xs font-semibold hover:bg-error-container transition-colors"
            title="Immediate Crisis Support"
          >
            <span className="material-symbols-outlined text-sm">emergency</span>
            <span>Helplines</span>
          </button>

          {/* Privacy & Security */}
          <button
            onClick={onOpenPrivacy}
            className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-surface-variant/60 transition-colors"
            title="Privacy & Consent Center"
          >
            <span className="material-symbols-outlined text-xl">verified_user</span>
          </button>
        </div>
      </div>
    </header>
  );
};
