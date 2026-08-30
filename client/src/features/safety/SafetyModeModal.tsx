import React from 'react';
import { CrisisResourceItem } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  helplines: CrisisResourceItem[];
}

export const SafetyModeModal: React.FC<Props> = ({ isOpen, onClose, helplines }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-error-container flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-error-container/60 text-error flex items-center justify-center text-2xl">
              <span className="material-symbols-outlined">shield_person</span>
            </div>
            <div>
              <h2 className="font-headline font-bold text-xl text-on-background">Immediate Support 🌿</h2>
              <p className="text-xs text-on-surface-variant">You do not have to walk through this alone.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant">
            ✕
          </button>
        </div>

        <div className="bg-primary-fixed/20 p-4 rounded-2xl border border-primary-fixed text-xs text-primary font-medium">
          If you or someone around you is in immediate danger or feeling unable to cope, please call one of the verified 24/7 toll-free helplines below.
        </div>

        {/* Helplines List */}
        <div className="flex flex-col gap-3">
          {helplines.map((line, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-on-background">{line.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold">24/7 FREE</span>
              </div>
              <p className="text-xs text-on-surface-variant">{line.description}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-mono font-bold text-primary">{line.tollFree}</span>
                <a
                  href={`tel:${line.tollFree.replace(/[^0-9]/g, '')}`}
                  className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 hover:bg-primary-container shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">call</span>
                  <span>Call Now</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Grounding Exercise Option */}
        <div className="p-4 rounded-2xl bg-secondary-container/30 border border-secondary-container flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-semibold text-xs text-on-background">Need a moment to breathe?</span>
            <span className="text-[11px] text-on-surface-variant">Use our guided grounding reset tool.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-secondary text-on-secondary text-xs font-semibold"
          >
            I'm Ready
          </button>
        </div>
      </div>
    </div>
  );
};
