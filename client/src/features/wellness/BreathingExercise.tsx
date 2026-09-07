import React, { useState, useEffect, useRef } from 'react';
import { recordWellnessCompletion } from './wellnessData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  totalCycles?: number;
}

type BreathingPhase = 'in' | 'hold' | 'out' | 'rest';

const PHASE_DURATIONS: Record<BreathingPhase, number> = {
  in: 4,
  hold: 4,
  out: 6,
  rest: 2
};

const PHASE_TEXT: Record<BreathingPhase, { title: string; hint: string }> = {
  in: { title: 'Breathe In', hint: 'Fill your lower lungs with smooth, cool air' },
  hold: { title: 'Hold', hint: 'Gently suspend your breath, relaxing your shoulders' },
  out: { title: 'Breathe Out', hint: 'Slowly let the warm air flow out through your lips' },
  rest: { title: 'Rest', hint: 'Allow your natural stillness to settle' }
};

export const BreathingExercise: React.FC<Props> = ({
  isOpen,
  onClose,
  totalCycles = 5
}) => {
  const [phase, setPhase] = useState<BreathingPhase>('in');
  const [secondsLeft, setSecondsLeft] = useState<number>(PHASE_DURATIONS.in);
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Timer interval reference
  const intervalRef = useRef<any>(null);

  // Reset exercise state
  const resetExercise = () => {
    setPhase('in');
    setSecondsLeft(PHASE_DURATIONS.in);
    setCurrentCycle(1);
    setIsPaused(false);
    setIsCompleted(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetExercise();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isPaused || isCompleted) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Transition to next phase
        if (phase === 'in') {
          setPhase('hold');
          return PHASE_DURATIONS.hold;
        } else if (phase === 'hold') {
          setPhase('out');
          return PHASE_DURATIONS.out;
        } else if (phase === 'out') {
          setPhase('rest');
          return PHASE_DURATIONS.rest;
        } else {
          // 'rest' phase ended -> next cycle or complete
          if (currentCycle >= totalCycles) {
            setIsCompleted(true);
            recordWellnessCompletion('breathing', 3);
            return 0;
          } else {
            setCurrentCycle((c) => c + 1);
            setPhase('in');
            return PHASE_DURATIONS.in;
          }
        }
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, isPaused, isCompleted, phase, currentCycle, totalCycles]);

  if (!isOpen) return null;

  // Determine scale and color based on phase
  const getCircleScaleClass = () => {
    switch (phase) {
      case 'in':
        return 'scale-125 transition-transform duration-[4000ms] ease-out';
      case 'hold':
        return 'scale-125 transition-none';
      case 'out':
        return 'scale-90 transition-transform duration-[6000ms] ease-in-out';
      case 'rest':
        return 'scale-90 transition-none';
      default:
        return 'scale-100';
    }
  };

  const getGlowColorClass = () => {
    switch (phase) {
      case 'in':
        return 'shadow-[0_0_80px_rgba(56,189,248,0.45)] border-sky-400 bg-sky-500/20';
      case 'hold':
        return 'shadow-[0_0_90px_rgba(129,140,248,0.5)] border-indigo-400 bg-indigo-500/25';
      case 'out':
        return 'shadow-[0_0_60px_rgba(45,212,191,0.35)] border-teal-400 bg-teal-500/20';
      case 'rest':
        return 'shadow-[0_0_40px_rgba(168,85,247,0.25)] border-purple-300 bg-purple-500/15';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-surface-container-lowest border border-surface-variant/70 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-between min-h-[540px] overflow-hidden">
        {/* Soft Background Tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-surface-container-low/40 pointer-events-none" />

        {/* Top Bar */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center text-base font-bold">
              🌬️
            </span>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sm text-on-background">
                Guided Breathing
              </span>
              {!isCompleted && (
                <span className="text-[11px] text-on-surface-variant">
                  Cycle {currentCycle} of {totalCycles}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-variant text-on-surface-variant flex items-center justify-center transition-colors"
            title="End Exercise"
          >
            ✕
          </button>
        </div>

        {/* Main Content Area */}
        {isCompleted ? (
          <div className="z-10 flex flex-col items-center text-center gap-4 my-auto animate-fadeIn max-w-sm">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-4xl shadow-inner animate-bounce">
              ✨
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-bold text-2xl text-on-background">
                Great job!
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Taking a few minutes to breathe can help you feel more calm and present. Your nervous system thanks you.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-4 w-full justify-center">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-sm"
              >
                Done
              </button>
              <button
                type="button"
                onClick={resetExercise}
                className="px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold transition-all border border-outline-variant/50"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="z-10 flex flex-col items-center justify-center gap-6 my-auto">
            {/* Animated Synchronized Breathing Circle */}
            <div className="relative flex items-center justify-center w-64 h-64">
              {/* Outer Pulsing Aura */}
              <div
                className={`absolute w-48 h-48 rounded-full border-2 ${getCircleScaleClass()} ${getGlowColorClass()} flex items-center justify-center`}
              />

              {/* Inner Circle with Countdown */}
              <div className="relative z-10 w-36 h-36 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant/40 flex flex-col items-center justify-center gap-0.5 shadow-md">
                <span className="font-headline font-black text-4xl sm:text-5xl text-on-background tracking-tighter">
                  {secondsLeft}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                  Seconds
                </span>
              </div>
            </div>

            {/* Instruction and Guidance Subtitle */}
            <div className="flex flex-col items-center text-center gap-1 min-h-[50px]">
              <h4 className="font-headline font-bold text-xl text-on-background tracking-tight">
                {PHASE_TEXT[phase].title}
              </h4>
              <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                {PHASE_TEXT[phase].hint}
              </p>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        {!isCompleted && (
          <div className="w-full flex items-center justify-center gap-3 pt-4 border-t border-surface-variant/40 z-10">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="px-5 py-2 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-all border border-outline-variant/40"
            >
              <span className="material-symbols-outlined text-sm">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              type="button"
              onClick={resetExercise}
              className="px-4 py-2 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Restart Exercise"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Restart</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:text-error transition-colors"
            >
              End Exercise
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
