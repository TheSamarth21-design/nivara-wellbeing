import React, { useState } from 'react';
import { MoodTier, TwinStatus } from '../../types';
import { ApiClient } from '../../lib/apiClient';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  twinStatus: TwinStatus | null;
  onCheckinSubmitted: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenBreathing: () => void;
  preferredName?: string;
  onUpdatePreferredName?: (name: string) => void;
}

export const EmotionalCenter: React.FC<Props> = ({
  twinStatus,
  onCheckinSubmitted,
  onNavigateTab,
  onOpenBreathing,
  preferredName,
  onUpdatePreferredName
}) => {
  const { t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState<MoodTier | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedToday, setSubmittedToday] = useState(false);
  const [showContextBanner, setShowContextBanner] = useState(true);
  const [quickWorkload, setQuickWorkload] = useState<'Low' | 'Moderate' | 'High' | 'Very high'>('High');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(preferredName || '');

  // Dynamic time-of-day greeting
  const hour = new Date().getHours();
  const greetingTime = hour < 12 ? t('good_morning', 'Good morning') : hour < 17 ? t('good_afternoon', 'Good afternoon') : t('good_evening', 'Good evening');

  const handleMoodSelect = async (tier: MoodTier) => {
    setSelectedMood(tier);
    setLoading(true);

    try {
      await ApiClient.submitCheckin({
        moodTier: tier,
        feelingTags: [tier, 'quick_bento'],
        note: `Quick 1-tap check-in: ${tier}`
      });
      setSubmittedToday(true);
      onCheckinSubmitted();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContext = async () => {
    try {
      await fetch('/api/twin/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim() && onUpdatePreferredName) {
      onUpdatePreferredName(tempName.trim());
      setIsEditingName(false);
    }
  };

  const moodOptions: Array<{ tier: MoodTier; emoji: string; label: string; bg: string }> = [
    { tier: 'good', emoji: '🙂', label: t('mood_good', 'Good'), bg: 'bg-primary-fixed/20 hover:bg-primary-fixed/40' },
    { tier: 'okay', emoji: '😐', label: t('mood_okay', 'Okay'), bg: 'bg-secondary-fixed/20 hover:bg-secondary-fixed/40' },
    { tier: 'not_great', emoji: '😕', label: t('mood_not_great', 'Not great'), bg: 'bg-tertiary-fixed/20 hover:bg-tertiary-fixed/40' },
    { tier: 'difficult', emoji: '😣', label: t('mood_difficult', 'Difficult'), bg: 'bg-error-container/40 hover:bg-error-container/60' }
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 flex flex-col gap-6 animate-fadeIn pb-24">
      {/* Header Greeting */}
      <section className="flex flex-col gap-1 mt-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-headline font-bold text-2xl md:text-3xl text-on-background flex items-center gap-2">
            <span>{greetingTime}</span>
            {preferredName && (
              <span>, <strong className="text-primary font-bold">{preferredName}</strong></span>
            )}
          </h1>
          {onUpdatePreferredName && (
            <button
              onClick={() => {
                setTempName(preferredName || '');
                setIsEditingName(!isEditingName);
              }}
              className="text-[11px] text-on-surface-variant/70 hover:text-primary p-1 rounded-full hover:bg-surface-container flex items-center"
              title="Edit your preferred display name"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          )}
        </div>

        {isEditingName && (
          <form onSubmit={handleSaveName} className="flex items-center gap-2 mt-1 animate-fadeIn max-w-sm">
            <input
              type="text"
              required
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Your preferred name (e.g. Sam)"
              className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/60 text-xs text-on-background focus:outline-none focus:border-primary flex-1"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold"
            >
              {t('save_name', 'Save')}
            </button>
            <button
              type="button"
              onClick={() => setIsEditingName(false)}
              className="px-2 py-1.5 text-xs text-on-surface-variant hover:text-on-surface"
            >
              ✕
            </button>
          </form>
        )}

        <p className="text-sm text-on-surface-variant max-w-lg">
          {t('greeting_sub', "You don't have to figure everything out right now.")}
        </p>
      </section>

      {/* Contextual Update Banner ("Has anything changed?") */}
      {showContextBanner && (
        <section className="p-4 rounded-3xl bg-secondary-container/30 border border-secondary-container/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-on-secondary text-base">
              📅
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-background">
                {t('routine_question', 'Has anything changed in your routine or exams?')}
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {t('routine_sub', 'Update your context to keep your Twin baseline calibrated.')}
              </span>
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
              {t('update_btn', 'Update')}
            </button>
            <button
              onClick={() => setShowContextBanner(false)}
              className="text-xs text-on-surface-variant hover:text-on-surface px-2"
            >
              {t('not_now_btn', 'Not now')}
            </button>
          </div>
        </section>
      )}

      {/* 4-Tier Daily Check-In Bento */}
      <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-semibold text-base text-on-background">
            {t('checkin_title', 'How are things feeling today?')}
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

      {/* Action Cards */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-8 bg-surface-container-lowest rounded-3xl p-7 shadow-sm border border-surface-variant/50 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary-fixed/30 rounded-full blur-2xl opacity-60 pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-2 max-w-sm">
            <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center text-primary mb-1">
              <span className="material-symbols-outlined text-xl">forum</span>
            </div>
            <h3 className="font-headline font-bold text-lg text-on-background">
              {t('talk_title', 'Talk privately with Companion')}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t('talk_desc', "What's on your mind? Share thoughts in a quiet, non-judgmental space via text or voice.")}
            </p>
          </div>
          <div className="relative z-10 mt-6 flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('talk')}
              className="px-6 py-3 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>{t('start_talking', 'Start talking')}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <button
              onClick={() => onNavigateTab('simulator')}
              className="px-4 py-3 rounded-full bg-surface-container hover:bg-surface-variant text-xs font-semibold text-on-surface transition-colors"
            >
              {t('what_if_btn', 'What-If Simulator')}
            </button>
          </div>
        </div>

        {/* 2-Minute Reset Quick Tool */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-3xl p-7 shadow-sm border border-surface-variant/50 flex flex-col justify-between min-h-[220px]">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-secondary">
              FOR YOU TODAY
            </span>
            <h3 className="font-headline font-bold text-lg text-on-background">
              {t('reset_title', '2-minute reset')}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t('reset_desc', 'A gentle box-breathing rhythm to decompress your mind.')}
            </p>
          </div>
          <button
            onClick={onOpenBreathing}
            className="w-full py-3 rounded-full bg-surface-container hover:bg-surface-variant text-xs font-semibold text-on-surface transition-colors mt-6 flex items-center justify-center gap-2"
          >
            <span className="text-base">🧘</span>
            <span>{t('start_reset', 'Start Reset')}</span>
          </button>
        </div>
      </section>

      {/* Twin Reflection Strip */}
      {twinStatus && (
        <section className="p-5 rounded-3xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌱</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-background">
                Baseline: {twinStatus.currentPatternState || 'Balanced'} ({twinStatus.confidenceLevel} calibration)
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {twinStatus.insights?.[0] || 'Your baseline remains balanced this week.'}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('twin')}
            className="text-xs text-primary font-semibold hover:underline shrink-0"
          >
            View Twin →
          </button>
        </section>
      )}
    </div>
  );
};
