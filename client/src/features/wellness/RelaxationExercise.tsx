import React, { useState, useEffect } from 'react';
import { RELAXATION_STEPS, recordWellnessCompletion } from './wellnessData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RelaxationExercise: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setIsFinished(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = RELAXATION_STEPS[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / RELAXATION_STEPS.length) * 100);

  const handleNext = () => {
    if (currentStepIndex < RELAXATION_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      recordWellnessCompletion('relaxation', 3);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-surface-container-lowest border border-surface-variant/70 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between min-h-[500px] overflow-hidden">
        {/* Soft Background Tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-surface-container-low/40 pointer-events-none" />

        {/* Top Header */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
              🧘
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sm text-on-background">
                Mind Relaxation
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {isFinished ? 'Session Complete' : `Step ${currentStepIndex + 1} of ${RELAXATION_STEPS.length}`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-variant text-on-surface-variant flex items-center justify-center transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Main Content */}
        {isFinished ? (
          <div className="z-10 flex flex-col items-center text-center gap-4 my-auto animate-fadeIn max-w-sm mx-auto">
            <div className="w-20 h-20 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-4xl shadow-inner">
              🌿
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-bold text-2xl text-on-background">
                Rest & Reset Complete
              </h3>
              <p className="text-sm font-medium text-primary italic">
                "Your mind deserves moments of rest."
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                Notice the difference in your breath and the looseness in your shoulders. Carry this calm into whatever comes next.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-sm"
              >
                Done
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold transition-all border border-outline-variant/40"
              >
                Repeat
              </button>
            </div>
          </div>
        ) : (
          <div className="z-10 flex flex-col items-center text-center gap-6 my-auto max-w-md mx-auto">
            {/* Step Icon */}
            <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-5xl shadow-sm animate-fadeIn">
              <span>{currentStep.emoji}</span>
            </div>

            {/* Step Title & Instruction */}
            <div className="flex flex-col gap-2 animate-fadeIn">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Step {currentStep.step}
              </span>
              <h3 className="font-headline font-bold text-2xl text-on-background tracking-tight">
                {currentStep.title}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mt-1 max-w-sm">
                {currentStep.instruction}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs flex flex-col gap-1.5 mt-2">
              <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant font-medium">
                <span>{currentStepIndex + 1} of {RELAXATION_STEPS.length}</span>
                <span>{currentStep.durationHint}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        {!isFinished && (
          <div className="w-full flex items-center justify-between pt-4 border-t border-surface-variant/40 z-10">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 ${
                currentStepIndex === 0
                  ? 'text-on-surface-variant/40 cursor-not-allowed'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>{currentStepIndex === RELAXATION_STEPS.length - 1 ? 'Finish' : 'Next Step'}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
