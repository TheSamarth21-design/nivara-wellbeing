import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  onClick: () => void;
  variant?: 'header' | 'card' | 'floating' | 'default';
  className?: string;
}

export const SOSButton: React.FC<Props> = ({
  onClick,
  variant = 'default',
  className = ''
}) => {
  const { t } = useLanguage();
  const label = t('sos_button_text', 'SOS Support');

  if (variant === 'header') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all active:scale-95 shadow-sm border border-red-500/40 shrink-0 animate-pulse hover:animate-none ${className}`}
        title={t('sos_tooltip', 'Emergency Support (Audio, Video & Direct Counselor Call)')}
        aria-label={label}
      >
        <span className="material-symbols-outlined text-sm font-bold">emergency</span>
        <span className="tracking-wide">{label}</span>
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <div
        onClick={onClick}
        className={`p-4 rounded-3xl bg-gradient-to-r from-red-950/40 via-red-900/25 to-surface-container border border-red-500/30 hover:border-red-500/60 transition-all cursor-pointer shadow-sm flex items-center justify-between gap-4 group ${className}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl font-bold">emergency</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline font-bold text-sm text-on-background">
                {label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 font-bold uppercase">
                24/7 Live
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              {t('sos_card_subtitle', 'Instant counseling, audio/video sessions & emergency contacts.')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shrink-0 shadow-sm transition-all"
        >
          {t('sos_get_help', 'Get Help')}
        </button>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xl border border-red-400/40 transition-all active:scale-95 animate-bounce hover:animate-none ${className}`}
        title={t('sos_tooltip', 'Emergency Support')}
        aria-label={label}
      >
        <span className="material-symbols-outlined text-base">emergency</span>
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 border border-red-500/30 ${className}`}
      title={t('sos_tooltip', 'Emergency Support')}
      aria-label={label}
    >
      <span className="material-symbols-outlined text-base">emergency</span>
      <span>{label}</span>
    </button>
  );
};
