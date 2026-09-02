import React from 'react';
import { UserRole } from '../../types/auth';

interface Props {
  role: UserRole;
  title: string;
  emoji: string;
  description: string;
  badge: string;
  onClick: () => void;
}

export const RoleCard: React.FC<Props> = ({
  role,
  title,
  emoji,
  description,
  badge,
  onClick
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-5 rounded-3xl bg-surface-container-lowest hover:bg-surface-container-low border border-surface-variant/70 hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md flex flex-col gap-3 group active:scale-[0.99] relative overflow-hidden"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <span className="text-3xl p-2.5 rounded-2xl bg-surface-container group-hover:scale-110 transition-transform duration-200 shadow-inner">
            {emoji}
          </span>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-base text-on-background group-hover:text-primary transition-colors">
              {title}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/80">
              {badge}
            </span>
          </div>
        </div>

        <span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary transition-all">
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </span>
      </div>

      <p className="text-xs text-on-surface-variant leading-relaxed pl-1">
        {description}
      </p>
    </button>
  );
};
