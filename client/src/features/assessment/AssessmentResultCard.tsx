import React, { useState, useEffect } from 'react';
import { StudentStressAssessmentResponse } from '../../types/ai';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  result: StudentStressAssessmentResponse;
  wellbeingId: string;
  studentReflection?: string;
  onRetake: () => void;
  onBackToDashboard: () => void;
  onOpenBreathing?: () => void;
}

/**
 * Derives the clean user-facing stress category and percentage
 * directly from the AI model response.
 */
export function deriveStressMetrics(result: StudentStressAssessmentResponse): {
  category: 'Low Stress' | 'Moderate Stress' | 'High Stress';
  percentage: number;
} {
  // 1. Determine Category
  let category: 'Low Stress' | 'Moderate Stress' | 'High Stress' = 'Moderate Stress';

  const rawPred = (result.stress_prediction || '').toLowerCase();
  const rawLevel = (result.stress_level || '').toLowerCase();
  const rawSev = (result.tentative_severity || '').toLowerCase();

  if (
    rawPred === 'class_0' ||
    rawPred === 'low' ||
    rawLevel === 'low' ||
    rawLevel.includes('low') ||
    rawSev === 'low'
  ) {
    category = 'Low Stress';
  } else if (
    rawPred === 'class_2' ||
    rawPred === 'high' ||
    rawLevel === 'high' ||
    rawLevel.includes('high') ||
    rawSev === 'high'
  ) {
    category = 'High Stress';
  } else {
    category = 'Moderate Stress';
  }

  // 2. Determine Percentage
  let percentage: number;
  const anyRes = result as any;

  if (typeof anyRes.stress_percentage === 'number' && !isNaN(anyRes.stress_percentage)) {
    percentage = Math.round(Math.max(0, Math.min(100, anyRes.stress_percentage)));
  } else if (typeof anyRes.stress_score === 'number' && !isNaN(anyRes.stress_score)) {
    percentage = anyRes.stress_score <= 1
      ? Math.round(anyRes.stress_score * 100)
      : Math.round(Math.max(0, Math.min(100, anyRes.stress_score)));
  } else if (Array.isArray(anyRes.probabilities) && anyRes.probabilities.length >= 3) {
    const pLow = anyRes.probabilities[0] ?? 0;
    const pMed = anyRes.probabilities[1] ?? 0;
    const pHigh = anyRes.probabilities[2] ?? 0;
    const expected = (pLow * 22) + (pMed * 50) + (pHigh * 82);
    percentage = Math.round(Math.max(5, Math.min(95, expected)));
  } else {
    // Derived from AI model classification and calibrated confidence
    const conf = typeof result.confidence === 'number' && !isNaN(result.confidence)
      ? Math.max(0, Math.min(1, result.confidence))
      : 0.78;

    if (category === 'Low Stress') {
      percentage = Math.round(34 - (conf * 14));
    } else if (category === 'Moderate Stress') {
      percentage = Math.round(44 + ((conf - 0.5) * 20));
    } else {
      percentage = Math.round(68 + (conf * 22));
    }
  }

  percentage = Math.max(1, Math.min(99, percentage));

  return { category, percentage };
}

