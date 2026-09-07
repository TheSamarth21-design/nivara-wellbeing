import React, { useEffect, useState } from 'react';
import { getWellnessProgress, WellnessProgressData } from './wellnessData';

export const WellnessProgress: React.FC = () => {
  const [progress, setProgress] = useState<WellnessProgressData>(getWellnessProgress());

  useEffect(() => {
    // Refresh stats when component mounts or updates
    setProgress(getWellnessProgress());

    // Listen for storage events across tabs or local updates
    const handleStorageChange = () => {
      setProgress(getWellnessProgress());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-surface-container-low/70 border border-surface-variant/50 flex flex-col gap-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🌱</span>
          <h3 className="font-headline font-bold text-sm text-on-background">
            Your Wellness Moments
          </h3>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant px-2.5 py-0.5 rounded-full bg-surface-container border border-outline-variant/30">
          This Week
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Exercises Completed */}
        <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span>🧘</span>
            <span className="text-[11px] font-medium hidden sm:inline">Completed</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-headline font-black text-xl sm:text-2xl text-on-background">
              {progress.exercisesCompleted}
            </span>
            <span className="text-[10px] text-on-surface-variant">sessions</span>
          </div>
        </div>

        {/* Mindful Time */}
        <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span>⏱️</span>
            <span className="text-[11px] font-medium hidden sm:inline">Mindful</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-headline font-black text-xl sm:text-2xl text-primary">
              {progress.minutesMindful}
            </span>
            <span className="text-[10px] text-on-surface-variant">mins</span>
          </div>
        </div>

        {/* Daily Streak */}
        <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span>🔥</span>
            <span className="text-[11px] font-medium hidden sm:inline">Streak</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-headline font-black text-xl sm:text-2xl text-amber-600 dark:text-amber-400">
              {progress.streakDays}
            </span>
            <span className="text-[10px] text-on-surface-variant">days</span>
          </div>
        </div>
      </div>
    </div>
  );
};
