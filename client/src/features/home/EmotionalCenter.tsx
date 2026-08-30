import React, { useState } from 'react';
import { MoodTier, TwinStatus } from '../../types';
import { ApiClient } from '../../lib/apiClient';

interface Props {
  twinStatus: TwinStatus | null;
  onCheckinSubmitted: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenBreathing: () => void;
  preferredName?: string;
}

export const EmotionalCenter: React.FC<Props> = ({
  twinStatus,
  onCheckinSubmitted,
  onNavigateTab,
  onOpenBreathing,
  preferredName
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodTier | null>(null);
  const [note, setNote] = useState('');
  const [submittedToday, setSubmittedToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showContextBanner, setShowContextBanner] = useState(true);
  const [quickWorkload, setQuickWorkload] = useState<'Low' | 'Moderate' | 'High' | 'Very high'>('High');

  const handleMoodSelect = async (mood: MoodTier) => {
    setSelectedMood(mood);
    setLoading(true);
    try {
      await ApiClient.submitCheckin({
        moodTier: mood,
        feelingTags: ['Daily Reflection'],
        note: note || undefined
      });
      setSubmittedToday(true);
      onCheckinSubmitted();
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContext = async () => {
    try {
      await ApiClient.request('/profile/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          academicContext: {
            workload: quickWorkload,
            upcomingEvent: 'Exams approaching',
            pressure: 'Quite stressful'
          }
        })
      });
      setShowContextBanner(false);
      onCheckinSubmitted();
    } catch (e) {
      console.error(e);
    }
  };

  const moodOptions: Array<{ tier: MoodTier; emoji: string; label: string; bg: string }> = [
    { tier: 'good', emoji: '🙂', label: 'Good', bg: 'bg-primary-fixed/20 hover:bg-primary-fixed/40' },
    { tier: 'okay', emoji: '😐', label: 'Okay', bg: 'bg-secondary-fixed/20 hover:bg-secondary-fixed/40' },
    { tier: 'not_great', emoji: '😕', label: 'Not great', bg: 'bg-tertiary-fixed/20 hover:bg-tertiary-fixed/40' },
    { tier: 'difficult', emoji: '😣', label: 'Difficult', bg: 'bg-error-container/40 hover:bg-error-container/60' }
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 flex flex-col gap-6 animate-fadeIn pb-24">
      {/* Header Greeting */}
      <section className="flex flex-col gap-1 mt-2">
        <h1 className="font-headline font-bold text-2xl md:text-3xl text-on-background">
          Good evening {preferredName ? `, ${preferredName}` : '🌿'}
        </h1>
        <p className="text-sm text-on-surface-variant max-w-lg">
          You don't have to figure everything out right now.
        </p>
      </section>

      {/* Contextual Update Banner ("Has anything changed?") - Section 4 Requirement */}
      {showContextBanner && (
        <section className="p-4 rounded-3xl bg-secondary-container/30 border border-secondary-container/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-on-secondary text-base">
              📅
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-background">Has anything changed in your routine or exams?</span>
              <span className="text-[11px] text-on-surface-variant">Update your context to keep your Twin baseline calibrated.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <select
              value={quickWorkload}
              onChange={(e) => setQuickWorkload(e.target.value as any)}
              className="text-xs bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/60 text-on-surface"
            >
              <option value="Low">Low Workload</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High Workload</option>
              <option value="Very high">Very High</option>
            </select>
            <button
              onClick={handleUpdateContext}
              className="px-3.5 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-semibold hover:opacity-90"
            >
              Update
            </button>
            <button
              onClick={() => setShowContextBanner(false)}
              className="text-xs text-on-surface-variant hover:text-on-surface px-2"
            >
              Not now
            </button>
          </div>
        </section>
      )}

      {/* 4-Tier Low Friction Daily Check-In Bento */}
      <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-semibold text-base text-on-background">
            How are things feeling today?
          </h2>
          {submittedToday && (
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              ✓ Logged to Twin
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {moodOptions.map((opt) => (
            <button
              key={opt.tier}
              onClick={() => handleMoodSelect(opt.tier)}
              disabled={loading}
              className={`flex flex-col items-center justify-center p-5 rounded-2xl border border-outline-variant/40 transition-all duration-200 group ${opt.bg} ${
                selectedMood === opt.tier ? 'ring-2 ring-primary scale-102 font-bold' : ''
              }`}
            >
              <span className="text-3xl group-hover:scale-110 transition-transform duration-200 mb-2">
                {opt.emoji}
              </span>
              <span className="text-xs text-on-surface font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Action Cards (Asymmetric Stitch Layout) */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-8 bg-surface-container-lowest rounded-3xl p-7 shadow-sm border border-surface-variant/50 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary-fixed/30 rounded-full blur-2xl opacity-60 pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-2 max-w-sm">
            <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center text-primary mb-1">
              <span className="material-symbols-outlined text-xl">forum</span>
            </div>
            <h3 className="font-headline font-bold text-lg text-on-background">Talk privately with Companion</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              What's on your mind? Share thoughts in a quiet, non-judgmental space via text or voice.
            </p>
          </div>
          <div className="relative z-10 mt-6 flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('talk')}
              className="px-6 py-3 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>Start talking</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <button
              onClick={() => onNavigateTab('simulator')}
              className="px-4 py-3 rounded-full bg-surface-container hover:bg-surface-variant text-xs font-semibold text-on-surface transition-colors"
            >
              What-If Simulator
            </button>
          </div>
        </div>

        <div className="md:col-span-4 bg-surface-container-low rounded-3xl p-6 shadow-sm border border-surface-variant/50 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-widest font-bold text-secondary">For you today</span>
            <h3 className="font-headline font-bold text-base text-on-background">2-minute reset</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              A gentle box-breathing rhythm to decompress your mind.
            </p>
          </div>
          <button
            onClick={onOpenBreathing}
            className="mt-6 w-max px-6 py-2.5 rounded-full border border-secondary text-secondary text-xs font-semibold hover:bg-secondary/10 transition-colors"
          >
            Start Reset
          </button>
        </div>
      </section>

      {/* Digital Twin Snapshot Pill */}
      {twinStatus && (
        <section
          onClick={() => onNavigateTab('twin')}
          className="p-5 rounded-3xl bg-surface-container-lowest border border-primary-fixed/60 shadow-sm flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-fixed to-secondary-fixed flex items-center justify-center text-2xl shadow-inner">
              🔮
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold text-sm text-on-background">Digital Wellbeing Twin</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  twinStatus.currentPatternState === 'Stable'
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : twinStatus.currentPatternState === 'Improving'
                    ? 'bg-secondary-fixed text-on-secondary-fixed'
                    : 'bg-tertiary-fixed text-on-tertiary-fixed'
                }`}>
                  {twinStatus.currentPatternState}
                </span>
              </div>
              <span className="text-xs text-on-surface-variant mt-0.5">
                {twinStatus.lastShiftDetected || 'Observing daily patterns'}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </section>
      )}
    </div>
  );
};
