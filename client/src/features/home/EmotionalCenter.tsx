import React, { useState, useEffect } from 'react';
import { MoodTier, TwinStatus } from '../../types';
import { ApiClient } from '../../lib/apiClient';
import { AiApiClient } from '../../services/aiApi';
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

  // Multi-metric Check-in State
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState<'High' | 'Normal' | 'Low' | 'Very Low'>('Normal');
  const [stressLevel, setStressLevel] = useState<'Low' | 'Moderate' | 'High'>('Moderate');
  const [sleepQuality, setSleepQuality] = useState<'Good' | 'Okay' | 'Poor'>('Okay');
  const [showOptionalNote, setShowOptionalNote] = useState(false);
  const [optionalNote, setOptionalNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedToday, setSubmittedToday] = useState(false);
  const [aiStatus, setAiStatus] = useState<'ONLINE' | 'OFFLINE' | 'CHECKING'>('CHECKING');

  useEffect(() => {
    AiApiClient.checkHealth()
      .then((st) => setAiStatus(st as any))
      .catch(() => setAiStatus('OFFLINE'));
  }, []);

  // Smart Adaptive Question State
  const [adaptiveQuestion, setAdaptiveQuestion] = useState<{
    id: string;
    question: string;
    options: string[];
  } | null>(null);
  const [adaptiveDismissed, setAdaptiveDismissed] = useState(false);
  const [adaptiveSelectedOption, setAdaptiveSelectedOption] = useState<string | null>(null);

  // Preferred Name inline editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(preferredName || '');

  // Load any pending adaptive question on mount
  useEffect(() => {
    ApiClient.getAdaptiveQuestion().then((q) => {
      if (q) setAdaptiveQuestion(q);
    });
  }, []);

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greetingTime =
    hour < 12
      ? t('good_morning', 'Good morning')
      : hour < 17
      ? t('good_afternoon', 'Good afternoon')
      : t('good_evening', 'Good evening');

  const moodOptions = [
    { score: 5, emoji: '😄', label: 'Great', tier: 'good', color: 'hover:border-primary border-outline-variant/40' },
    { score: 4, emoji: '🙂', label: 'Good', tier: 'good', color: 'hover:border-primary border-outline-variant/40' },
    { score: 3, emoji: '😐', label: 'Okay', tier: 'okay', color: 'hover:border-secondary border-outline-variant/40' },
    { score: 2, emoji: '😟', label: 'Low', tier: 'not_great', color: 'hover:border-tertiary border-outline-variant/40' },
    { score: 1, emoji: '😞', label: 'Very Low', tier: 'difficult', color: 'hover:border-error border-outline-variant/40' }
  ];

  const handleMoodSelect = async (score: number) => {
    setMoodScore(score);
    setLoading(true);

    try {
      const res = await ApiClient.submitEnhancedCheckin({
        moodScore: score,
        energyLevel,
        stressLevel,
        sleepQuality,
        note: optionalNote.trim() || undefined
      });

      setSubmittedToday(true);
      if (res?.adaptiveQuestion) {
        setAdaptiveQuestion(res.adaptiveQuestion);
      }
      onCheckinSubmitted();
    } catch (e) {
      console.error('Checkin error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdaptiveAnswer = async (option: string) => {
    setAdaptiveSelectedOption(option);
    // Add memory to companion context seamlessly
    try {
      await ApiClient.request('/companion/memory', {
        method: 'POST',
        body: JSON.stringify({
          key: 'Primary stress contributor',
          value: option
        })
      });
    } catch {
      // Non-blocking
    }
    setTimeout(() => {
      setAdaptiveQuestion(null);
    }, 1500);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim() && onUpdatePreferredName) {
      onUpdatePreferredName(tempName.trim());
      setIsEditingName(false);
    }
  };

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
              title="Edit display name"
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

      {/* Smart Adaptive Question Card (Triggers upon High Stress / Low Mood) */}
      {adaptiveQuestion && !adaptiveDismissed && (
        <section className="p-5 rounded-3xl bg-secondary-container/25 border border-secondary-container shadow-sm flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🌿</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-background">
                  {adaptiveQuestion.question}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Optional — helps Nivara tailor today's conversations
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAdaptiveDismissed(true)}
              className="text-xs text-on-surface-variant hover:text-on-surface p-1 rounded-full"
              title="Dismiss question"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {adaptiveQuestion.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleAdaptiveAnswer(opt)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  adaptiveSelectedOption === opt
                    ? 'bg-secondary text-on-secondary border-secondary shadow-sm'
                    : 'bg-surface-container-lowest border-outline-variant/50 text-on-surface hover:bg-surface-container'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {adaptiveSelectedOption && (
            <span className="text-[11px] text-primary font-medium mt-1">
              ✓ Understood. Nivara will keep this in mind.
            </span>
          )}
        </section>
      )}

      {/* Today's Wellbeing Check-In Bento */}
      <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/50 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-headline font-bold text-base text-on-background">
              {t('checkin_title', 'How are you feeling today?')}
            </h2>
            <span className="text-xs text-on-surface-variant">
              Quick 1-tap selectors — no typing needed
            </span>
          </div>
          {submittedToday && (
            <span className="text-xs text-primary font-bold flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
              ✓ Logged to Twin
            </span>
          )}
        </div>

        {/* 1. Emoji Mood Selector (5 levels) */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {moodOptions.map((opt) => (
            <button
              key={opt.score}
              type="button"
              onClick={() => handleMoodSelect(opt.score)}
              disabled={loading}
              className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl border transition-all duration-200 ${
                moodScore === opt.score
                  ? 'bg-primary/15 border-primary ring-2 ring-primary/30 shadow-sm scale-102'
                  : 'bg-surface-container-low ' + opt.color
              }`}
            >
              <span className="text-2xl sm:text-3xl mb-1 hover:scale-110 transition-transform">
                {opt.emoji}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-on-surface text-center">
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        {/* 2. Energy, Stress & Sleep Segmented Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-surface-variant/30">
          {/* Energy */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-on-background">Energy today:</span>
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'High', icon: '⚡' },
                { id: 'Normal', icon: '🔋' },
                { id: 'Low', icon: '🪫' },
                { id: 'Very Low', icon: '💤' }
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setEnergyLevel(lvl.id as any)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-semibold border text-center transition-all flex flex-col items-center gap-0.5 ${
                    energyLevel === lvl.id
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container'
                  }`}
                  title={lvl.id}
                >
                  <span className="text-xs">{lvl.icon}</span>
                  <span className="truncate w-full">{lvl.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stress Level */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-on-background">Stress level:</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'Low', icon: '🟢' },
                { id: 'Moderate', icon: '🟡' },
                { id: 'High', icon: '🔴' }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStressLevel(st.id as any)}
                  className={`py-2 px-1.5 rounded-xl text-[11px] font-semibold border text-center transition-all flex items-center justify-center gap-1.5 ${
                    stressLevel === st.id
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span>{st.icon}</span>
                  <span>{st.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Quality */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-on-background">Recent sleep:</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'Good', icon: '🌙' },
                { id: 'Okay', icon: '😐' },
                { id: 'Poor', icon: '🥱' }
              ].map((sl) => (
                <button
                  key={sl.id}
                  type="button"
                  onClick={() => setSleepQuality(sl.id as any)}
                  className={`py-2 px-1.5 rounded-xl text-[11px] font-semibold border text-center transition-all flex items-center justify-center gap-1.5 ${
                    sleepQuality === sl.id
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span>{sl.icon}</span>
                  <span>{sl.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Optional Written Reflection (Collapsible, purely optional per Part 20) */}
        <div className="pt-2">
          {!showOptionalNote ? (
            <button
              type="button"
              onClick={() => setShowOptionalNote(true)}
              className="text-xs text-on-surface-variant hover:text-primary font-medium flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Would you like to share anything in your own words? (Optional)</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-on-background">Personal reflection (Optional):</span>
                <button
                  type="button"
                  onClick={() => setShowOptionalNote(false)}
                  className="text-[11px] text-on-surface-variant hover:underline"
                >
                  Hide
                </button>
              </div>
              <textarea
                rows={2}
                value={optionalNote}
                onChange={(e) => setOptionalNote(e.target.value)}
                placeholder="Share anything on your mind... (Completely private)"
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-background focus:outline-none focus:border-primary resize-none"
              />
            </div>
          )}
        </div>
      </section>

      {/* AI Multidimensional Wellbeing & Stress Assessment Bento Card */}
      <section className="bg-gradient-to-r from-primary/10 via-surface-container-lowest to-secondary/10 rounded-3xl p-6 shadow-sm border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5 max-w-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-bold">
              AI Assessment
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant/40 text-on-surface-variant font-medium">
              Experimental • student-stress-v2-clean
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant ml-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  aiStatus === 'ONLINE'
                    ? 'bg-emerald-500 animate-pulse'
                    : aiStatus === 'OFFLINE'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              <span>{aiStatus === 'ONLINE' ? 'Online' : aiStatus === 'OFFLINE' ? 'Offline' : 'Checking'}</span>
            </span>
          </div>
          <h3 className="font-headline font-bold text-base text-on-background">
            Comprehensive 19-Feature Wellbeing Check
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Explore a multidimensional evaluation of academic workload, physical rest, social factors, and living equilibrium with our scientifically hardened, non-clinical AI model.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('assessment')}
          className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <span>Start Assessment</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </section>

      {/* Your Wellbeing Journey (Non-Clinical Personal Trends) */}
      <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-headline font-bold text-base text-on-background">
              Your Wellbeing Journey 📊
            </h3>
            <span className="text-xs text-on-surface-variant">
              Personal trends & equilibrium — visible only to you
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('twin')}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Explore Twin →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
            <span className="text-[11px] text-on-surface-variant font-medium">Mood Rhythm</span>
            <span className="text-sm font-bold text-on-background flex items-center gap-1.5">
              <span>{moodScore ? (moodScore >= 4 ? 'Positive' : moodScore === 3 ? 'Steady' : 'Tender') : 'Consistent'}</span>
              <span className="text-xs text-primary">🌿</span>
            </span>
            <span className="text-[10px] text-on-surface-variant/80">Natural weekly baseline</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
            <span className="text-[11px] text-on-surface-variant font-medium">Energy Pattern</span>
            <span className="text-sm font-bold text-on-background flex items-center gap-1.5">
              <span>{energyLevel}</span>
              <span className="text-xs text-secondary">⚡</span>
            </span>
            <span className="text-[10px] text-on-surface-variant/80">Daily vitality rhythm</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
            <span className="text-[11px] text-on-surface-variant font-medium">Stress Equilibrium</span>
            <span className="text-sm font-bold text-on-background flex items-center gap-1.5">
              <span>{stressLevel}</span>
              <span className="text-xs text-tertiary">⚖️</span>
            </span>
            <span className="text-[10px] text-on-surface-variant/80">Workload balance</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
            <span className="text-[11px] text-on-surface-variant font-medium">Sleep Consistency</span>
            <span className="text-sm font-bold text-on-background flex items-center gap-1.5">
              <span>{sleepQuality}</span>
              <span className="text-xs text-primary">🌙</span>
            </span>
            <span className="text-[10px] text-on-surface-variant/80">Restorative recovery</span>
          </div>
        </div>
      </section>

      {/* Nivara Personal Context Suggestion */}
      <section className="p-5 rounded-3xl bg-surface-container-low border border-primary/25 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-fixed/40 flex items-center justify-center text-xl shrink-0">
            💬
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-on-background">
              Nivara Suggestion
            </span>
            <span className="text-xs text-on-surface-variant leading-relaxed">
              {stressLevel === 'High'
                ? "You mentioned higher stress today. Would you like to take a 2-minute breath pause or talk through what's pressing?"
                : "Your space is calm and ready. Reach out to Nivara anytime you'd like a gentle sounding board."}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('talk')}
            className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
          >
            Talk to Nivara
          </button>
          <button
            onClick={onOpenBreathing}
            className="px-3.5 py-2 rounded-full bg-surface-container hover:bg-surface-variant text-xs font-semibold text-on-surface transition-colors"
          >
            2-Min Reset
          </button>
        </div>
      </section>

      {/* Action Cards (Talk & Reset) */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-8 bg-surface-container-lowest rounded-3xl p-7 shadow-sm border border-surface-variant/50 relative overflow-hidden flex flex-col justify-between min-h-[200px]">
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
        <div className="md:col-span-4 bg-surface-container-lowest rounded-3xl p-7 shadow-sm border border-surface-variant/50 flex flex-col justify-between min-h-[200px]">
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
    </div>
  );
};
