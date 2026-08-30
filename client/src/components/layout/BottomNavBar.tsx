import React from 'react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  language: string;
}

export const BottomNavBar: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home_health' },
    { id: 'talk', label: 'Talk', icon: 'forum' },
    { id: 'twin', label: 'My Twin', icon: 'bubble_chart' },
    { id: 'simulator', label: 'Simulator', icon: 'alt_route' },
    { id: 'radar', label: 'Campus', icon: 'radar' },
    { id: 'privacy', label: 'Me', icon: 'person' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 dark:bg-surface-container/90 backdrop-blur-md border-t border-surface-variant/50 shadow-lg pb-safe">
      <div className="max-w-[600px] mx-auto flex justify-around items-center px-2 py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary font-semibold scale-105'
                  : 'text-on-surface-variant/70 hover:text-primary hover:bg-surface-variant/40'
              }`}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
              >
                {tab.icon}
              </span>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {isActive && <div className="w-1.5 h-1 bg-primary rounded-full mt-0.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
