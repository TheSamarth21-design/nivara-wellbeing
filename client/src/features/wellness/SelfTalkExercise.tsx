import React, { useState, useEffect } from 'react';
import { SELF_TALK_STATEMENTS, recordWellnessCompletion } from './wellnessData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SelfTalkExercise: React.FC<Props> = ({ isOpen, onClose }) => {
  const [statements, setStatements] = useState<string[]>(SELF_TALK_STATEMENTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [fadeAnim, setFadeAnim] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFinished(false);
      setFadeAnim(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentThought = statements[currentIndex];

  const changeThought = (newIndex: number) => {
    setFadeAnim(false);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setFadeAnim(true);
    }, 150);
  };

  const handleNext = () => {
    if (currentIndex < statements.length - 1) {
      changeThought(currentIndex + 1);
    } else {
      setIsFinished(true);
      recordWellnessCompletion('self_talk', 2);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      changeThought(currentIndex - 1);
    }
  };

  const handleShuffle = () => {
    setFadeAnim(false);
    setTimeout(() => {
      const shuffled = [...statements].sort(() => Math.random() - 0.5);
      setStatements(shuffled);
      setCurrentIndex(0);
      setFadeAnim(true);
    }, 150);
  };

  const handleFinish = () => {
    setIsFinished(true);
    recordWellnessCompletion('self_talk', 2);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-surface-container-lowest border border-surface-variant/70 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between min-h-[480px] overflow-hidden">
        {/* Soft Background Warm Tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-surface-container-low/40 pointer-events-none" />

        {/* Top Header */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
              💭
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sm text-on-background">
                Guided Self-Talk
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {isFinished ? 'Completed' : `Reflection ${currentIndex + 1} of ${statements.length}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isFinished && (
              <button
                type="button"
                onClick={handleShuffle}
                className="p-1.5 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
                title="Shuffle Thoughts"
              >
                <span className="material-symbols-outlined text-sm">shuffle</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-surface-variant text-on-surface-variant flex items-center justify-center transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Thought Card */}
        {isFinished ? (
          <div className="z-10 flex flex-col items-center text-center gap-4 my-auto animate-fadeIn max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl shadow-inner">
              ✨
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-bold text-2xl text-on-background">
                Gentle Mindset Set
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Remember: The words you speak to yourself matter. Carry this gentleness with you today.
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
                onClick={() => {
                  setCurrentIndex(0);
                  setIsFinished(false);
                }}
                className="px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold transition-all border border-outline-variant/40"
              >
                Read Again
              </button>
            </div>
          </div>
        ) : (
          <div className="z-10 flex flex-col items-center text-center gap-6 my-auto px-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl">
              💭
            </div>

            <div
              className={`transition-opacity duration-200 ${
                fadeAnim ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              } flex flex-col gap-3`}
            >
              <p className="font-headline font-semibold text-xl sm:text-2xl text-on-background leading-relaxed tracking-tight">
                "{currentThought}"
              </p>
              <span className="text-[11px] text-on-surface-variant/80">
                Pause for a moment and let this settle gently in your mind.
              </span>
            </div>
          </div>
        )}

        {/* Bottom Actions Bar */}
        {!isFinished && (
          <div className="w-full flex items-center justify-between pt-4 border-t border-surface-variant/40 z-10">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 ${
                currentIndex === 0
                  ? 'text-on-surface-variant/40 cursor-not-allowed'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="hidden sm:inline">Previous Thought</span>
            </button>

            <button
              type="button"
              onClick={handleFinish}
              className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              Finish Exercise
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>{currentIndex === statements.length - 1 ? 'Finish' : 'Next Thought'}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
