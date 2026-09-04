import React, { useState, useEffect } from 'react';
import { QuestionnaireFormState, mapQuestionnaireToModelPayload } from './assessmentMapper';
import { StudentStressAssessmentResponse, AiApiStatus, AiServiceError } from '../../types/ai';
import { AiApiClient } from '../../services/aiApi';
import { AssessmentResultCard } from './AssessmentResultCard';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  wellbeingId: string;
  onBackToDashboard: () => void;
  onOpenBreathing?: () => void;
}

const TOTAL_SECTIONS = 5;

export const StressAssessmentView: React.FC<Props> = ({
  wellbeingId,
  onBackToDashboard,
  onOpenBreathing
}) => {
  const { t } = useLanguage();
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<QuestionnaireFormState>({
    anxiety_level: 6,
    depression: 5,
    self_esteem: 20,
    mental_health_history: 0,

    study_load: 3,
    academic_performance: 3,
    future_career_concerns: 2,
    teacher_student_relationship: 4,

    sleep_quality: 3,
    headache: 1,
    breathing_problem: 0,

    social_support: 2,
    peer_pressure: 1,
    bullying: 0,
    extracurricular_activities: 2,

    noise_level: 2,
    living_conditions: 4,
    safety: 4,
    basic_needs: 4,

    text_reflection: ''
  });

  const [aiStatus, setAiStatus] = useState<AiApiStatus>('CHECKING');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [assessmentResult, setAssessmentResult] = useState<StudentStressAssessmentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check AI platform connectivity on mount
  useEffect(() => {
    AiApiClient.checkHealth().then((status) => {
      setAiStatus(status);
    });
  }, []);

  const updateField = (field: keyof QuestionnaireFormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleNext = () => {
    if (currentSection < TOTAL_SECTIONS) {
      setCurrentSection((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentSection > 1) {
      setCurrentSection((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate using pure transformation mapper (enforcing exact 19 features without blood_pressure)
    const validation = mapQuestionnaireToModelPayload(formData);
    if (!validation.isValid || !validation.payload) {
      setValidationErrors(validation.errors);
      setErrorMessage('Please ensure all required indicators are completed before submitting.');
      return;
    }

    setLoading(true);
    try {
      const res = await AiApiClient.assessStress(validation.payload);
      setAssessmentResult(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      const aiErr = err as AiServiceError;
      if (aiErr?.category === 'OFFLINE') {
        setErrorMessage(
          'The AI wellbeing service is temporarily unreachable. Your other Nivara features remain available.'
        );
        setAiStatus('OFFLINE');
      } else if (aiErr?.category === 'TIMEOUT') {
        setErrorMessage('The assessment request timed out. Please check your connection and try again.');
      } else {
        setErrorMessage(aiErr?.message || 'An error occurred during assessment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // If result is ready, render the result presentation card
  if (assessmentResult) {
    return (
      <AssessmentResultCard
        result={assessmentResult}
        wellbeingId={wellbeingId}
        studentReflection={formData.text_reflection}
        onRetake={() => {
          setAssessmentResult(null);
          setCurrentSection(1);
        }}
        onBackToDashboard={onBackToDashboard}
        onOpenBreathing={onOpenBreathing}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fadeIn pb-24">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-surface-variant/40 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-variant"
            title="Back to Dashboard"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div>
            <h1 className="font-headline font-bold text-lg text-on-background">
              AI Wellbeing & Stress Assessment
            </h1>
            <p className="text-[11px] text-on-surface-variant">
              Experimental • 19 Indicators • Model student-stress-v2-clean
            </p>
          </div>
        </div>

        {/* AI Connectivity Badge */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              aiStatus === 'ONLINE'
                ? 'bg-emerald-500 animate-pulse'
                : aiStatus === 'OFFLINE'
                ? 'bg-rose-500'
                : 'bg-amber-500'
            }`}
          />
          <span className="text-on-surface-variant font-medium">
            AI: {aiStatus === 'ONLINE' ? 'Online' : aiStatus === 'OFFLINE' ? 'Offline' : 'Connecting'}
          </span>
        </div>
      </div>

      {/* Offline Alert Banner if service is offline */}
      {aiStatus === 'OFFLINE' && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs">
          <span className="material-symbols-outlined text-lg shrink-0">cloud_off</span>
          <div>
            <strong>AI backend is currently offline.</strong> You can explore the questionnaire, but submission requires the FastAPI server at <code className="text-[10px] bg-surface-container px-1 py-0.5 rounded">http://127.0.0.1:8000</code>.
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant">
          <span>
            Section {currentSection} of {TOTAL_SECTIONS}: {
              currentSection === 1 ? 'Emotional Wellbeing' :
              currentSection === 2 ? 'Academic Experience' :
              currentSection === 3 ? 'Physical & Daily Health' :
              currentSection === 4 ? 'Social Environment' :
              'Living Conditions & Reflection'
            }
          </span>
          <span>{Math.round((currentSection / TOTAL_SECTIONS) * 100)}% Completed</span>
        </div>
        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${(currentSection / TOTAL_SECTIONS) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* SECTION 1: EMOTIONAL WELLBEING */}
        {currentSection === 1 && (
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/40 flex flex-col gap-5 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-base text-on-background">
                1. Emotional Wellbeing
              </h2>
              <p className="text-xs text-on-surface-variant">
                Reflect on your mood, emotional steadiness, and self-perspective over recent weeks.
              </p>
            </div>

            {/* Anxiety Level Slider (0-21) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Anxiety & Nervous Tension (0 - 21)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.anxiety_level} / 21
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                How often have you felt restless, keyed up, or constantly on edge?
              </p>
              <input
                type="range"
                min="0"
                max="21"
                step="1"
                value={formData.anxiety_level ?? 0}
                onChange={(e) => updateField('anxiety_level', Number(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Calm & Relaxed</span>
                <span>10: Moderate Tension</span>
                <span>21: Constant / Severe</span>
              </div>
            </div>

            {/* Depression Indicator Slider (0-27) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Low Mood & Energy Drain (0 - 27)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.depression} / 27
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Feeling down, low interest in daily activities, or drained of motivation.
              </p>
              <input
                type="range"
                min="0"
                max="27"
                step="1"
                value={formData.depression ?? 0}
                onChange={(e) => updateField('depression', Number(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Rarely / Never</span>
                <span>14: Occasional</span>
                <span>27: Persistent</span>
              </div>
            </div>

            {/* Self-Esteem Slider (0-30) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Self-Esteem & Self-Regard (0 - 30)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.self_esteem} / 30
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Overall positive feeling about yourself, your capabilities, and worth.
              </p>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={formData.self_esteem ?? 0}
                onChange={(e) => updateField('self_esteem', Number(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Low Confidence</span>
                <span>15: Moderate</span>
                <span>30: Healthy Self-Worth</span>
              </div>
            </div>

            {/* Mental Health History Binary Toggle (0 or 1) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <label className="text-xs font-semibold text-on-background">
                Prior Personal Mental Health History
              </label>
              <p className="text-[11px] text-on-surface-variant">
                Have you previously received or explored professional counseling or support?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => updateField('mental_health_history', 0)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    formData.mental_health_history === 0
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container-low border-outline-variant text-on-surface'
                  }`}
                >
                  No prior history (0)
                </button>
                <button
                  type="button"
                  onClick={() => updateField('mental_health_history', 1)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    formData.mental_health_history === 1
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container-low border-outline-variant text-on-surface'
                  }`}
                >
                  Yes, prior history (1)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: ACADEMIC EXPERIENCE */}
        {currentSection === 2 && (
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/40 flex flex-col gap-5 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-base text-on-background">
                2. Academic Experience
              </h2>
              <p className="text-xs text-on-surface-variant">
                How coursework, deadlines, career questions, and mentorship feel currently.
              </p>
            </div>

            {/* Study Load (0-5) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Study & Coursework Volume (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.study_load} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('study_load', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.study_load === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Very Light</span>
                <span>5: Overwhelming</span>
              </div>
            </div>

            {/* Academic Performance (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Academic Performance & Progress (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.academic_performance} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('academic_performance', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.academic_performance === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Struggling / Lagging</span>
                <span>5: Excellent / Confident</span>
              </div>
            </div>

            {/* Future Career Concerns (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Future Career & Placement Concerns (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.future_career_concerns} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('future_career_concerns', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.future_career_concerns === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Clear & Calm</span>
                <span>5: High Career Anxiety</span>
              </div>
            </div>

            {/* Teacher-Student Relationship (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Faculty & Mentor Rapport (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.teacher_student_relationship} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('teacher_student_relationship', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.teacher_student_relationship === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Distant / Strained</span>
                <span>5: Highly Supportive</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: PHYSICAL & DAILY HEALTH */}
        {currentSection === 3 && (
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/40 flex flex-col gap-5 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-base text-on-background">
                3. Physical and Daily Wellbeing
              </h2>
              <p className="text-xs text-on-surface-variant">
                Physical equilibrium, restfulness, and daily somatic cues.
              </p>
            </div>

            {/* Sleep Quality (0-5) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Sleep Quality & Restfulness (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.sleep_quality} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('sleep_quality', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.sleep_quality === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Insomnia / Disturbed</span>
                <span>5: Deep & Restorative</span>
              </div>
            </div>

            {/* Headache Frequency (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Headache & Physical Tension (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.headache} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('headache', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.headache === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Never / Rare</span>
                <span>5: Frequent / Intense</span>
              </div>
            </div>

            {/* Breathing Problem (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Breathing Irregularity / Tightness (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.breathing_problem} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('breathing_problem', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.breathing_problem === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Clear & Steady</span>
                <span>5: Frequent Tightness</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: SOCIAL ENVIRONMENT */}
        {currentSection === 4 && (
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/40 flex flex-col gap-5 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-base text-on-background">
                4. Social Environment
              </h2>
              <p className="text-xs text-on-surface-variant">
                Peer interactions, social belonging, and extracurricular engagement.
              </p>
            </div>

            {/* Social Support (0-3) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Social & Peer Support Index (0 - 3)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.social_support} / 3
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('social_support', val)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      formData.social_support === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}: {val === 0 ? 'Isolated' : val === 1 ? 'Low' : val === 2 ? 'Moderate' : 'Strong'}
                  </button>
                ))}
              </div>
            </div>

            {/* Peer Pressure (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Peer Pressure & Social Expectations (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.peer_pressure} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('peer_pressure', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.peer_pressure === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: None</span>
                <span>5: Very High</span>
              </div>
            </div>

            {/* Bullying / Hostility (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Unwelcoming Peer Treatment / Bullying (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.bullying} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('bullying', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.bullying === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Never / Safe</span>
                <span>5: Frequent Bullying</span>
              </div>
            </div>

            {/* Extracurricular Activities (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Extracurricular & Creative Outlets (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.extracurricular_activities} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('extracurricular_activities', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.extracurricular_activities === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: None</span>
                <span>5: Very Active</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: LIVING CONDITIONS & REFLECTION */}
        {currentSection === 5 && (
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/40 flex flex-col gap-5 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-base text-on-background">
                5. Living Environment & Personal Reflection
              </h2>
              <p className="text-xs text-on-surface-variant">
                Your living surroundings, basic comforts, safety, and optional thoughts.
              </p>
            </div>

            {/* Noise Level (0-5) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Environmental Noise Level (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.noise_level} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('noise_level', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.noise_level === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Quiet & Peaceful</span>
                <span>5: Loud / Chaotic</span>
              </div>
            </div>

            {/* Living Conditions (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Living Space Quality & Comfort (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.living_conditions} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('living_conditions', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.living_conditions === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Difficult / Inadequate</span>
                <span>5: Highly Comfortable</span>
              </div>
            </div>

            {/* Safety (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Personal Safety Perception (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.safety} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('safety', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.safety === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Unsafe</span>
                <span>5: Very Safe</span>
              </div>
            </div>

            {/* Basic Needs (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Basic Needs & Essentials (Food, Rest, Health) (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.basic_needs} / 5
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('basic_needs', val)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.basic_needs === val
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Severe Shortage</span>
                <span>5: Fully Met</span>
              </div>
            </div>

            {/* Optional Text Reflection (Screened for Crisis Safety) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <label className="text-xs font-semibold text-on-background">
                Personal Written Reflection (Optional)
              </label>
              <p className="text-[11px] text-on-surface-variant">
                Share any thoughts, context, or specific challenges on your mind. This text is checked by our safety protocol to prioritize immediate human support if needed.
              </p>
              <textarea
                rows={3}
                value={formData.text_reflection || ''}
                onChange={(e) => updateField('text_reflection', e.target.value)}
                placeholder="Optional personal reflection..."
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-background focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
        )}

        {/* Validation or API Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-error/10 border border-error/30 text-xs text-error flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Navigation / Submit Controls */}
        <div className="flex items-center justify-between gap-3">
          {currentSection > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={loading}
              className="px-5 py-2.5 rounded-full border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container"
            >
              Previous Section
            </button>
          ) : (
            <div />
          )}

          {currentSection < TOTAL_SECTIONS ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-sm flex items-center gap-1.5"
            >
              <span>Next Section</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
              <span>{loading ? 'Analyzing Wellbeing Responses...' : 'Submit 19-Feature Assessment'}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
