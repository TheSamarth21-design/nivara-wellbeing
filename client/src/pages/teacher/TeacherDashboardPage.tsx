import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../lib/apiClient';

export const TeacherDashboardPage: React.FC = () => {
  const { profile, logout } = useAuth();
  const [radarData, setRadarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const [announcementsList, setAnnouncementsList] = useState<string[]>([
    'Upcoming Mid-Term Assessments: Faculty requested to maintain 15-minute review buffers.',
    'Library extended quiet hours and peer study circle rooms active for Semester 2.'
  ]);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralNote, setReferralNote] = useState('');
  const [referralSent, setReferralSent] = useState(false);

  useEffect(() => {
    ApiClient.getCampusRadar()
      .then((data) => setRadarData(data))
      .catch((err) => console.error('Error fetching teacher radar data:', err))
      .finally(() => setLoading(false));
  }, []);

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement.trim()) return;
    setAnnouncementsList((prev) => [announcement.trim(), ...prev]);
    setAnnouncement('');
  };

  const handleSendReferral = (e: React.FormEvent) => {
    e.preventDefault();
    setReferralSent(true);
    setTimeout(() => {
      setReferralSent(false);
      setShowReferralModal(false);
      setReferralNote('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col pb-16 selection:bg-secondary-fixed">
      {/* Teacher Portal Header */}
      <header className="bg-background/95 backdrop-blur sticky top-0 z-40 border-b border-surface-variant/40 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-[1100px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Nivara Logo"
              className="w-10 h-10 rounded-full object-cover shadow-sm border border-outline-variant/30"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold text-base text-primary">Nivara</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold uppercase tracking-wider">
                  Teacher Portal
                </span>
              </div>
              <span className="text-xs text-on-surface-variant">
                Faculty Workspace • {profile?.name || 'Faculty Member'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReferralModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold hover:opacity-90 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">support_agent</span>
              <span>Refer to Counsellor</span>
            </button>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-xs text-on-surface font-semibold flex items-center gap-1 border border-outline-variant/40 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1100px] mx-auto px-4 py-6 w-full flex flex-col gap-6 animate-fadeIn">
        {/* Welcome Banner */}
        <section className="p-6 rounded-3xl bg-secondary-fixed/25 border border-secondary-fixed flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-headline font-extrabold text-2xl text-on-background">
              Welcome, Prof. {profile?.name || 'Faculty'} 👨‍🏫
            </h1>
            <p className="text-xs text-on-surface-variant max-w-xl leading-relaxed">
              Monitor anonymized cohort stress indicators, publish class wellbeing guidelines, and coordinate proactive support while preserving strict student confidentiality.
            </p>
          </div>
          <button
            onClick={() => setShowReferralModal(true)}
            className="sm:hidden w-full py-2.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">support_agent</span>
            <span>Refer to Counsellor</span>
          </button>
        </section>

        {/* Overview Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-secondary mb-2">
              <span className="text-xs font-bold">Total Monitored</span>
              <span className="material-symbols-outlined text-xl">groups</span>
            </div>
            <span className="text-2xl font-black font-headline text-on-background">
              {radarData?.overallTotalStudents || 140}
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">Enrolled across 4 cohorts</span>
          </div>

          <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-primary mb-2">
              <span className="text-xs font-bold">Check-In Participation</span>
              <span className="material-symbols-outlined text-xl">fact_check</span>
            </div>
            <span className="text-2xl font-black font-headline text-primary">
              86.4%
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">Consistent 7-day participation</span>
          </div>

          <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-error mb-2">
              <span className="text-xs font-bold">Workload Alerts</span>
              <span className="material-symbols-outlined text-xl">warning</span>
            </div>
            <span className="text-2xl font-black font-headline text-error">
              2 Classes
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">Approaching major exam windows</span>
          </div>

          <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-tertiary mb-2">
              <span className="text-xs font-bold">Average Wellbeing</span>
              <span className="material-symbols-outlined text-xl">mood</span>
            </div>
            <span className="text-2xl font-black font-headline text-on-background">
              3.3 / 4.0
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">Healthy campus equilibrium</span>
          </div>
        </section>

        {/* Class Breakdown & Academic Pressure Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Departmental / Class Insights */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline font-bold text-base text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
                <span>Cohort Wellbeing & Academic Pressure</span>
              </h2>
              <span className="text-[11px] text-on-surface-variant font-mono">
                Cohort Shield (N ≥ 5)
              </span>
            </div>

            {loading ? (
              <div className="p-8 rounded-3xl bg-surface-container-lowest text-center text-xs text-on-surface-variant">
                Loading academic workload insights...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(radarData?.departments || []).map((dept: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-headline font-bold text-sm text-on-background">
                          {dept.department}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold">
                          {dept.studentCount} Students
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 text-xs">
                        <span className="text-on-surface-variant">Wellbeing Index:</span>
                        <span className="font-bold text-primary">{dept.averageMoodIndex || '3.2'} / 4.0</span>
                      </div>

                      <div className="p-3 mt-3 rounded-2xl bg-surface-container-low text-[11px] text-on-surface flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm text-secondary shrink-0 mt-0.5">tips_and_updates</span>
                        <span className="leading-relaxed">
                          {dept.recommendedCampusAction || 'Encourage study breaks before exams.'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Announcements & Quick Actions */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h2 className="font-headline font-bold text-base text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-xl">campaign</span>
              <span>Announcements</span>
            </h2>

            <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col gap-4">
              <form onSubmit={handlePostAnnouncement} className="flex flex-col gap-2.5">
                <label className="text-xs font-semibold text-on-surface">Publish Class Notice</label>
                <textarea
                  rows={2}
                  placeholder="Share exam buffers or wellness reminders..."
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs focus:outline-none focus:border-primary text-on-background"
                />
                <button
                  type="submit"
                  disabled={!announcement.trim()}
                  className="py-2.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Post Notice
                </button>
              </form>

              <div className="flex flex-col gap-2 pt-2 border-t border-surface-variant/40 max-h-56 overflow-y-auto">
                {announcementsList.map((ann, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-surface-container-low text-xs text-on-surface leading-relaxed flex items-start gap-2">
                    <span className="text-secondary text-xs mt-0.5">•</span>
                    <span>{ann}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Classroom Toolkits */}
            <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col gap-3">
              <h3 className="font-headline font-bold text-xs text-on-background uppercase tracking-wider">
                Teacher Guidelines
              </h3>
              <div className="flex flex-col gap-2 text-xs">
                <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
                  <span>📘 Exam Buffer Best Practices</span>
                  <span className="material-symbols-outlined text-primary text-base">download</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
                  <span>🌱 5-Minute In-Class Breathwork</span>
                  <span className="material-symbols-outlined text-primary text-base">play_circle</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Refer to Counsellor Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-md w-full border border-surface-variant/60 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3">
              <h3 className="font-headline font-bold text-base text-on-background">
                Refer Student / Class to Counselling
              </h3>
              <button
                onClick={() => setShowReferralModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant"
              >
                ✕
              </button>
            </div>

            {referralSent ? (
              <div className="p-4 rounded-2xl bg-primary-fixed text-on-primary-fixed text-xs font-semibold text-center">
                ✓ Confidential support referral dispatched to Campus Counselling Desk.
              </div>
            ) : (
              <form onSubmit={handleSendReferral} className="flex flex-col gap-3">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Notice a student experiencing intense academic fatigue or isolation? Submit a discreet notification. Identity remains strictly partitioned.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Student ID or Class Context (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WELL-8F42 or CSE 3rd Year Section A"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Observations / Support Request Notes
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe observed concerns (e.g. recurring absence, visible distress during exams)..."
                    value={referralNote}
                    onChange={(e) => setReferralNote(e.target.value)}
                    className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-md hover:opacity-90"
                >
                  Submit Discreet Referral
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
