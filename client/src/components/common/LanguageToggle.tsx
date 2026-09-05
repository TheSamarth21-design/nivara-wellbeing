import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Language } from '../../utils/translations';

export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  const langs: { id: Language; label: string }[] = [
    { id: 'en', label: 'EN' },
    { id: 'hi', label: 'हि' },
    { id: 'mr', label: 'म' }
  ];

  return (
    <div className={`inline-flex items-center p-0.5 rounded-full bg-surface-container border border-outline-variant/50 ${className}`}>
      {langs.map((l) => {
        const isActive = language === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => setLanguage(l.id)}
            className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
              isActive
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-background'
            }`}
            title={`Switch to ${l.id.toUpperCase()}`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
};
