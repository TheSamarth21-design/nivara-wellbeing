import React from 'react';

interface Props {
  message?: string;
}

export const LoadingScreen: React.FC<Props> = ({ message = 'Opening your quiet space...' }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-fixed/40 rounded-full blur-3xl opacity-70 animate-subtle-float pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-fixed/40 rounded-full blur-3xl opacity-70 animate-subtle-float pointer-events-none" />

      <div className="flex flex-col items-center gap-4 relative z-10 text-center animate-fadeIn">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary-fixed/50 animate-ping opacity-30" />
          <div className="w-16 h-16 rounded-full bg-surface-container-lowest shadow-lg border border-outline-variant/40 flex items-center justify-center text-3xl">
            🌿
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-headline font-bold text-lg text-on-background">Nivara</h2>
          <span className="text-xs text-on-surface-variant font-medium animate-pulse">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};
