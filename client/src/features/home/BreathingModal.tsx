import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BreathingModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [count, setCount] = useState(4);
  const [cycle, setCycle] = useState(1);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev > 1) return prev - 1;
        if (phase === 'Inhale') {
          setPhase('Hold');
          return 4;
        } else if (phase === 'Hold') {
          setPhase('Exhale');
          return 6;
        } else {
          setPhase('Inhale');
          setCycle((c) => c + 1);
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, phase]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest max-w-sm w-full rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 text-center border border-primary-fixed">
        <div className="flex justify-between w-full items-center">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">2-Minute Reset</span>
          <button onClick={onClose} className="text-on-surface-variant text-sm font-semibold">Done</button>
        </div>

        {/* Breathing Animation Orb */}
        <div className="relative w-48 h-48 flex items-center justify-center my-4">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-tr from-primary-fixed-dim/40 to-secondary-fixed/40 blur-xl transition-all duration-1000 ${
              phase === 'Inhale' ? 'scale-125 opacity-90' : phase === 'Hold' ? 'scale-120 opacity-100' : 'scale-90 opacity-60'
            }`}
          />
          <div
            className={`w-36 h-36 rounded-full bg-primary flex flex-col items-center justify-center text-on-primary shadow-lg transition-transform duration-1000 ${
              phase === 'Inhale' ? 'scale-110' : phase === 'Hold' ? 'scale-105' : 'scale-95'
            }`}
          >
            <span className="text-2xl font-bold font-headline">{phase}</span>
            <span className="text-3xl font-extrabold font-mono mt-1">{count}</span>
          </div>
        </div>

        <p className="text-xs text-on-surface-variant max-w-xs">
          Cycle {cycle} of 4 — Relax your jaw, drop your shoulders, and follow the natural rhythm.
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-full bg-surface-container font-semibold text-xs text-on-surface hover:bg-surface-variant transition-colors"
        >
          Finish Reset
        </button>
      </div>
    </div>
  );
};
