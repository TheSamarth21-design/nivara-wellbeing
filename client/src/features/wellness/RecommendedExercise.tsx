import React from 'react';
import { WELLNESS_EXERCISES, ExerciseItem } from './wellnessData';

interface Props {
  onStartExercise: (exercise: ExerciseItem) => void;
  contextTag?: string; // Modular hook for future AI-driven recommendations
}

export const RecommendedExercise: React.FC<Props> = ({
  onStartExercise,
  contextTag = 'stress_relief'
}) => {
  // Select default recommendation (Guided Breathing for rapid nervous system calming)
  // Structured so future AI models can dynamically provide recommendation based on sentiment/stress
  const recommendedItem: ExerciseItem =
    WELLNESS_EXERCISES.find((e) => e.id === 'breathing') || WELLNESS_EXERCISES[0];

  return (
    <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-surface-container-low to-surface-container-lowest border border-primary/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden shadow-xs">
      {/* Subtle Glow Aura */}
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-primary/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-start sm:items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest border border-primary/30 flex items-center justify-center text-2xl shadow-xs shrink-0">
          <span>✨</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
              Recommended for You
            </span>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-primary/15 text-primary font-bold">
              Personalized Reset
            </span>
          </div>

          <h4 className="font-headline font-bold text-base text-on-background">
            Feeling tension or study fatigue today?
          </h4>

          <p className="text-xs text-on-surface-variant">
            Recommended: <strong className="text-primary font-semibold">🌬️ 3-Minute Guided Breathing</strong> to restore mental clarity.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onStartExercise(recommendedItem)}
        className="relative z-10 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0 w-full sm:w-auto justify-center"
      >
        <span>Start Now</span>
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </button>
    </div>
  );
};
