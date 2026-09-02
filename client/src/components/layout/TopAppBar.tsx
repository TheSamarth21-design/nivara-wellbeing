import React, { useState } from 'react';
import { UserRole } from '../../types';

interface Props {
  wellbeingId: string;
  role: UserRole;
  language: string;
  onLanguageChange: (lang: 'en' | 'hi' | 'mr') => void;
  onOpenSafety: () => void;
  onOpenPrivacy: () => void;
  onSwitchRole: (role: UserRole) => void;
  onOpenBreathing?: () => void;
  onLogout?: () => void;
}

export const TopAppBar: React.FC<Props> = ({
  wellbeingId,
  role,
  language,
  onLanguageChange,
  onOpenSafety,
  onOpenPrivacy,
  onSwitchRole,
  onOpenBreathing,
  onLogout
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(wellbeingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleLabels: Record<UserRole, { title: string; icon: string; desc: string }> = {
    STUDENT: { title: 'Student Portal', icon: 'school', desc: 'Daily check-ins & digital twin' },
    COUNSELLOR: { title: 'Counsellor Desk', icon: 'support_agent', desc: 'Anonymous queue & intervention' },
    ADMIN: { title: 'Campus Radar Admin', icon: 'admin_panel_settings', desc: 'Cohort analytics & safety logs' }
  };

  return (
    <>
      <header className="bg-background/95 backdrop-blur sticky top-0 z-40 border-b border-surface-variant/40 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-[1100px] mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Left: Brand & Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo.png"
              alt="Nivara Logo"
              className="w-9 h-9 rounded-full object-cover shadow-sm border border-outline-variant/30 shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline font-bold text-primary text-base tracking-tight">Nivara</span>
                {role !== 'STUDENT' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold shrink-0">
                    {role}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-on-surface-variant/80 font-mono truncate hidden sm:inline">
                {role === 'STUDENT' ? `ID: ${wellbeingId}` : roleLabels[role].title}
              </span>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop-only quick role switcher */}
            <div className="hidden lg:flex items-center gap-2">
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

              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as any)}
                className="text-xs bg-surface-container px-2 py-1.5 rounded-lg border border-outline-variant/60 text-on-surface cursor-pointer focus:outline-none"
              >
                <option value="en">EN</option>
                <option value="hi">हिंदी</option>
                <option value="mr">मराठी</option>
              </select>
            </div>

            {/* Emergency Crisis Button - Always accessible */}
            <button
              onClick={onOpenSafety}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-container/80 text-on-error-container text-xs font-semibold hover:bg-error-container transition-all active:scale-95 shadow-sm"
              title="Immediate Crisis Support"
            >
              <span className="material-symbols-outlined text-sm text-error">emergency</span>
              <span className="hidden xs:inline sm:inline">Helplines</span>
              <span className="inline xs:hidden sm:hidden">SOS</span>
            </button>

            {/* 3-Line Hamburger Menu Button (Three-Line Feature) */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container hover:bg-surface-variant/70 text-on-surface transition-all active:scale-95 border border-outline-variant/40"
              aria-label="Open Navigation Menu"
              title="Menu & Controls"
            >
              <span className="material-symbols-outlined text-2xl leading-none">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3-Line Hamburger Slide-Over Drawer Panel */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-on-background/30 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative z-10 w-full max-w-[360px] bg-surface-container-lowest h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-surface-variant/60">
            {/* Drawer Header */}
            <div>
              <div className="p-5 border-b border-surface-variant/40 flex items-center justify-between bg-surface-container-low">
                <div className="flex items-center gap-2.5">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <h2 className="font-headline font-bold text-sm text-on-background">Nivara Wellbeing</h2>
                    <span className="text-[10px] text-on-surface-variant">Anonymous Student Support</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant/60 text-on-surface-variant"
                  aria-label="Close menu"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Identity & Wellbeing ID Card */}
              <div className="p-4 border-b border-surface-variant/40">
                <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Active Session ID
                    </span>
                    <button
                      onClick={handleCopyId}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-lowest text-primary font-medium hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-1 border border-outline-variant/30"
                    >
                      <span className="material-symbols-outlined text-xs">content_copy</span>
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <span className="font-mono font-bold text-sm text-primary tracking-tight">
                    {wellbeingId}
                  </span>
                  <p className="text-[10px] text-on-surface-variant leading-tight">
                    🔒 Identity Separated: Your real identity is never exposed to peers or public campus boards.
                  </p>
                </div>
              </div>

              {/* Portal / Role Switcher Section */}
              <div className="p-4 border-b border-surface-variant/40 flex flex-col gap-2">
                <span className="text-xs font-bold text-on-background">Switch View / Portal</span>
                <div className="flex flex-col gap-1.5">
                  {(['STUDENT', 'COUNSELLOR', 'ADMIN'] as UserRole[]).map((r) => {
                    const info = roleLabels[r];
                    const isSelected = role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          onSwitchRole(r);
                          setIsMenuOpen(false);
                        }}
                        className={`p-3 rounded-2xl text-left border flex items-center gap-3 transition-all ${
                          isSelected
                            ? 'bg-primary-fixed/40 border-primary text-on-primary-fixed shadow-sm'
                            : 'bg-surface-container-low border-outline-variant/40 hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-xl ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {info.icon}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{info.title}</span>
                          <span className="text-[10px] text-on-surface-variant">{info.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selection */}
              <div className="p-4 border-b border-surface-variant/40 flex flex-col gap-2">
                <span className="text-xs font-bold text-on-background">Select Language</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'en', label: 'English', sub: 'English' },
                    { id: 'hi', label: 'हिंदी', sub: 'Hindi' },
                    { id: 'mr', label: 'मराठी', sub: 'Marathi' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => onLanguageChange(l.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        language === l.id
                          ? 'bg-primary text-on-primary border-primary font-bold shadow-sm'
                          : 'bg-surface-container-low border-outline-variant/40 text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span className="text-xs block font-bold">{l.label}</span>
                      <span className="text-[10px] opacity-80 block">{l.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Wellbeing Shortcuts */}
              <div className="p-4 flex flex-col gap-1.5">
                <span className="text-xs font-bold text-on-background mb-1">Quick Tools</span>

                {onOpenBreathing && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenBreathing();
                    }}
                    className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container text-left flex items-center gap-3 text-xs text-on-surface border border-outline-variant/30"
                  >
                    <span className="text-lg">🧘</span>
                    <div className="flex flex-col">
                      <span className="font-semibold">2-Minute Reset</span>
                      <span className="text-[10px] text-on-surface-variant">Guided box breathing exercise</span>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenPrivacy();
                  }}
                  className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container text-left flex items-center gap-3 text-xs text-on-surface border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
                  <div className="flex flex-col">
                    <span className="font-semibold">Privacy & Consent Center</span>
                    <span className="text-[10px] text-on-surface-variant">Control what data is shared</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenSafety();
                  }}
                  className="p-3 rounded-2xl bg-error-container/30 hover:bg-error-container/50 text-left flex items-center gap-3 text-xs text-on-error-container border border-error/30"
                >
                  <span className="material-symbols-outlined text-error text-lg">emergency</span>
                  <div className="flex flex-col">
                    <span className="font-semibold">24/7 Crisis Helplines</span>
                    <span className="text-[10px] text-on-error-container/80">Tele-MANAS & Kiran Toll-Free</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Drawer Footer: Logout */}
            <div className="p-4 border-t border-surface-variant/40 bg-surface-container-low">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full py-2.5 rounded-full bg-surface-container-highest hover:bg-surface-variant text-xs font-semibold text-on-surface transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Sign Out / Switch Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
