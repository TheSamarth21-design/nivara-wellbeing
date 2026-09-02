import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TwinStatus, CrisisResourceItem } from '../../types';
import { ApiClient } from '../../lib/apiClient';

import { TopAppBar } from '../../components/layout/TopAppBar';
import { BottomNavBar } from '../../components/layout/BottomNavBar';
import { EmotionalCenter } from '../../features/home/EmotionalCenter';
import { TalkCompanionChat } from '../../features/companion/TalkCompanionChat';
import { DigitalTwinView } from '../../features/twin/DigitalTwinView';
import { WhatIfSimulatorView } from '../../features/simulator/WhatIfSimulatorView';
import { CampusRadarView } from '../../features/radar/CampusRadarView';
import { PrivacyCenterView } from '../../features/privacy/PrivacyCenterView';
import { SilentCounsellorView } from '../../features/counsellor/SilentCounsellorView';
import { SafetyModeModal } from '../../features/safety/SafetyModeModal';
import { BreathingModal } from '../../features/home/BreathingModal';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';

export const StudentDashboardPage: React.FC = () => {
  const { profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [twinStatus, setTwinStatus] = useState<TwinStatus | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [helplines, setHelplines] = useState<CrisisResourceItem[]>([]);

  const wellbeingId = profile?.wellbeingId || 'WELL-STUDENT';

  useEffect(() => {
    ApiClient.setWellbeingId(wellbeingId);

    // Load crisis helplines config
    ApiClient.getHelplines().then((res) => {
      if (res.helplines) setHelplines(res.helplines);
      else if (Array.isArray(res)) setHelplines(res);
    }).catch(() => {});

    loadAppState();
  }, [wellbeingId]);

  const loadAppState = async () => {
    try {
      const [twinRes, profRes] = await Promise.all([
        ApiClient.getTwinStatus(),
        ApiClient.getProfile()
      ]);
      setTwinStatus(twinRes);
      setProfileData(profRes);
    } catch (e) {
      console.error('Error loading student app state:', e);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col selection:bg-primary-fixed">
      {/* Top App Bar */}
      <TopAppBar
        wellbeingId={wellbeingId}
        role="student"
        language={language}
        onLanguageChange={setLanguage}
        onOpenSafety={() => setIsSafetyOpen(true)}
        onOpenPrivacy={() => setActiveTab('privacy')}
        onSwitchRole={() => {}}
        onOpenBreathing={() => setIsBreathingOpen(true)}
        onLogout={logout}
      />

      {/* Main Views Container */}
      <main className="flex-1">
        <ErrorBoundary fallbackTitle="Student Wellbeing Space" onReset={() => setActiveTab('home')}>
          {activeTab === 'home' && (
            <EmotionalCenter
              twinStatus={twinStatus}
              onCheckinSubmitted={loadAppState}
              onNavigateTab={setActiveTab}
              onOpenBreathing={() => setIsBreathingOpen(true)}
              preferredName={profile?.name || profileData?.profile?.preferred_name}
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
            <PrivacyCenterView onLoggedOut={logout} />
          )}
        </ErrorBoundary>
      </main>

      {/* Bottom Navigation Bar for Mobile & Desktop Shell */}
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} language={language} />

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
