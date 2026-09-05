import React, { useEffect, useState } from 'react';
import { TwinStatus } from '../../types';
import { ApiClient } from '../../lib/apiClient';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  twinStatus: TwinStatus | null;
  onNavigateTab: (tab: string) => void;
}

export const DigitalTwinView: React.FC<Props> = ({ twinStatus, onNavigateTab }) => {
  const { t } = useLanguage();
  const wellbeingId = ApiClient.getWellbeingId();
  const [latestRecord, setLatestRecord] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`nivara_latest_wellbeing_${wellbeingId}`);
      if (saved) {
        setLatestRecord(JSON.parse(saved));
      }
    } catch {
      setLatestRecord(null);
    }
  }, [wellbeingId]);

  // Graceful loading state with shimmering skeleton
  if (!twinStatus && !latestRecord) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-8 flex flex-col gap-6 animate-fadeIn pb-24">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('home')}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-variant"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div className="h-6 w-48 bg-surface-container rounded-xl animate-pulse" />
        </div>
        <div className="p-12 rounded-3xl bg-surface-container-lowest border border-surface-variant/40 flex flex-col items-center justify-center gap-4">
          <div className="w-28 h-28 rounded-full bg-primary/20 animate-pulse flex items-center justify-center text-3xl">
            🌱
          </div>
          <span className="text-xs font-medium text-on-surface-variant animate-pulse">
            Calibrating Your Digital Twin Baseline...
          </span>
        </div>
      </div>
    );
  }

  const checkinCount = typeof twinStatus?.checkinCount === 'number' ? twinStatus.checkinCount : latestRecord ? 1 : 0;
  const isColdStart = checkinCount < 3 && !latestRecord;
  const confidenceLevel = twinStatus?.confidenceLevel || (latestRecord ? 'Calibrated' : 'Initial');
  const currentPatternState = twinStatus?.currentPatternState || (isColdStart ? 'Cold Start' : 'Stable');
  const baselineAvg =
    typeof twinStatus?.baselineMoodAvg === 'number' && !isNaN(twinStatus.baselineMoodAvg)
      ? twinStatus.baselineMoodAvg
      : 3.4;

  const insights =
    Array.isArray(twinStatus?.insights) && twinStatus.insights.length > 0
      ? twinStatus.insights
      : [
          'Your Digital Twin observes daily reflections to surface natural recovery patterns.',
          'Continuous check-ins calibrate your personalized longitudinal baseline against your own rhythms.'
        ];

  const microNudges =
    Array.isArray(twinStatus?.microNudges) && twinStatus.microNudges.length > 0
      ? twinStatus.microNudges
      : [
          'Protect at least 20 minutes of restorative downtime before sleep tonight.',
          'Take a gentle 5-minute outdoor walk between intense focus intervals.'
        ];

  const recentHistory = Array.isArray(twinStatus?.recentHistory) ? twinStatus.recentHistory : [];

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 flex flex-col gap-6 animate-fadeIn pb-24">
      {/* Header Bar with Working Back Button */}
      <div className="flex items-center justify-between border-b border-surface-variant/40 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('home')}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors"
            title={t('back_to_home', 'Back to Home')}
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-bold text-xl sm:text-2xl text-on-background">
                {t('twin_title', 'Your Digital Wellbeing Twin')}
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase tracking-wider">
                {confidenceLevel} {t('twin_confidence', 'Confidence')}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t(
                'twin_sub',
                'Models your personal wellbeing baseline against your own historical reflections over time. Not a medical diagnostic tool.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Pulsing Visual Twin Center Orb */}
      <div className="p-8 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

        {/* Ambient Spherical Visualization */}
        <div className="relative w-44 h-44 flex items-center justify-center my-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/40 to-secondary/30 blur-2xl opacity-70 animate-pulse-slow" />
          <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-primary to-primary-container text-on-primary flex flex-col items-center justify-center shadow-xl z-10 border-4 border-surface-container-lowest">
            <span className="text-3xl font-headline font-black">
              {isColdStart ? '🌱' : baselineAvg.toFixed(1)}
            </span>
            <span className="text-[11px] uppercase tracking-wider font-semibold opacity-90 mt-0.5">
              {currentPatternState}
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-md flex flex-col gap-1 mt-2">
          <h3 className="font-headline font-bold text-base text-on-background">
            {isColdStart
              ? t('twin_insufficient_data_title', 'Twin is getting to know you')
              : twinStatus?.lastShiftDetected || 'Steady personal equilibrium maintained.'}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isColdStart
              ? t(
                  'twin_insufficient_data_sub',
                  'Complete your daily wellbeing check-ins over time to help build your personal baseline.'
                )
              : `Based on personal reflections compared against your own historical baseline.`}
          </p>
        </div>
      </div>

      {/* Real Real-Time Indicators Connected to My Wellbeing */}
      {latestRecord && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col">
            <span className="text-[11px] font-semibold text-on-surface-variant">
              {t('twin_stress_pattern', 'Stress Equilibrium')}
            </span>
            <span className="text-base font-bold text-primary mt-1 capitalize">
              {latestRecord.result?.stress_prediction?.replace('_', ' ') || 'Classified'}
            </span>
            <span className="text-[10px] text-on-surface-variant mt-0.5">
              {Math.round((latestRecord.result?.confidence || 0.8) * 100)}% calibrated confidence
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col">
            <span className="text-[11px] font-semibold text-on-surface-variant">
              {t('twin_sleep_pattern', 'Rest & Sleep Quality')}
            </span>
            <span className="text-base font-bold text-on-background mt-1">
              {(latestRecord.formData?.sleep_quality ?? 3)} / 5
            </span>
            <span className="text-[10px] text-on-surface-variant mt-0.5">
              {(latestRecord.formData?.sleep_quality ?? 3) >= 4 ? 'Restful' : 'Needs attention'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col">
            <span className="text-[11px] font-semibold text-on-surface-variant">
              {t('twin_study_pressure', 'Academic Load')}
            </span>
            <span className="text-base font-bold text-on-background mt-1">
              {(latestRecord.formData?.study_load ?? 3)} / 5
            </span>
            <span className="text-[10px] text-on-surface-variant mt-0.5">
              {(latestRecord.formData?.study_load ?? 3) >= 4 ? 'High intensity' : 'Manageable'}
            </span>
          </div>
        </div>
      )}

      {/* Longitudinal Insights & Correlations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs">
            <span className="material-symbols-outlined text-lg">insights</span>
            <span>{t('twin_pattern_reflections', 'Pattern Reflections')}</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {insights.map((ins, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-surface-container-low text-xs text-on-surface leading-relaxed flex items-start gap-2"
              >
                <span className="text-sm">🌿</span>
                <span>{ins}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-secondary font-semibold text-xs">
            <span className="material-symbols-outlined text-lg">touch_app</span>
            <span>{t('twin_micro_nudges', 'Micro-Nudges for You')}</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {microNudges.map((nudge, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-surface-container-low text-xs text-on-surface leading-relaxed flex items-start gap-2"
              >
                <span className="text-sm">✨</span>
                <span>{nudge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkin History Sparkline Table */}
      <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col gap-3">
        <h3 className="font-headline font-bold text-sm text-on-background">
          {t('twin_recent_timeline', 'Recent Wellbeing History')}
        </h3>
        {recentHistory.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-container-low text-xs text-on-surface-variant italic text-center">
            {t(
              'twin_insufficient_data_sub',
              'Complete your daily wellbeing check-ins over time to help build your personal baseline.'
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {recentHistory.map((h, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-surface-container-low flex flex-col items-center gap-1 border border-outline-variant/30"
              >
                <span className="text-[10px] text-on-surface-variant font-mono">{h.date}</span>
                <span className="text-xl">
                  {h.moodTier === 'good' ? '🙂' : h.moodTier === 'okay' ? '😐' : h.moodTier === 'not_great' ? '😕' : '😣'}
                </span>
                <span className="text-[10px] font-bold capitalize text-on-surface">
                  {h.moodTier?.replace('_', ' ') || 'Reflected'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
