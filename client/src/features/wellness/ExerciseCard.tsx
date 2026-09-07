import React from 'react';
import { ExerciseItem } from './wellnessData';

interface Props {
  exercise: ExerciseItem;
  onStart: (exercise: ExerciseItem) => void;
}

export const ExerciseCard: React.FC<Props> = ({ exercise, onStart }) => {
  return (
    <div
      onClick={() => onStart(exercise)}
      className="group relative bg-surface-container-lowest hover:bg-surface-container-low/80 border border-surface-variant/60 hover:border-primary/40 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden min-w-[260px] sm:min-w-0"
    >
      {/* Background Soft Subtle Gradient Glow */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${exercise.bgGradient} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`}
      />

      <div className="relative z-10 flex flex-col gap-3">
        {/* Top bar: Icon and Duration */}
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-surface-container-high/80 border border-outline-variant/30 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
            <span>{exercise.emoji}</span>
          </div>

          <span className="text-[11px] font-semibold text-on-surface-variant/90 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/30 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">schedule</span>
            <span>{exercise.duration}</span>
          </span>
        </div>

        {/* Title and description */}
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary/80">
            {exercise.tag}
          </span>
          <h3 className="font-headline font-bold text-base sm:text-lg text-on-background group-hover:text-primary transition-colors tracking-tight">
            {exercise.title}
          </h3>
          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mt-0.5">
            {exercise.subtitle}
          </p>
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="relative z-10 mt-5 pt-3 border-t border-surface-variant/30 flex items-center justify-between">
        <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
          <span>Start Exercise</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </span>

        <span className="w-8 h-8 rounded-full bg-surface-container group-hover:bg-primary group-hover:text-on-primary text-on-surface-variant flex items-center justify-center transition-colors">
          <span className="material-symbols-outlined text-sm">play_arrow</span>
        </span>
      </div>
    </div>
  );
};
