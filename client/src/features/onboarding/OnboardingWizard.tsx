import React, { useState } from 'react';
import { ApiClient } from '../../lib/apiClient';

interface Props {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Section A: Communication Preferences
  const [communicationStyle, setCommunicationStyle] = useState<'friendly' | 'calm' | 'direct' | 'motivational'>('calm');
  const [supportStyle, setSupportStyle] = useState<'short' | 'balanced' | 'detailed'>('balanced');
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  // Section B: Student Life Context
  const [situation, setSituation] = useState<string>('Preparing for exams');

  // Section C: Support Preferences (Multi-select chips)
  const [supportMethods, setSupportMethods] = useState<string[]>([
    'Practical solutions',
    'Breaking problems into smaller steps'
  ]);

  // Section D: General Wellbeing Areas (Multi-select chips)
  const [wellbeingAreas, setWellbeingAreas] = useState<string[]>([
    'Stress management',
    'Exam pressure'
  ]);

  // Section E: Sleep & Focus
  const [typicalSleepHours, setTypicalSleepHours] = useState<string>('6-7 hrs');
  const [studyPattern, setStudyPattern] = useState<string>('Evening');

  const toggleMethod = (item: string) => {
    setSupportMethods((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleArea = (item: string) => {
    if (item === 'Prefer not to answer') {
      setWellbeingAreas(['Prefer not to answer']);
      return;
    }
    setWellbeingAreas((prev) => {
      const filtered = prev.filter((i) => i !== 'Prefer not to answer');
      return filtered.includes(item) ? filtered.filter((i) => i !== item) : [...filtered, item];
    });
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Submit enhanced wellbeing profile
      await ApiClient.updateWellbeingProfile({
        preferences: {
          communicationStyle,
          preferredLanguage: language,
          supportStyle
        },
        routine: {
          typicalSleepHours,
          studyPattern,
          dailyRoutine: 'Flexible'
        },
        wellbeingPreferences: {
          mainConcerns: wellbeingAreas,
          preferredSupportMethods: supportMethods
        },
        baseline: {
          initialMoodRange: 'Good',
          stressPattern: situation,
          energyPattern: 'Normal'
        },
        currentContext: {
          situation
        },
        onboardingCompleted: true
      });

      // 2. Also mirror to legacy onboarding endpoint so all downstream views stay synchronized
      await ApiClient.submitOnboarding({
        aboutYou: { preferredName: 'Friend', ageRange: '20-22', educationLevel: 'Undergraduate', yearOfStudy: '3rd Year', department: 'General' },
        academicContext: { workload: 'Moderate', upcomingEvent: situation, pressure: 'A little stressful' },
        routine: { sleepDuration: typicalSleepHours, routineStructure: 'Somewhat structured', studyPattern },
        stressors: { selectedTags: wellbeingAreas },
        socialConnection: { connectionLevel: 'Mostly connected', primaryTurnTo: 'Friend' },
        supportPreferences: { supportTypes: supportMethods, responsePreference: supportStyle },
        personalization: { primaryGoal: wellbeingAreas[0] || 'Understand my wellbeing', language, communicationStyle, supportStyle }
      });

      onComplete();
    } catch (err) {
      console.error('Onboarding submission error:', err);
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-xl w-full bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xl border border-surface-variant/60 flex flex-col gap-6 animate-fadeIn">
        {/* Progress & Skip Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              Step {step} of 5 — Personalization
            </span>
            <span className="text-xs text-on-surface-variant">Non-clinical & completely optional</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step ? 'w-6 bg-primary' : s < step ? 'w-3 bg-primary-fixed-dim' : 'w-2 bg-surface-variant'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="text-xs text-on-surface-variant hover:text-primary font-semibold transition-colors ml-2"
              title="Skip setup and go directly to dashboard"
            >
              Skip setup
            </button>
          </div>
        </div>

        {/* STEP 1: Communication Preferences */}
        {step === 1 && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col gap-1">
              <h2 className="font-headline font-bold text-xl text-on-background">
                How would you like Nivara to talk with you?
              </h2>
              <p className="text-xs text-on-surface-variant">
                Let’s help Nivara understand what style feels most natural and supportive for you.
              </p>
            </div>

            {/* Communication Style Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'calm', icon: '🌿', title: 'Calm & Supportive', desc: 'Grounding, reassuring, gentle breathing pauses.' },
                { id: 'friendly', icon: '😊', title: 'Friendly & Casual', desc: 'Warm, relatable, peer-like, easy conversation.' },
                { id: 'direct', icon: '🎯', title: 'Direct & Practical', desc: 'Concise steps, clear action items, no fluff.' },
                { id: 'motivational', icon: '🚀', title: 'Motivational', desc: 'Uplifting, empowering, focused on your strengths.' }
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setCommunicationStyle(style.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                    communicationStyle === style.id
                      ? 'bg-primary/10 border-primary ring-2 ring-primary/30 shadow-sm'
                      : 'bg-surface-container-low border-outline-variant/40 hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{style.icon}</span>
                    <span className="text-xs font-bold text-on-background">{style.title}</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant leading-tight">{style.desc}</span>
                </button>
              ))}
            </div>

            {/* Detail Preference */}
            <div className="flex flex-col gap-2 pt-2 border-t border-surface-variant/40">
              <span className="text-xs font-bold text-on-background">How detailed do you prefer responses?</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'short', label: 'Short & simple' },
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'detailed', label: 'Detailed' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSupportStyle(item.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      supportStyle === item.id
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant/40 text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Preference */}
            <div className="flex flex-col gap-2 pt-2 border-t border-surface-variant/40">
              <span className="text-xs font-bold text-on-background">Which language do you prefer?</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'en', label: '🇬🇧 English' },
                  { id: 'hi', label: '🇮🇳 Hindi (हिन्दी)' },
                  { id: 'mr', label: '🚩 Marathi (मराठी)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLanguage(item.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      language === item.id
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant/40 text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Student Life Context */}
        {step === 2 && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col gap-1">
              <h2 className="font-headline font-bold text-xl text-on-background">
                What best describes your current situation?
              </h2>
              <p className="text-xs text-on-surface-variant">
                This helps Nivara offer context-aware support without guessing your routine.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { id: 'Managing regular classes', icon: '📚', label: 'Managing regular classes & assignments' },
                { id: 'Preparing for exams', icon: '📝', label: 'Preparing for upcoming exams / submissions' },
                { id: 'Adjusting to college life', icon: '🏫', label: 'Adjusting to hostel or campus life' },
                { id: 'Managing a heavy workload', icon: '⏳', label: 'Managing a heavy or congested workload' },
                { id: 'Balancing studies & responsibilities', icon: '⚖️', label: 'Balancing studies and personal responsibilities' },
                { id: 'Something else', icon: '✨', label: 'Something else' },
                { id: 'Prefer not to say', icon: '🔒', label: 'Prefer not to say' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSituation(item.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    situation === item.id
                      ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-sm'
                      : 'bg-surface-container-low border-outline-variant/40 hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-xs font-semibold text-on-background">{item.label}</span>
                  </div>
                  {situation === item.id && (
                    <span className="material-symbols-outlined text-primary text-sm font-bold">
                      check_circle
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Support Preferences */}
        {step === 3 && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col gap-1">
              <h2 className="font-headline font-bold text-xl text-on-background">
                When you're feeling stressed, what usually helps?
              </h2>
              <p className="text-xs text-on-surface-variant">
                Select any methods that tend to lighten your mind (multiple choices welcome).
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {[
                { id: 'Talking things through', icon: '💬' },
                { id: 'Practical solutions', icon: '💡' },
                { id: 'Breaking problems into smaller steps', icon: '🧩' },
                { id: 'Relaxation or breathing exercises', icon: '🫁' },
                { id: 'Motivation and encouragement', icon: '🌟' },
                { id: 'Time alone to think', icon: '🧘' },
                { id: 'Talking to someone I trust', icon: '🤝' },
                { id: 'Something else', icon: '🔍' }
              ].map((item) => {
                const isSelected = supportMethods.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleMethod(item.id)}
                    className={`px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-sm ring-2 ring-primary/20'
                        : 'bg-surface-container-low border-outline-variant/40 text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: General Wellbeing Areas */}
        {step === 4 && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col gap-1">
              <h2 className="font-headline font-bold text-xl text-on-background">
                Which areas would you like Nivara to help with?
              </h2>
              <p className="text-xs text-on-surface-variant">
                Non-clinical topics. Select as many as you’d like.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'Stress management', icon: '🛡️' },
                { id: 'Exam pressure', icon: '📖' },
                { id: 'Feeling overwhelmed', icon: '🌊' },
                { id: 'Sleep and routine', icon: '🌙' },
                { id: 'Loneliness', icon: '🍂' },
                { id: 'Motivation', icon: '⚡' },
                { id: 'Peer pressure', icon: '👥' },
                { id: 'Relationships', icon: '💛' },
                { id: 'Career concerns', icon: '🧭' },
                { id: 'Time management', icon: '⏰' },
                { id: 'Emotional wellbeing', icon: '🌿' },
                { id: 'Prefer not to answer', icon: '🔒' }
              ].map((item) => {
                const isSelected = wellbeingAreas.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleArea(item.id)}
                    className={`px-3.5 py-2.5 rounded-2xl border text-xs font-semibold transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-sm ring-2 ring-primary/20'
                        : 'bg-surface-container-low border-outline-variant/40 text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Routine & Sleep Baseline */}
        {step === 5 && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col gap-1">
              <h2 className="font-headline font-bold text-xl text-on-background">
                A quick baseline for your sleep & focus
              </h2>
              <p className="text-xs text-on-surface-variant">
                Helps your Digital Twin understand restorative recovery patterns.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-on-background">Typical sleep duration:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['< 5 hrs', '5-6 hrs', '6-7 hrs', '8+ hrs'].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setTypicalSleepHours(dur)}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                      typicalSleepHours === dur
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant/40 text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-3 border-t border-surface-variant/40">
              <span className="text-xs font-bold text-on-background">When do you naturally focus best?</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'Early morning', icon: '🌅' },
                  { id: 'Afternoon', icon: '☀️' },
                  { id: 'Evening', icon: '🌆' },
                  { id: 'Night owl', icon: '🌙' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStudyPattern(item.id)}
                    className={`py-3 px-2 rounded-2xl border text-xs font-semibold text-center transition-all flex flex-col items-center gap-1 ${
                      studyPattern === item.id
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant/40 text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-primary/20 flex items-center gap-3 mt-2">
              <span className="text-2xl">🌿</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-background">Your space is ready</span>
                <span className="text-[11px] text-on-surface-variant">
                  You can change these preferences at any time from your Privacy & Settings center.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-variant/60">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-2.5 rounded-full border border-outline-variant/60 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1"
            >
              <span>Continue</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors shadow-md flex items-center gap-1 disabled:opacity-50"
            >
              <span>{loading ? 'Initializing...' : 'Enter My Wellbeing Space 🌿'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
