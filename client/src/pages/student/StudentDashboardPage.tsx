import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TwinStatus, CrisisResourceItem } from '../../types';
import { ApiClient } from '../../lib/apiClient';
import { userService } from '../../services/userService';

import { TopAppBar } from '../../components/layout/TopAppBar';
import { BottomNavBar } from '../../components/layout/BottomNavBar';
import { EmotionalCenter } from '../../features/home/EmotionalCenter';
import { TalkCompanionChat } from '../../features/companion/TalkCompanionChat';
import { DigitalTwinView } from '../../features/twin/DigitalTwinView';
import { PrivacyCenterView } from '../../features/privacy/PrivacyCenterView';
import { SilentCounsellorView } from '../../features/counsellor/SilentCounsellorView';
import { MyWellbeingView } from '../../features/assessment/MyWellbeingView';
import { SafetyModeModal } from '../../features/safety/SafetyModeModal';
import { BreathingModal } from '../../features/home/BreathingModal';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';

export const StudentDashboardPage: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [twinStatus, setTwinStatus] = useState<TwinStatus | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [helplines, setHelplines] = useState<CrisisResourceItem[]>([]);
  const [currentName, setCurrentName] = useState<string>(() => {
    return profile?.name || 'Sam';
  });

  const wellbeingId = profile?.wellbeingId || 'WELL-STUDENT';

  useEffect(() => {
    ApiClient.setWellbeingId(wellbeingId);

    // If profile has a name, update currentName
    if (profile?.name) {
      setCurrentName(profile.name);
    }

    // Load crisis helplines config
    ApiClient.getHelplines().then((res) => {
      if (res.helplines) setHelplines(res.helplines);
      else if (Array.isArray(res)) setHelplines(res);
    }).catch(() => {});

    loadAppState();
  }, [wellbeingId, profile]);

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

  const handleUpdateName = async (newName: string) => {
    setCurrentName(newName);
    if (user?.uid) {
      await userService.updateUserProfile(user.uid, { name: newName });
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col selection:bg-primary-fixed">
      {/* Top App Bar */}
      <TopAppBar
        wellbeingId={wellbeingId}
        role="student"
        onOpenSafety={() => setIsSafetyOpen(true)}
        onOpenPrivacy={() => setActiveTab('privacy')}
        onOpenBreathing={() => setIsBreathingOpen(true)}
        onLogout={logout}
        userName={currentName}
        onUpdateName={handleUpdateName}
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
              preferredName={currentName}
              onUpdatePreferredName={handleUpdateName}
            />
          )}
          {(activeTab === 'wellbeing' || activeTab === 'assessment') && (
            <MyWellbeingView
              wellbeingId={wellbeingId}
              onBackToDashboard={() => setActiveTab('home')}
              onOpenBreathing={() => setIsBreathingOpen(true)}
              onCheckinSubmitted={loadAppState}
            />
          )}
          {activeTab === 'talk' && (
            <TalkCompanionChat
              onOpenSafety={() => setIsSafetyOpen(true)}
              onRequestCounsellor={() => setActiveTab('support')}
              onNavigateTab={setActiveTab}
            />
          )}
          {activeTab === 'twin' && (
            <DigitalTwinView twinStatus={twinStatus} onNavigateTab={setActiveTab} />
          )}
          {(activeTab === 'support' || activeTab === 'counsellor') && (
            <SilentCounsellorView role="STUDENT" onNavigateTab={setActiveTab} />
          )}
          {(activeTab === 'profile' || activeTab === 'privacy') && (
            <PrivacyCenterView onLoggedOut={logout} />
          )}
        </ErrorBoundary>
      </main>

      {/* Bottom Navigation Bar for Mobile & Desktop Shell */}
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />

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
