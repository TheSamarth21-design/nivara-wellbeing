import React, { useState } from 'react';
import { WELLNESS_EXERCISES, ExerciseItem, ExerciseId } from './wellnessData';
import { ExerciseCard } from './ExerciseCard';
import { BreathingExercise } from './BreathingExercise';
import { RelaxationExercise } from './RelaxationExercise';
import { SelfTalkExercise } from './SelfTalkExercise';
import { GroundingExercise } from './GroundingExercise';
import { CalmingAudio } from './CalmingAudio';
import { WellnessProgress } from './WellnessProgress';
import { RecommendedExercise } from './RecommendedExercise';

interface Props {
  onOpenSOS?: () => void;
}

export const WellnessSection: React.FC<Props> = ({ onOpenSOS }) => {
  const [activeExerciseModal, setActiveExerciseModal] = useState<ExerciseId | null>(null);

  const handleStartExercise = (exercise: ExerciseItem) => {
    setActiveExerciseModal(exercise.id);
  };

  const handleCloseModal = () => {
    setActiveExerciseModal(null);
  };

  return (
    <section className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-surface-variant/50 flex flex-col gap-6 animate-fadeIn">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧘</span>
          <h2 className="font-headline font-bold text-xl sm:text-2xl text-on-background tracking-tight">
            Take a Moment for Yourself
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
          Small moments of calm can make a big difference. Choose an exercise and take care of your mind.
        </p>
      </div>

      {/* 2. Personalized Recommendation Banner */}
      <RecommendedExercise onStartExercise={handleStartExercise} />

      {/* 3. Wellness Exercise Cards (Horizontally scrollable on mobile, responsive grid on desktop) */}
      <div className="flex overflow-x-auto gap-4 pb-3 pt-1 -mx-2 px-2 scrollbar-none sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:overflow-x-visible">
        {WELLNESS_EXERCISES.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onStart={handleStartExercise}
          />
        ))}
      </div>

      {/* 4. Local Wellness Moments / Streak Tracker */}
      <WellnessProgress />

      {/* 5. SOS Safety Integration at Bottom */}
      {onOpenSOS && (
        <div className="pt-2 border-t border-surface-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="text-base">🛡️</span>
            <span>Need immediate support or feeling in crisis?</span>
          </div>

          <button
            type="button"
            onClick={onOpenSOS}
            className="px-4 py-2 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 font-bold border border-rose-500/30 flex items-center gap-1.5 transition-colors active:scale-95 text-xs shrink-0"
          >
            <span>🚨</span>
            <span>Emergency Support</span>
          </button>
        </div>
      )}

      {/* Interactive Modals */}
      <BreathingExercise
        isOpen={activeExerciseModal === 'breathing'}
        onClose={handleCloseModal}
      />

      <RelaxationExercise
        isOpen={activeExerciseModal === 'relaxation'}
        onClose={handleCloseModal}
      />

      <SelfTalkExercise
        isOpen={activeExerciseModal === 'self_talk'}
        onClose={handleCloseModal}
      />

      <GroundingExercise
        isOpen={activeExerciseModal === 'grounding'}
        onClose={handleCloseModal}
      />

      <CalmingAudio
        isOpen={activeExerciseModal === 'audio'}
        onClose={handleCloseModal}
      />
    </section>
  );
};