export const AssessmentResultCard: React.FC<Props> = ({
  result,
  onRetake,
  onBackToDashboard,
  onOpenBreathing
}) => {
  const { t } = useLanguage();
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const isCrisis = result.safety_status === 'crisis_escalated' || result.status === 'crisis_escalated';
  const { category, percentage } = deriveStressMetrics(result);

  // Smooth entry animation for the progress ring
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(percentage);
    }, 150);
    return () => clearTimeout(timer);
  }, [percentage]);

  // 1. IMMEDIATE CRISIS ESCALATION PRIORITY (Safety Guardrail)
  if (isCrisis) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 animate-fadeIn">
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-error flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-error/15 text-error flex items-center justify-center text-3xl">
              <span className="material-symbols-outlined text-4xl">emergency</span>
            </div>
            <div>
              <span className="text-xs font-bold text-error uppercase tracking-wider">
                Immediate Safety Priority
              </span>
              <h2 className="font-headline font-bold text-xl sm:text-2xl text-on-background">
                Support is Available Right Now
              </h2>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-error-container/30 border border-error-container text-xs sm:text-sm text-on-error-container leading-relaxed">
            {result.recommendations?.[0] ||
              'A safety threshold was noted in your reflection. Please connect with immediate support services.'}
          </div>

          {/* Emergency Helplines */}
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-on-background">Tele-MANAS (Govt. of India)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">24/7 TOLL-FREE</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  National Tele-Mental Health Programme
                </p>
                <span className="text-sm font-mono font-bold text-primary mt-1 block">14416 / 1800-891-4416</span>
              </div>
              <a
                href="tel:14416"
                className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:bg-primary-container"
              >
                <span className="material-symbols-outlined text-base">call</span>
                <span>Call 14416</span>
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-on-background">National Emergency Services</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-error/20 text-error font-bold">IMMEDIATE</span>
                </div>
                <span className="text-sm font-mono font-bold text-error mt-1 block">112</span>
              </div>
              <a
                href="tel:112"
                className="px-5 py-2.5 rounded-full bg-error text-on-error text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:opacity-90"
              >
                <span className="material-symbols-outlined text-base">call</span>
                <span>Call 112</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {onOpenBreathing && (
              <button
                type="button"
                onClick={onOpenBreathing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-surface-container border border-outline-variant text-xs font-semibold flex items-center justify-center gap-2 text-on-surface hover:bg-surface-variant"
              >
                <span className="material-symbols-outlined text-base text-primary">air</span>
                <span>Take a Guided Breath</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBackToDashboard}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container"
            >
              Return to Safe Space
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. CLEAN, MINIMAL, CALM WELLBEING RESULT VIEW
  // SVG Progress Ring Geometry
  const size = 220;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  // Visual Theme per Stress Category
  const categoryConfig = {
    'Low Stress': {
      label: t('category_low_stress', 'Low Stress'),
      badgeClass: 'bg-[#e8f8f5] text-[#1c6454] border-[#bfece2] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
      dotClass: 'bg-[#2dd4bf]',
      gradientStart: '#2dd4bf',
      gradientEnd: '#33645c'
    },
    'Moderate Stress': {
      label: t('category_moderate_stress', 'Moderate Stress'),
      badgeClass: 'bg-[#fff9eb] text-[#b45309] border-[#fde68a] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
      dotClass: 'bg-[#f59e0b]',
      gradientStart: '#34d399',
      gradientEnd: '#f59e0b'
    },
    'High Stress': {
      label: t('category_high_stress', 'High Stress'),
      badgeClass: 'bg-[#fff1f2] text-[#be123c] border-[#fecdd3] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
      dotClass: 'bg-[#f43f5e]',
      gradientStart: '#f59e0b',
      gradientEnd: '#f43f5e'
    }
  }[category];

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center animate-fadeIn">
      {/* 1. Page Title */}
      <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-background text-center tracking-tight mb-8">
        {t('stress_result_page_title', 'Your Stress Level')}
      </h1>

      {/* 2. Large Rounded Central Card */}
      <div className="w-full bg-surface-container-lowest dark:bg-surface-container/60 rounded-[32px] sm:rounded-[40px] p-8 sm:p-12 shadow-sm border border-primary/10 dark:border-primary/20 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm">
        {/* Soft Ambient Pastel Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

        {/* 3. Large Visual Stress Indicator (Circular Progress Ring) */}
        <div className="relative flex items-center justify-center my-4">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            <defs>
              <linearGradient id="stressRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={categoryConfig.gradientStart} />
                <stop offset="100%" stopColor={categoryConfig.gradientEnd} />
              </linearGradient>
            </defs>

            {/* Background Track Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-surface-container dark:text-surface-container-high/40"
            />

            {/* Foreground Animated Progress Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#stressRingGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </svg>

          {/* Prominent Stress Percentage in Centre */}
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
            <span className="font-headline font-bold text-5xl sm:text-6xl text-on-background tracking-tight">
              {percentage}%
            </span>
          </div>
        </div>

        {/* 4. Simple Stress Category Badge */}
        <div className="mt-5">
          <div
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border text-xs sm:text-sm font-semibold shadow-xs transition-colors ${categoryConfig.badgeClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${categoryConfig.dotClass} animate-pulse`} />
            <span>{categoryConfig.label}</span>
          </div>
        </div>
      </div>

      {/* 5. Minimal Reassuring Actions */}
      <div className="w-full flex flex-col items-center gap-3 mt-8">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="w-full sm:w-64 py-3.5 rounded-full bg-primary text-on-primary font-semibold text-xs sm:text-sm hover:bg-primary-container shadow-sm transition-all duration-200"
        >
          {t('back_to_dashboard', 'Back to Home')}
        </button>

        <div className="flex items-center gap-4 pt-1">
          {onOpenBreathing && (
            <button
              type="button"
              onClick={onOpenBreathing}
              className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 py-1 px-2"
            >
              <span className="material-symbols-outlined text-base text-primary">air</span>
              <span>{t('mindful_breath', 'Take a mindful breath')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRetake}
            className="text-xs text-on-surface-variant hover:text-on-background transition-colors py-1 px-2"
          >
            {t('retake_assessment', 'Retake check-in')}
          </button>
        </div>
      </div>
    </div>
  );
};
