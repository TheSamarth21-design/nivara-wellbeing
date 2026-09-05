import React, { useState, useEffect } from 'react';
import { TwinStatus } from '../../types';
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
  const todayStr = new Date().toISOString().split('T')[0];
  const wellbeingId = ApiClient.getWellbeingId();

  const [aiStatus, setAiStatus] = useState<'ONLINE' | 'OFFLINE' | 'CHECKING'>('CHECKING');
  const [todayRecord, setTodayRecord] = useState<any>(null);

  // Preferred Name inline editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(preferredName || '');

  useEffect(() => {
    AiApiClient.checkHealth()
      .then((st) => setAiStatus(st as any))
      .catch(() => setAiStatus('OFFLINE'));

    try {
      const saved = localStorage.getItem(`nivara_today_record_${wellbeingId}_${todayStr}`);
      if (saved) {
        setTodayRecord(JSON.parse(saved));
      } else {
        setTodayRecord(null);
      }
    } catch {
      setTodayRecord(null);
    }
  }, [wellbeingId, todayStr]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim() && onUpdatePreferredName) {
      onUpdatePreferredName(tempName.trim());
      setIsEditingName(false);
    }
  };

  const isCompletedToday = Boolean(todayRecord);

  // Derived values for 4 overview cards
  const todayMoodValue = todayRecord
    ? todayRecord.formData?.anxiety_level <= 5 && todayRecord.formData?.depression <= 5
      ? t('mood_good', 'Good')
      : todayRecord.formData?.depression >= 15
      ? t('mood_difficult', 'Difficult')
      : t('mood_okay', 'Okay')
    : null;

  const todayStressValue = todayRecord
    ? todayRecord.result?.stress_prediction === 'class_0'
      ? 'Low'
      : todayRecord.result?.stress_prediction === 'class_1'
      ? 'Moderate'
      : todayRecord.result?.stress_prediction === 'class_2'
      ? 'High'
      : todayRecord.result?.stress_level || 'Recorded'
    : null;

  const todaySleepValue =
    todayRecord?.formData?.sleep_quality !== undefined
      ? `${todayRecord.formData.sleep_quality} / 5`
      : null;

  const todayWorkloadValue =
    todayRecord?.formData?.study_load !== undefined
      ? `${todayRecord.formData.study_load} / 5`
      : null;

  const moodOptions = [
    { id: 'good', label: t('mood_good', 'Good'), emoji: '😊' },
    { id: 'okay', label: t('mood_okay', 'Okay'), emoji: '😐' },
    { id: 'not_great', label: t('mood_not_great', 'Not great'), emoji: '😟' },
    { id: 'difficult', label: t('mood_difficult', 'Difficult'), emoji: '😫' }
  ];

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-6 flex flex-col gap-6 animate-fadeIn pb-24">
      {/* 1. Header with STUDENT WELLBEING, Greeting & + New Check-in button */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            {t('student_wellbeing_tag', 'STUDENT WELLBEING')}
          </span>
          <div className="flex items-center gap-2">
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-background">
              {t('good_to_see_you', 'Good to see you')},{' '}
              <span
                className="cursor-pointer hover:underline"
                onClick={() => setIsEditingName(true)}
              >
                {preferredName || 'Madhura'}
              </span>{' '}
              🌿
            </h1>
            <button
              type="button"
              onClick={() => setIsEditingName(!isEditingName)}
              className="text-on-surface-variant/60 hover:text-primary transition-colors p-1"
              title={t('edit_name', 'Edit Name')}
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>

          {isEditingName && (
            <form onSubmit={handleSaveName} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="What should we call you?"
                className="px-3 py-1 rounded-xl bg-surface-container border border-outline-variant/60 text-xs text-on-background focus:outline-none focus:border-primary"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container"
              >
                {t('save_name', 'Save')}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="text-xs text-on-surface-variant hover:text-on-surface"
              >
                Cancel
              </button>
            </form>
          )}

          <p className="text-xs sm:text-sm text-on-surface-variant">
            {t('let_take_moment', "Let's take a moment to understand how you're doing today.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('wellbeing')}
          className="px-5 py-2.5 rounded-full bg-[#006d40] hover:bg-[#005a34] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all self-start sm:self-auto shrink-0 active:scale-98"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>{t('new_checkin_btn', '+ New Check-in')}</span>
        </button>
      </section>

      {/* 2. TODAY: "How are things feeling today?" Mint Card */}
      <section className="bg-[#eef8f2] dark:bg-[#073322]/40 border border-[#cfead8] dark:border-[#0d4f34] rounded-3xl p-6 sm:p-7 relative flex flex-col gap-4 shadow-xs">
        {/* Floating top-right circular emoji badge */}
        <div className="w-8 h-8 rounded-full bg-white dark:bg-surface-container shadow-xs flex items-center justify-center text-sm absolute top-6 right-6 pointer-events-none">
          😊
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1e5837] dark:text-emerald-400">
            TODAY
          </span>
          <h2 className="font-headline font-bold text-base sm:text-lg text-[#0c3920] dark:text-emerald-100">
            {t('how_things_feeling', 'How are things feeling today?')}
          </h2>
        </div>

        {/* 4 Emojis in a row */}
        <div className="flex items-center gap-4 sm:gap-8 pt-1 flex-wrap sm:flex-nowrap">
          {moodOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onNavigateTab('wellbeing')}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-surface-container-lowest shadow-sm border border-black/5 dark:border-white/10 flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-105 group-hover:shadow-md transition-all">
                {opt.emoji}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#0c3920] dark:text-emerald-200 group-hover:text-primary transition-colors">
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('wellbeing')}
          className="text-xs font-bold text-[#1e5837] dark:text-emerald-400 hover:underline flex items-center gap-1 mt-1 w-fit"
        >
          <span>{t('complete_today_checkin', "Complete today's check-in →")}</span>
        </button>
      </section>

      {/* 3. YOUR WELLBEING: "Today's overview" Section with 4 Cards */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant/70">
              {t('your_wellbeing', 'YOUR WELLBEING')}
            </span>
            <h2 className="font-headline font-bold text-xl sm:text-2xl text-on-background">
              {t('todays_overview', "Today's overview")}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('twin')}
            className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            <span>{t('view_history', 'View history →')}</span>
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Mood */}
          <div
            onClick={() => onNavigateTab('wellbeing')}
            className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-variant/40 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                😊
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-4 flex flex-col">
              <span className="text-xs text-on-surface-variant font-medium">
                {t('mood_label', 'Mood')}
              </span>
              <span className="font-headline font-bold text-lg text-on-background mt-0.5 tracking-tight">
                {todayRecord ? todayMoodValue : t('not_recorded', 'Not recorded')}
              </span>
              <span className="text-[11px] text-on-surface-variant/70 mt-1">
                {t('how_feeling_sub', "How you're feeling")}
              </span>
            </div>
          </div>

          {/* Card 2: Stress */}
          <div
            onClick={() => onNavigateTab('wellbeing')}
            className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-variant/40 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                🧠
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-4 flex flex-col">
              <span className="text-xs text-on-surface-variant font-medium">
                {t('stress_label', 'Stress')}
              </span>
              <span className="font-headline font-bold text-lg text-on-background mt-0.5 tracking-tight">
                {todayRecord ? todayStressValue : t('not_recorded', 'Not recorded')}
              </span>
              <span className="text-[11px] text-on-surface-variant/70 mt-1">
                {t('stress_level_sub', 'Current stress level')}
              </span>
            </div>
          </div>

          {/* Card 3: Sleep */}
          <div
            onClick={() => onNavigateTab('wellbeing')}
            className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-variant/40 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                😴
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-4 flex flex-col">
              <span className="text-xs text-on-surface-variant font-medium">
                {t('sleep_label', 'Sleep')}
              </span>
              <span className="font-headline font-bold text-lg text-on-background mt-0.5 tracking-tight">
                {todayRecord ? todaySleepValue : t('not_recorded', 'Not recorded')}
              </span>
              <span className="text-[11px] text-on-surface-variant/70 mt-1">
                {t('sleep_sub', "Last night's sleep")}
              </span>
            </div>
          </div>

          {/* Card 4: Workload */}
          <div
            onClick={() => onNavigateTab('wellbeing')}
            className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-variant/40 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                📚
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-4 flex flex-col">
              <span className="text-xs text-on-surface-variant font-medium">
                {t('workload_label', 'Workload')}
              </span>
              <span className="font-headline font-bold text-lg text-on-background mt-0.5 tracking-tight">
                {todayRecord ? todayWorkloadValue : t('not_recorded', 'Not recorded')}
              </span>
              <span className="text-[11px] text-on-surface-variant/70 mt-1">
                {t('workload_sub', 'Academic workload')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Completed Summary Snapshot banner if user has already checked in */}
      {isCompletedToday && todayRecord && (
        <section className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🌿</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-background">
                {t('today_completed_title', "You've completed today's wellbeing check-in.")}
              </span>
              <span className="text-[11px] text-on-surface-variant">
                Pattern: <strong className="text-primary capitalize">{todayRecord.result?.stress_prediction?.replace('_', ' ') || 'Classified'}</strong> • Confidence: {Math.round((todayRecord.result?.confidence || 0.8) * 100)}%
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('wellbeing')}
            className="text-xs font-bold text-primary hover:underline"
          >
            {t('update_today_responses', 'Update Responses →')}
          </button>
        </section>
      )}

      {/* 5. Your Wellbeing Journey (Digital Twin Snapshot) */}
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
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Digital Twin</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/40 flex flex-col justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Active Baseline Equilibrium</span>
            <div className="flex items-baseline gap-2 my-2">
              <span className="font-headline font-bold text-2xl text-on-background">
                {twinStatus?.baselineMoodAvg ? twinStatus.baselineMoodAvg.toFixed(1) : '3.4'} / 5.0
              </span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                {twinStatus?.currentPatternState || 'Stable'}
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant">Calibrated against your historical reflections</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/40 flex flex-col justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Streak & Reflections</span>
            <div className="flex items-baseline gap-2 my-2">
              <span className="font-headline font-bold text-2xl text-primary">
                {twinStatus?.checkinCount || 14} Days
              </span>
              <span className="text-[10px] text-on-surface-variant">Logged</span>
            </div>
            <span className="text-[11px] text-on-surface-variant">Consistent check-ins improve model calibration</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/40 flex flex-col justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Personalized Insight</span>
            <p className="text-xs text-on-surface leading-relaxed my-2 italic">
              "{twinStatus?.insights?.[0] || 'Restful sleep positively stabilizes your morning study focus.'}"
            </p>
            <span className="text-[10px] text-secondary font-medium">Derived from longitudinal check-ins</span>
          </div>
        </div>
      </section>

      {/* 6. Quick Action Cards (Talk & 2-Minute Reset) */}
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
              onClick={onOpenBreathing}
              className="px-4 py-3 rounded-full bg-surface-container hover:bg-surface-variant text-xs font-semibold text-on-surface transition-colors flex items-center gap-1.5"
            >
              <span>🧘</span>
              <span>{t('two_minute_reset', '2-Minute Reset')}</span>
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
