import React, { useState } from 'react';
import { ApiClient } from '../../lib/apiClient';

interface Props {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [preferredName, setPreferredName] = useState('');
  const [ageRange, setAgeRange] = useState('20-22');
  const [educationLevel, setEducationLevel] = useState('Undergraduate');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year');
  const [department, setDepartment] = useState('Computer Science & Engineering');

  const [workload, setWorkload] = useState<'Low' | 'Moderate' | 'High' | 'Very high'>('Moderate');
  const [upcomingEvent, setUpcomingEvent] = useState('Exams');
  const [pressure, setPressure] = useState<'Manageable' | 'A little stressful' | 'Quite stressful' | 'Very difficult'>('A little stressful');

  const [sleepDuration, setSleepDuration] = useState('6-7');
  const [routineStructure, setRoutineStructure] = useState('Somewhat structured');
  const [studyPattern, setStudyPattern] = useState('Evening');

  const [selectedStressors, setSelectedStressors] = useState<string[]>(['Academic pressure', 'Exams']);
  const [connectionLevel, setConnectionLevel] = useState('Mostly connected');
  const [primaryTurnTo, setPrimaryTurnTo] = useState('Friend');

  const [supportTypes, setSupportTypes] = useState<string[]>(['Someone listening', 'Quick calming exercises']);
  const [responsePreference, setResponsePreference] = useState('Give practical suggestions');
  const [primaryGoal, setPrimaryGoal] = useState('Handle academic stress');
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  const toggleStressor = (item: string) => {
    setSelectedStressors((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const toggleSupportType = (item: string) => {
    setSupportTypes((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await ApiClient.submitOnboarding({
        aboutYou: { preferredName: preferredName.trim() || 'Friend', ageRange, educationLevel, yearOfStudy, department },
        academicContext: { workload, upcomingEvent, pressure },
        routine: { sleepDuration, routineStructure, studyPattern },
        stressors: { selectedTags: selectedStressors },
        socialConnection: { connectionLevel, primaryTurnTo },
        supportPreferences: { supportTypes, responsePreference },
        personalization: { primaryGoal, language }
      });
      onComplete();
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-xl w-full bg-surface-container-lowest rounded-3xl p-8 shadow-xl border border-surface-variant/60 flex flex-col gap-6">
        {/* Progress Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">
            Step {step} of 7 — Personalization Profile
          </span>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((s) => (
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
              className="text-xs text-on-surface-variant hover:text-primary hover:underline font-medium transition-colors ml-1"
              title="Skip questions and enter dashboard"
            >
              Skip setup
            </button>
          </div>
        </div>

        {/* STEP 1: About You */}
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-xl text-on-background">Let's get to know you 🌿</h2>
              <p className="text-xs text-on-surface-variant">This creates your private profile. No real name required.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface mb-1">Preferred / Display Name</label>
              <input
                type="text"
                placeholder="e.g. Aarav or Alex"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/60 text-sm focus:outline-none focus:border-primary text-on-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-on-surface mb-1">Year of Study</label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background"
                >
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                  <option>Postgraduate / PhD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background"
                >
                  <option>Computer Science & Engineering</option>
                  <option>Electronics & Comm</option>
                  <option>Mechanical Engineering</option>
                  <option>Management / Business</option>
                  <option>Humanities & Sciences</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Academic Context */}
        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-xl text-on-background">Academic Context 📚</h2>
              <p className="text-xs text-on-surface-variant">Helps your Twin correlate stress with workload.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface mb-2">Current Academic Workload</label>
              <div className="grid grid-cols-4 gap-2">
                {(['Low', 'Moderate', 'High', 'Very high'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setWorkload(lvl)}
                    className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      workload === lvl
                        ? 'bg-primary text-on-primary border-primary font-semibold shadow-sm'
                        : 'bg-surface-container-low text-on-surface border-outline-variant/40'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface mb-2">Upcoming Major Event</label>
              <select
                value={upcomingEvent}
                onChange={(e) => setUpcomingEvent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background"
              >
                <option>No major event</option>
                <option>Exams</option>
                <option>Assignments / Submissions</option>
                <option>Project deadline</option>
                <option>Placement / Job Interview</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface mb-2">Academic Pressure Level</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Manageable', 'A little stressful', 'Quite stressful', 'Very difficult'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPressure(p)}
                    className={`py-2.5 px-3 rounded-xl text-xs text-left border transition-all ${
                      pressure === p
                        ? 'bg-secondary text-on-secondary border-secondary font-semibold shadow-sm'
                        : 'bg-surface-container-low text-on-surface border-outline-variant/40'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Routine (Optional) */}
        {step === 3 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-headline font-bold text-xl text-on-background">Daily Routine ⏰</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
                  Optional
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">Skip anything you're not comfortable sharing.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface mb-1">Average Nightly Sleep</label>
              <div className="grid grid-cols-5 gap-1.5">
                {['<5 hrs', '5-6 hrs', '6-7 hrs', '7-8 hrs', '8+ hrs'].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSleepDuration(dur)}
                    className={`py-2 rounded-xl text-xs border transition-all ${
                      sleepDuration === dur ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container-low'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface mb-1">Study Rhythm</label>
              <select
                value={studyPattern}
                onChange={(e) => setStudyPattern(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background"
              >
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
                <option>Late night</option>
                <option>Changes frequently</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 4: Current Stressors */}
        {step === 4 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-xl text-on-background">Current Stressors 🌧️</h2>
              <p className="text-xs text-on-surface-variant">Select whatever applies to you right now.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Academic pressure',
                'Exams',
                'Friend/social issues',
                'Home/family',
                'Financial concerns',
                'Sleep/routine',
                'Future/career',
                'Relationships',
                'College environment',
                'Homesickness',
                'Prefer not to say'
              ].map((item) => {
                const isSelected = selectedStressors.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleStressor(item)}
                    className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold shadow-sm'
                        : 'bg-surface-container-low text-on-surface border-outline-variant/40 hover:bg-surface-container'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {item}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Social Connection */}
        {step === 5 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-xl text-on-background">Social Connection 🤝</h2>
              <p className="text-xs text-on-surface-variant">Understanding your support network.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface mb-2">How connected do you usually feel?</label>
              <div className="grid grid-cols-2 gap-2">
                {['Very connected', 'Mostly connected', 'Sometimes isolated', 'Often isolated'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setConnectionLevel(c)}
                    className={`py-2.5 px-3 rounded-xl text-xs border text-left transition-all ${
                      connectionLevel === c ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container-low'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface mb-2">When things get difficult, who do you turn to?</label>
              <select
                value={primaryTurnTo}
                onChange={(e) => setPrimaryTurnTo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background"
              >
                <option>Friend</option>
                <option>Family</option>
                <option>Teacher / Mentor</option>
                <option>Counsellor</option>
                <option>Partner</option>
                <option>Nobody</option>
                <option>Prefer not to say</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 6: Support Preferences */}
        {step === 6 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-xl text-on-background">Support Preferences 🕊️</h2>
              <p className="text-xs text-on-surface-variant">What kind of support feels comfortable to you?</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Someone listening',
                'Quick calming exercises',
                'Study/academic planning',
                'Peer support',
                'Counsellor support',
                'Career/future planning',
                'Self-guided resources'
              ].map((item) => {
                const isSelected = supportTypes.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleSupportType(item)}
                    className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary font-semibold shadow-sm'
                        : 'bg-surface-container-low text-on-surface border-outline-variant/40'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {item}
                  </button>
                );
              })}
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface mb-1">When having a difficult day, how should Nivara respond?</label>
              <select
                value={responsePreference}
                onChange={(e) => setResponsePreference(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background"
              >
                <option>Keep it simple</option>
                <option>Give practical suggestions</option>
                <option>Let me talk first</option>
                <option>Show support options</option>
                <option>A mix</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 7: Personalization & Language */}
        {step === 7 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-xl text-on-background">Your space is ready 🌿</h2>
              <p className="text-xs text-on-surface-variant">Set your primary focus and language preference.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface mb-1">What would you like Nivara to help you with most?</label>
              <select
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background"
              >
                <option>Understand my wellbeing patterns</option>
                <option>Handle academic stress</option>
                <option>Talk when overwhelmed</option>
                <option>Build better routines</option>
                <option>Find human counsellor support</option>
                <option>Feel less alone</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface mb-1">Language</label>
              <div className="grid grid-cols-3 gap-2">
                {(['en', 'hi', 'mr'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLanguage(l)}
                    className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      language === l ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container-low'
                    }`}
                  >
                    {l === 'en' ? 'English' : l === 'hi' ? 'हिंदी (Hindi)' : 'मराठी (Marathi)'}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-surface-container text-xs text-on-surface-variant leading-relaxed">
              🌿 Your Digital Wellbeing Twin will now model your natural baseline over time without clinical diagnoses or universal judgment.
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-variant/40">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-2.5 rounded-full bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-variant transition-colors"
            >
              ← Back
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            {step < 7 && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              >
                Skip question
              </button>
            )}

            {step < 7 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-sm"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="px-8 py-3 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-md disabled:opacity-50"
              >
                {loading ? 'Entering Space...' : 'Enter My Space 🌿'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
