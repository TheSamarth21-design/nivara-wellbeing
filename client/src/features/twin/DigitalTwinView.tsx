import React from 'react';
import { TwinStatus } from '../../types';

interface Props {
  twinStatus: TwinStatus | null;
  onNavigateTab: (tab: string) => void;
}

export const DigitalTwinView: React.FC<Props> = ({ twinStatus, onNavigateTab }) => {
  // Graceful loading state with shimmering skeleton
  if (!twinStatus) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-8 flex flex-col gap-6 animate-fadeIn pb-24">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-64 bg-surface-container rounded-xl animate-pulse" />
          <div className="h-4 w-96 bg-surface-container-low rounded-lg animate-pulse" />
        </div>
        <div className="p-12 rounded-3xl bg-surface-container-lowest border border-surface-variant/40 flex flex-col items-center justify-center gap-4">
          <div className="w-32 h-32 rounded-full bg-primary-fixed/30 animate-pulse flex items-center justify-center text-3xl">
            🌱
          </div>
          <span className="text-xs font-medium text-on-surface-variant animate-pulse">
            Calibrating Your Digital Twin Baseline...
          </span>
        </div>
      </div>
    );
  }

  const checkinCount = typeof twinStatus.checkinCount === 'number' ? twinStatus.checkinCount : 0;
  const isColdStart = twinStatus.currentPatternState === 'Cold Start' || checkinCount < 3;
  const confidenceLevel = twinStatus.confidenceLevel || 'Initial';
  const currentPatternState = twinStatus.currentPatternState || (isColdStart ? 'Cold Start' : 'Stable');
  const baselineAvg = typeof twinStatus.baselineMoodAvg === 'number' && !isNaN(twinStatus.baselineMoodAvg)
    ? twinStatus.baselineMoodAvg
    : 3.0;

  const insights = Array.isArray(twinStatus.insights) && twinStatus.insights.length > 0
    ? twinStatus.insights
    : [
        'Your Digital Twin observes daily reflections to surface natural recovery patterns.',
        'Continuous check-ins calibrate your personalized longitudinal baseline against your own rhythms.'
      ];

  const microNudges = Array.isArray(twinStatus.microNudges) && twinStatus.microNudges.length > 0
    ? twinStatus.microNudges
    : [
        'Protect at least 20 minutes of restorative downtime before sleep tonight.',
        'Take a gentle 5-minute outdoor walk between intense focus intervals.'
      ];

  const recentHistory = Array.isArray(twinStatus.recentHistory) ? twinStatus.recentHistory : [];

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 flex flex-col gap-6 animate-fadeIn pb-24">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-headline font-bold text-2xl text-on-background">Your Digital Wellbeing Twin</h1>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold uppercase tracking-wider">
            {confidenceLevel} Confidence
          </span>
        </div>
        <p className="text-xs text-on-surface-variant max-w-xl leading-relaxed">
          Models your personal wellbeing baseline against your own historical reflections over time. Not a medical diagnostic tool.
        </p>
      </div>

      {/* Pulsing Visual Twin Center Orb */}
      <div className="p-8 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-fixed/20 to-transparent pointer-events-none" />

        {/* Ambient Spherical Visualization */}
        <div className="relative w-44 h-44 flex items-center justify-center my-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary-fixed to-secondary-fixed/50 blur-2xl opacity-70 animate-pulse-slow" />
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
            {isColdStart ? 'Twin is getting to know you' : (twinStatus.lastShiftDetected || 'Steady personal equilibrium maintained.')}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isColdStart
              ? 'Complete daily check-ins so your Twin can build your longitudinal baseline.'
              : `Based on ${checkinCount} personal reflections compared against your own historical baseline.`}
          </p>
        </div>
      </div>

      {/* Longitudinal Insights & Correlations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs">
            <span className="material-symbols-outlined text-lg">insights</span>
            <span>Pattern Reflections</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {insights.map((ins, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-surface-container-low text-xs text-on-surface leading-relaxed flex items-start gap-2">
                <span className="text-sm">🌿</span>
                <span>{ins}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-secondary font-semibold text-xs">
            <span className="material-symbols-outlined text-lg">touch_app</span>
            <span>Micro-Nudges for You</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {microNudges.map((nudge, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-surface-container-low text-xs text-on-surface leading-relaxed flex items-start gap-2">
                <span className="text-sm">✨</span>
                <span>{nudge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkin History Sparkline Table */}
      <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col gap-3">
        <h3 className="font-headline font-bold text-sm text-on-background">Recent Timeline History</h3>
        {recentHistory.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-container-low text-xs text-on-surface-variant italic text-center">
            No historical check-ins recorded yet. Tap "Home" to log today's check-in!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {recentHistory.map((h, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-surface-container-low flex flex-col items-center gap-1 border border-outline-variant/30">
                <span className="text-[10px] text-on-surface-variant font-mono">{h.date}</span>
                <span className="text-xl">
                  {h.moodTier === 'good' ? '🙂' : h.moodTier === 'okay' ? '😐' : h.moodTier === 'not_great' ? '😕' : '😣'}
                </span>
                <span className="text-[10px] font-bold capitalize text-on-surface">{h.moodTier?.replace('_', ' ') || 'Reflected'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simulator Shortcut CTA */}
      <div className="p-6 rounded-3xl bg-secondary-container/30 border border-secondary-container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-headline font-bold text-sm text-on-background">Test Future Workload Adjustments</span>
          <span className="text-xs text-on-surface-variant">See how study adjustments affect your recovery margins.</span>
        </div>
        <button
          onClick={() => onNavigateTab('simulator')}
          className="px-5 py-2.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold hover:opacity-90 shadow-sm self-start sm:self-auto"
        >
          Open Simulator
        </button>
      </div>
    </div>
  );
};
