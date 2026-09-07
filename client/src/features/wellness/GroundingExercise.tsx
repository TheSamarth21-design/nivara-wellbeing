import React, { useState, useEffect } from 'react';
import { GROUNDING_STEPS, recordWellnessCompletion } from './wellnessData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const GroundingExercise: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [optionalNotes, setOptionalNotes] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setOptionalNotes({});
      setIsFinished(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = GROUNDING_STEPS[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / GROUNDING_STEPS.length) * 100);

  const handleNext = () => {
    if (currentStepIndex < GROUNDING_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      recordWellnessCompletion('grounding', 3);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleNoteChange = (text: string) => {
    setOptionalNotes((prev) => ({
      ...prev,
      [currentStep.step]: text
    }));
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setOptionalNotes({});
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-surface-container-lowest border border-surface-variant/70 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between min-h-[520px] overflow-hidden">
        {/* Soft Background Tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 via-transparent to-surface-container-low/40 pointer-events-none" />

        {/* Top Header */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center text-lg">
              🌿
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sm text-on-background">
                5–4–3–2–1 Grounding
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {isFinished ? 'Exercise Complete' : `Step ${currentStepIndex + 1} of ${GROUNDING_STEPS.length}`}
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
            <div className="w-20 h-20 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center text-4xl shadow-inner">
              🌿
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-bold text-2xl text-on-background">
                Grounding Complete
              </h3>
              <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                You're back in the present moment 🌿
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                Your awareness has returned to your body and your surroundings. You are safe in the here and now.
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
                Start Over
              </button>
            </div>
          </div>
        ) : (
          <div className="z-10 flex flex-col items-center text-center gap-5 my-auto max-w-md mx-auto w-full">
            {/* Step Counter Badge and Emoji */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 flex items-center justify-center text-3xl font-black shadow-xs">
                {currentStep.count}
              </div>
              <span className="text-4xl">{currentStep.emoji}</span>
            </div>

            {/* Instruction */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                {currentStep.count} things you can {currentStep.sense}
              </span>
              <h3 className="font-headline font-bold text-xl sm:text-2xl text-on-background tracking-tight">
                {currentStep.instruction}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
                Examples: {currentStep.examples}
              </p>
            </div>

            {/* Optional Input Box (Non-mandatory) */}
            <div className="w-full max-w-sm flex flex-col gap-1 text-left">
              <label className="text-[10px] text-on-surface-variant font-medium">
                Reflect privately (optional):
              </label>
              <input
                type="text"
                value={optionalNotes[currentStep.step] || ''}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder={currentStep.placeholder}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/50 text-xs text-on-background focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs flex flex-col gap-1 mt-1">
              <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full bg-teal-600 dark:bg-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant font-medium">
                <span>Step {currentStepIndex + 1} of 5</span>
                <span>{5 - currentStepIndex} remaining</span>
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
              <span>{currentStepIndex === GROUNDING_STEPS.length - 1 ? 'Finish' : 'Next Sense'}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
