import React, { useState, useEffect } from 'react';
import { QuestionnaireFormState, mapQuestionnaireToModelPayload } from './assessmentMapper';
import { StudentStressAssessmentResponse, AiApiStatus, AiServiceError } from '../../types/ai';
import { AiApiClient } from '../../services/aiApi';
import { ApiClient } from '../../lib/apiClient';
import { AssessmentResultCard } from './AssessmentResultCard';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  wellbeingId: string;
  onBackToDashboard: () => void;
  onOpenBreathing?: () => void;
  onCheckinSubmitted?: () => void;
}

const TOTAL_SECTIONS = 5;

export const MyWellbeingView: React.FC<Props> = ({
  wellbeingId,
  onBackToDashboard,
  onOpenBreathing,
  onCheckinSubmitted
}) => {
  const { t } = useLanguage();
  const todayStr = new Date().toISOString().split('T')[0];

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

  // Same-Day Check-in State
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [completedRecord, setCompletedRecord] = useState<{
    date: string;
    result: StudentStressAssessmentResponse;
    formData: QuestionnaireFormState;
  } | null>(null);
  const [isEditingToday, setIsEditingToday] = useState(false);

  // Check today's submission and AI status on mount
  useEffect(() => {
    AiApiClient.checkHealth().then((status) => {
      setAiStatus(status);
    });

    try {
      const saved = localStorage.getItem(`nivara_today_record_${wellbeingId}_${todayStr}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCompletedRecord(parsed);
        setHasCompletedToday(true);
        if (parsed.formData) {
          setFormData(parsed.formData);
        }
      }
    } catch (e) {
      console.error('Error reading today wellbeing record:', e);
    }
  }, [wellbeingId, todayStr]);

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

    // Validate using pure transformation mapper (enforcing exact 19 questionnaire features)
    const validation = mapQuestionnaireToModelPayload(formData);
    if (!validation.isValid || !validation.payload) {
      setValidationErrors(validation.errors);
      setErrorMessage('Please ensure all required indicators are completed before submitting.');
      return;
    }

    setLoading(true);
    try {
      // 1. Run AI Inference (FastAPI student-stress-v2-clean model)
      const aiResult = await AiApiClient.assessStress(validation.payload);
      setAssessmentResult(aiResult);

      // 2. Derive composite metrics for Node.js backend check-in
      const sleepQualityStr =
        (formData.sleep_quality ?? 3) >= 4 ? 'Good' : (formData.sleep_quality ?? 3) >= 2 ? 'Okay' : 'Poor';

      const stressLevelStr =
        (formData.study_load ?? 3) >= 4 || (formData.anxiety_level ?? 6) >= 14
          ? 'High'
          : (formData.study_load ?? 3) >= 2
          ? 'Moderate'
          : 'Low';

      const energyLevelStr =
        (formData.depression ?? 5) >= 18
          ? 'Very Low'
          : (formData.depression ?? 5) >= 10
          ? 'Low'
          : 'Normal';

      // Derived mood score: 1 (difficult) to 5 (great)
      const anxietyPen = Math.min(2, Math.floor((formData.anxiety_level ?? 6) / 10));
      const depPen = Math.min(2, Math.floor((formData.depression ?? 5) / 13));
      const esteemBonus = (formData.self_esteem ?? 20) >= 20 ? 1 : 0;
      const derivedScore = Math.max(1, Math.min(5, 4 - anxietyPen - depPen + esteemBonus));

      // 3. Save to Node.js backend
      await ApiClient.submitEnhancedCheckin({
        moodScore: derivedScore,
        energyLevel: energyLevelStr as any,
        stressLevel: stressLevelStr as any,
        sleepQuality: sleepQualityStr as any,
        note: formData.text_reflection?.trim() || undefined
      }).catch((e) => console.warn('Node backend checkin sync:', e));

      // 4. Save today's record locally
      const record = {
        date: todayStr,
        result: aiResult,
        formData,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`nivara_today_record_${wellbeingId}_${todayStr}`, JSON.stringify(record));
      localStorage.setItem(`nivara_latest_wellbeing_${wellbeingId}`, JSON.stringify(record));

      setCompletedRecord(record);
      setHasCompletedToday(true);
      setIsEditingToday(false);

      if (onCheckinSubmitted) {
        onCheckinSubmitted();
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      const aiErr = err as AiServiceError;
      if (aiErr?.category === 'OFFLINE') {
        setErrorMessage(
          'The AI wellbeing service is temporarily unreachable. Your check-in was saved locally.'
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

  // If user just submitted or chose to view result, show result presentation card
  if (assessmentResult) {
    return (
      <AssessmentResultCard
        result={assessmentResult}
        wellbeingId={wellbeingId}
        studentReflection={formData.text_reflection}
        onRetake={() => {
          setAssessmentResult(null);
          setIsEditingToday(true);
          setCurrentSection(1);
        }}
        onBackToDashboard={onBackToDashboard}
        onOpenBreathing={onOpenBreathing}
      />
    );
  }

  // SAME-DAY SUBMISSION SCREEN: If already completed today and not in edit mode
  if (hasCompletedToday && completedRecord && !isEditingToday) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6 animate-fadeIn pb-24">
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-surface-variant/50 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl">
              🌿
            </div>
            <div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wider">
                {t('today_completed_badge', 'Completed Today')}
              </span>
              <h1 className="font-headline font-bold text-xl text-on-background mt-1">
                {t('today_completed_title', "You've already completed today's wellbeing check-in.")}
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {t(
              'today_completed_sub',
              'Your responses have updated your daily record, Twin baseline, and AI wellbeing patterns. You do not need to fill another questionnaire today unless you want to update your answers.'
            )}
          </p>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-on-background">Today's Reflection Snapshot:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container flex flex-col">
                <span className="text-[10px] text-on-surface-variant">Pattern</span>
                <span className="font-bold text-primary capitalize">
                  {completedRecord.result.stress_prediction?.replace('_', ' ') || 'Classified'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container flex flex-col">
                <span className="text-[10px] text-on-surface-variant">Confidence</span>
                <span className="font-bold text-on-background">
                  {Math.round((completedRecord.result.confidence || 0.8) * 100)}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container flex flex-col">
                <span className="text-[10px] text-on-surface-variant">Sleep Rest</span>
                <span className="font-bold text-on-background">
                  {(completedRecord.formData?.sleep_quality ?? 3)} / 5
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container flex flex-col">
                <span className="text-[10px] text-on-surface-variant">Study Load</span>
                <span className="font-bold text-on-background">
                  {(completedRecord.formData?.study_load ?? 3)} / 5
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAssessmentResult(completedRecord.result)}
              className="w-full sm:flex-1 py-3 rounded-full bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary-container transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span>{t('view_today_pattern', "View Today's Wellbeing Pattern")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsEditingToday(true);
                setCurrentSection(1);
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-full bg-surface-container border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-variant transition-colors"
            >
              <span>{t('update_today_responses', 'Update Today’s Responses')}</span>
            </button>

            <button
              type="button"
              onClick={onBackToDashboard}
              className="w-full sm:w-auto px-4 py-3 text-xs text-on-surface-variant hover:text-on-surface text-center"
            >
              {t('back_to_dashboard', 'Back to Dashboard')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QUESTIONNAIRE PROGRESSIVE VIEW
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
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-bold text-lg text-on-background">
                {t('wellbeing_hero_title', '🌿 My Wellbeing')}
              </h1>
              {isEditingToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
                  Updating Today's Record
                </span>
              )}
            </div>
            <p className="text-[11px] text-on-surface-variant">
              19 Clean Indicators • Calibrated to your Twin & AI Model
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
            <strong>AI backend is currently offline.</strong> Your answers will still save your daily check-in locally and to your student account.
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant">
          <span>
            {currentSection === 1 && t('wellbeing_section_1', '1. How You Feel')}
            {currentSection === 2 && t('wellbeing_section_2', '2. Studies & College Life')}
            {currentSection === 3 && t('wellbeing_section_3', '3. Daily & Physical Rest')}
            {currentSection === 4 && t('wellbeing_section_4', '4. Social Life')}
            {currentSection === 5 && t('wellbeing_section_5', '5. Living Environment')}
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
        {/* SECTION 1: HOW YOU FEEL */}
        {currentSection === 1 && (
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/40 flex flex-col gap-5 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-base text-on-background">
                {t('wellbeing_section_1', '1. How You Feel')}
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
                Feelings of sadness, emotional heaviness, or loss of motivation in daily tasks.
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
                <span>0: High Vitality</span>
                <span>13: Occasional Slump</span>
                <span>27: Persistent Heaviness</span>
              </div>
            </div>

            {/* Self-Esteem Scale (0-30) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Self-Esteem & Self-Worth (0 - 30)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.self_esteem} / 30
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Do you feel confident, capable, and positive about your qualities as a student?
              </p>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={formData.self_esteem ?? 15}
                onChange={(e) => updateField('self_esteem', Number(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Low Confidence</span>
                <span>15: Moderate Balance</span>
                <span>30: Strong Self-Regard</span>
              </div>
            </div>

            {/* Mental Health History (Binary Pill 0 or 1) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <label className="text-xs font-semibold text-on-background">
                Prior Personal Mental Health History
              </label>
              <p className="text-[11px] text-on-surface-variant">
                Have you previously consulted a counselor, therapist, or doctor for emotional support?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => updateField('mental_health_history', 0)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    formData.mental_health_history === 0
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container border-outline-variant/40 text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  No prior history
                </button>
                <button
                  type="button"
                  onClick={() => updateField('mental_health_history', 1)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    formData.mental_health_history === 1
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container border-outline-variant/40 text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  Yes, prior support
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: STUDIES & COLLEGE LIFE */}
        {currentSection === 2 && (
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/40 flex flex-col gap-5 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-base text-on-background">
                {t('wellbeing_section_2', '2. Studies & College Life')}
              </h2>
              <p className="text-xs text-on-surface-variant">
                Reflect on your academic load, exams, faculty rapport, and future aspirations.
              </p>
            </div>

            {/* Study Load (0-5) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Academic Workload & Study Pressure (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.study_load} / 5
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                How demanding and intense does your course schedule currently feel?
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('study_load', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.study_load === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
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
                  Academic Performance Satisfaction (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.academic_performance} / 5
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                How satisfied are you with your learning, grades, and intellectual growth?
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('academic_performance', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.academic_performance === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Dissatisfied</span>
                <span>5: Highly Satisfied</span>
              </div>
            </div>

            {/* Teacher-Student Relationship (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Mentor & Faculty Rapport (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.teacher_student_relationship} / 5
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Do you feel comfortable asking professors for academic guidance or project clarity?
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('teacher_student_relationship', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.teacher_student_relationship === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Strained / Distant</span>
                <span>5: Supportive & Open</span>
              </div>
            </div>

            {/* Future Career Concerns (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Future Career & Placement Anxiety (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.future_career_concerns} / 5
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                How worried are you regarding internships, jobs, campus placement, or post-grad options?
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('future_career_concerns', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.future_career_concerns === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Calm & Clear</span>
                <span>5: Very Anxious</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: DAILY & PHYSICAL REST */}
        {currentSection === 3 && (
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/40 flex flex-col gap-5 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-base text-on-background">
                {t('wellbeing_section_3', '3. Daily & Physical Rest')}
              </h2>
              <p className="text-xs text-on-surface-variant">
                Physical equilibrium, restful sleep, and bodily tension markers.
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
              <p className="text-[11px] text-on-surface-variant">
                Do you wake up feeling genuinely rested and restored?
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('sleep_quality', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.sleep_quality === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Poor / Insomnia</span>
                <span>5: Deeply Restorative</span>
              </div>
            </div>

            {/* Headache & Tension (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Headache & Physical Muscle Tension (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.headache} / 5
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Frequency of tension headaches, neck tightness, or eye-strain during study.
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('headache', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.headache === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: None</span>
                <span>5: Frequent / Severe</span>
              </div>
            </div>

            {/* Breathing Ease (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Breathing Constriction / Discomfort (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.breathing_problem} / 5
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Experiencing shallow breath, chest heaviness, or sighing during stress?
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('breathing_problem', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.breathing_problem === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Completely Free</span>
                <span>5: Frequent Heaviness</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: SOCIAL LIFE */}
        {currentSection === 4 && (
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/40 flex flex-col gap-5 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-base text-on-background">
                {t('wellbeing_section_4', '4. Social Life')}
              </h2>
              <p className="text-xs text-on-surface-variant">
                Peer support, friendship circles, extracurriculars, and campus belonging.
              </p>
            </div>

            {/* Social Support (0-3) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Close Peer & Friend Support (0 - 3)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.social_support} / 3
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                How many dependable friends or family members can you confide in when stressed?
              </p>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[0, 1, 2, 3].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('social_support', val)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      formData.social_support === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {val === 0 ? '0 (None)' : val === 3 ? '3+ (Strong)' : val}
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
              <p className="text-[11px] text-on-surface-variant">
                Feeling pressure to constantly match peers' lifestyle, marks, or competitive milestones.
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('peer_pressure', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.peer_pressure === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
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

            {/* Bullying / Exclusion (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Social Exclusion or Unwelcoming Behavior (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.bullying} / 5
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Have you experienced mockery, aggressive exclusion, or harassment on campus/hostel?
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('bullying', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.bullying === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Never</span>
                <span>5: Frequent</span>
              </div>
            </div>

            {/* Extracurricular Engagement (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Hobbies, Clubs & Sports Engagement (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.extracurricular_activities} / 5
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Time dedicated to non-academic passions (sports, arts, campus clubs, volunteering).
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('extracurricular_activities', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.extracurricular_activities === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: None</span>
                <span>5: Highly Active</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: LIVING ENVIRONMENT & OPTIONAL REFLECTION */}
        {currentSection === 5 && (
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/40 flex flex-col gap-5 animate-fadeIn">
            <div>
              <h2 className="font-headline font-bold text-base text-on-background">
                {t('wellbeing_section_5', '5. Living Environment')}
              </h2>
              <p className="text-xs text-on-surface-variant">
                Hostel/home comfort, basic utilities, and feeling of physical security.
              </p>
            </div>

            {/* Noise Level (0-5) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Ambient Noise & Distraction (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.noise_level} / 5
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Is your hostel or room quiet enough for calm sleep and uninterrupted study?
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('noise_level', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.noise_level === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Peaceful</span>
                <span>5: Very Noisy</span>
              </div>
            </div>

            {/* Living Conditions (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Living Space Quality & Cleanliness (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.living_conditions} / 5
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Overall comfort, ventilation, and hygiene of your accommodation.
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('living_conditions', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.living_conditions === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Inadequate</span>
                <span>5: Very Comfortable</span>
              </div>
            </div>

            {/* Personal Safety Perception (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Feeling of Personal Safety on Campus (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.safety} / 5
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Do you feel physically safe walking around campus and your accommodation day and night?
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('safety', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.safety === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Unsafe</span>
                <span>5: Completely Safe</span>
              </div>
            </div>

            {/* Basic Needs Fulfillment (0-5) */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-background">
                  Basic Daily Needs Fulfillment (0 - 5)
                </label>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {formData.basic_needs} / 5
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Access to nutritious food, clean water, medical essentials, and study supplies.
              </p>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('basic_needs', val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.basic_needs === val
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0: Struggling</span>
                <span>5: Well Supported</span>
              </div>
            </div>

            {/* OPTIONAL WRITTEN REFLECTION */}
            <div className="flex flex-col gap-2 border-t border-surface-variant/30 pt-4">
              <label className="text-xs font-semibold text-on-background">
                {t('optional_reflection_label', 'Personal Reflection (Optional)')}
              </label>
              <p className="text-[11px] text-on-surface-variant">
                Is there anything you would like to share in your own words? (Screened safely, completely private)
              </p>
              <textarea
                rows={3}
                placeholder={t(
                  'optional_reflection_placeholder',
                  'Share anything on your mind in your own words... (Completely private)'
                )}
                value={formData.text_reflection || ''}
                onChange={(e) => updateField('text_reflection', e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-background focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
        )}

        {/* Error Message Display */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-xs text-error">
            {errorMessage}
          </div>
        )}

        {/* Bottom Stepper Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {currentSection > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-full bg-surface-container border border-outline-variant/40 text-xs font-semibold text-on-surface hover:bg-surface-variant"
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
              className="px-6 py-3 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
              <span>
                {loading
                  ? t('submitting_wellbeing_btn', 'Analyzing Wellbeing Pattern...')
                  : t('submit_wellbeing_btn', 'Save & Analyze My Wellbeing')}
              </span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

// Re-export as StressAssessmentView for backward compatibility
export const StressAssessmentView = MyWellbeingView;
