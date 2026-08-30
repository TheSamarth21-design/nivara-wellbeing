import React from 'react';
import { TwinStatus } from '../../types';

interface Props {
  twinStatus: TwinStatus | null;
  onNavigateTab: (tab: string) => void;
}

export const DigitalTwinView: React.FC<Props> = ({ twinStatus, onNavigateTab }) => {
  if (!twinStatus) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-8 text-center text-xs text-on-surface-variant">
        Loading Twin Baseline...
      </div>
    );
  }

  const isColdStart = twinStatus.currentPatternState === 'Cold Start';

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 flex flex-col gap-6 animate-fadeIn pb-24">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-headline font-bold text-2xl text-on-background">Your Digital Wellbeing Twin</h1>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold uppercase">
            {twinStatus.confidenceLevel} Confidence
          </span>
        </div>
        <p className="text-xs text-on-surface-variant max-w-xl">
          Models your personal baseline against yourself over time. Not a medical diagnostic system.
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
              {isColdStart ? '🌱' : twinStatus.baselineMoodAvg.toFixed(1)}
            </span>
            <span className="text-[11px] uppercase tracking-wider font-semibold opacity-90 mt-0.5">
              {twinStatus.currentPatternState}
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-md flex flex-col gap-1 mt-2">
          <h3 className="font-headline font-bold text-base text-on-background">
            {isColdStart ? 'Twin is getting to know you' : twinStatus.lastShiftDetected}
          </h3>
          <p className="text-xs text-on-surface-variant">
            {isColdStart
              ? 'Complete daily check-ins so your Twin can learn your usual patterns.'
              : `Based on ${twinStatus.checkinCount} personal reflections compared against your own baseline.`}
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
            {twinStatus.insights.map((ins, i) => (
              <div key={i} className="p-3 rounded-2xl bg-surface-container-low text-xs text-on-surface leading-relaxed">
                🌿 {ins}
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
            {twinStatus.microNudges.map((nudge, i) => (
              <div key={i} className="p-3 rounded-2xl bg-surface-container-low text-xs text-on-surface leading-relaxed">
                ✨ {nudge}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkin History Sparkline Table */}
      <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col gap-3">
        <h3 className="font-headline font-bold text-sm text-on-background">Recent Timeline History</h3>
        {twinStatus.recentHistory.length === 0 ? (
          <span className="text-xs text-on-surface-variant italic">No historical check-ins recorded yet.</span>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {twinStatus.recentHistory.map((h, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-surface-container-low flex flex-col items-center gap-1 border border-outline-variant/30">
                <span className="text-[10px] text-on-surface-variant font-mono">{h.date}</span>
                <span className="text-xl">
                  {h.moodTier === 'good' ? '🙂' : h.moodTier === 'okay' ? '😐' : h.moodTier === 'not_great' ? '😕' : '😣'}
                </span>
                <span className="text-[10px] font-bold capitalize text-on-surface">{h.moodTier.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simulator Shortcut CTA */}
      <div className="p-6 rounded-3xl bg-secondary-container/30 border border-secondary-container flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-headline font-bold text-sm text-on-background">Test Future Workload Adjustments</span>
          <span className="text-xs text-on-surface-variant">See how study adjustments affect your recovery margins.</span>
        </div>
        <button
          onClick={() => onNavigateTab('simulator')}
          className="px-5 py-2.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold hover:opacity-90 shadow-sm"
        >
          Open Simulator
        </button>
      </div>
    </div>
  );
};
