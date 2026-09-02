import React, { useState, useEffect } from 'react';
import { UserSession, UserRole, TwinStatus, CrisisResourceItem } from './types';
import { ApiClient } from './lib/apiClient';

import { TopAppBar } from './components/layout/TopAppBar';
import { BottomNavBar } from './components/layout/BottomNavBar';
import { LoginSelection } from './features/auth/LoginSelection';
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';
import { EmotionalCenter } from './features/home/EmotionalCenter';
import { TalkCompanionChat } from './features/companion/TalkCompanionChat';
import { DigitalTwinView } from './features/twin/DigitalTwinView';
import { WhatIfSimulatorView } from './features/simulator/WhatIfSimulatorView';
import { SilentCounsellorView } from './features/counsellor/SilentCounsellorView';
import { CampusRadarView } from './features/radar/CampusRadarView';
import { PrivacyCenterView } from './features/privacy/PrivacyCenterView';
import { AdminPortalView } from './features/admin/AdminPortalView';
import { SafetyModeModal } from './features/safety/SafetyModeModal';
import { BreathingModal } from './features/home/BreathingModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [twinStatus, setTwinStatus] = useState<TwinStatus | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [helplines, setHelplines] = useState<CrisisResourceItem[]>([]);

  useEffect(() => {
    // Load crisis helplines config
    ApiClient.getHelplines().then((res) => {
      if (res.helplines) setHelplines(res.helplines);
    });

    // Check if an existing session is saved in localStorage
    const savedId = localStorage.getItem('nivara_wellbeing_id') || localStorage.getItem('kindred_wellbeing_id');
    if (savedId) {
      ApiClient.setWellbeingId(savedId);
      ApiClient.getProfile().then(prof => {
        if (prof && prof.profile) {
          setSession({
            wellbeingId: savedId,
            role: 'STUDENT',
            onboardingCompleted: true
          });
          setProfileData(prof);
          ApiClient.getTwinStatus().then(t => setTwinStatus(t));
        } else {
          localStorage.removeItem('nivara_wellbeing_id');
          localStorage.removeItem('kindred_wellbeing_id');
        }
      }).catch(() => {
        localStorage.removeItem('nivara_wellbeing_id');
        localStorage.removeItem('kindred_wellbeing_id');
      });
    }
  }, []);

  const loadAppState = async () => {
    try {
      const [twinRes, profRes] = await Promise.all([
        ApiClient.getTwinStatus(),
        ApiClient.getProfile()
      ]);
      setTwinStatus(twinRes);
      setProfileData(profRes);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    let wId = session?.wellbeingId || 'WELL-0001';
    if (newRole === 'COUNSELLOR') wId = 'COUNSELLOR-01';
    if (newRole === 'ADMIN') wId = 'ADMIN-01';

    ApiClient.setWellbeingId(wId);
    setSession({
      wellbeingId: wId,
      role: newRole,
      onboardingCompleted: true
    });
    if (newRole === 'COUNSELLOR') setActiveTab('counsellor');
    else if (newRole === 'ADMIN') setActiveTab('admin');
    else setActiveTab('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('nivara_wellbeing_id');
    localStorage.removeItem('kindred_wellbeing_id');
    setSession(null);
    setTwinStatus(null);
    setProfileData(null);
    setActiveTab('home');
  };

  // If not logged in, display the Login & OTP Screen
  if (!session) {
    return <LoginSelection onLoginSuccess={(s) => { setSession(s); loadAppState(); }} />;
  }

  // If first-time user and onboarding not completed, display the 7-step wizard
  if (!session.onboardingCompleted) {
    return (
      <OnboardingWizard
        onComplete={() => {
          setSession({ ...session, onboardingCompleted: true });
          loadAppState();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col selection:bg-primary-fixed">
      {/* Top App Bar */}
      <TopAppBar
        wellbeingId={session.wellbeingId}
        role={session.role}
        language={language}
        onLanguageChange={setLanguage}
        onOpenSafety={() => setIsSafetyOpen(true)}
        onOpenPrivacy={() => setActiveTab('privacy')}
        onSwitchRole={handleRoleSwitch}
        onOpenBreathing={() => setIsBreathingOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Views Container */}
      <main className="flex-1">
        <ErrorBoundary fallbackTitle="Digital Wellbeing Space" onReset={() => setActiveTab('home')}>
          {session.role === 'COUNSELLOR' ? (
            <SilentCounsellorView role="COUNSELLOR" />
          ) : session.role === 'ADMIN' ? (
            <AdminPortalView />
          ) : (
            <>
              {activeTab === 'home' && (
                <EmotionalCenter
                  twinStatus={twinStatus}
                  onCheckinSubmitted={loadAppState}
                  onNavigateTab={setActiveTab}
                  onOpenBreathing={() => setIsBreathingOpen(true)}
                  preferredName={profileData?.profile?.preferred_name}
                />
              )}
              {activeTab === 'talk' && (
                <TalkCompanionChat
                  onOpenSafety={() => setIsSafetyOpen(true)}
                  onRequestCounsellor={() => setActiveTab('counsellor')}
                />
              )}
              {activeTab === 'twin' && (
                <DigitalTwinView twinStatus={twinStatus} onNavigateTab={setActiveTab} />
              )}
              {activeTab === 'simulator' && <WhatIfSimulatorView />}
              {activeTab === 'radar' && <CampusRadarView />}
              {activeTab === 'counsellor' && <SilentCounsellorView role="STUDENT" />}
              {activeTab === 'privacy' && (
                <PrivacyCenterView onLoggedOut={handleLogout} />
              )}
            </>
          )}
        </ErrorBoundary>
      </main>

      {/* Bottom Navigation Bar for Mobile & Desktop Shell */}
      {session.role === 'STUDENT' && (
        <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} language={language} />
      )}

      {/* Modals */}
      <SafetyModeModal
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
        helplines={helplines}
      />
      <BreathingModal
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
      />
    </div>
  );
};
