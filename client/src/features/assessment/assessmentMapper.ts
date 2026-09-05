import { CleanStressFeatures, StudentStressAssessmentRequest } from '../../types/ai';

export interface QuestionnaireFormState {
  // Section 1: Emotional Wellbeing
  anxiety_level?: number;         // 0 - 21
  depression?: number;            // 0 - 27
  self_esteem?: number;           // 0 - 30
  mental_health_history?: number; // 0 or 1

  // Section 2: Academic Experience
  study_load?: number;            // 0 - 5
  academic_performance?: number; // 0 - 5
  future_career_concerns?: number;// 0 - 5
  teacher_student_relationship?: number; // 0 - 5

  // Section 3: Physical & Daily Wellbeing
  sleep_quality?: number;         // 0 - 5
  headache?: number;              // 0 - 5
  breathing_problem?: number;     // 0 - 5

  // Section 4: Social Environment
  social_support?: number;        // 0 - 3
  peer_pressure?: number;         // 0 - 5
  bullying?: number;              // 0 - 5
  extracurricular_activities?: number; // 0 - 5

  // Section 5: Living Environment
  noise_level?: number;           // 0 - 5
  living_conditions?: number;     // 0 - 5
  safety?: number;                // 0 - 5
  basic_needs?: number;           // 0 - 5

  // Optional qualitative reflection
  text_reflection?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  payload?: StudentStressAssessmentRequest;
}

/**
 * Exact bounds from trained_models/student-stress-v2-clean/feature_schema.json
 */
export const FEATURE_BOUNDS: Record<keyof CleanStressFeatures, { min: number; max: number; label: string; section: number }> = {
  anxiety_level: { min: 0, max: 21, label: 'Anxiety symptom indicator', section: 1 },
  depression: { min: 0, max: 27, label: 'Depression symptom indicator', section: 1 },
  self_esteem: { min: 0, max: 30, label: 'Self-esteem scale', section: 1 },
  mental_health_history: { min: 0, max: 1, label: 'Prior mental health history', section: 1 },

  study_load: { min: 0, max: 5, label: 'Current academic workload', section: 2 },
  academic_performance: { min: 0, max: 5, label: 'Academic satisfaction & performance', section: 2 },
  future_career_concerns: { min: 0, max: 5, label: 'Future career concerns', section: 2 },
  teacher_student_relationship: { min: 0, max: 5, label: 'Faculty & mentor rapport', section: 2 },

  sleep_quality: { min: 0, max: 5, label: 'Sleep quality & restfulness', section: 3 },
  headache: { min: 0, max: 5, label: 'Headache & physical tension', section: 3 },
  breathing_problem: { min: 0, max: 5, label: 'Breathing comfort & steadiness', section: 3 },

  social_support: { min: 0, max: 3, label: 'Social & peer support index', section: 4 },
  peer_pressure: { min: 0, max: 5, label: 'Peer expectations & pressure', section: 4 },
  bullying: { min: 0, max: 5, label: 'Unwelcoming peer behavior / bullying', section: 4 },
  extracurricular_activities: { min: 0, max: 5, label: 'Extracurricular engagement', section: 4 },

  noise_level: { min: 0, max: 5, label: 'Study & living noise environment', section: 5 },
  living_conditions: { min: 0, max: 5, label: 'Living space quality & comfort', section: 5 },
  safety: { min: 0, max: 5, label: 'Personal safety perception', section: 5 },
  basic_needs: { min: 0, max: 5, label: 'Basic needs fulfillment', section: 5 },
};

/**
 * Pure transformation mapper for active Nivara student wellbeing assessment.
 * Validates all 19 clean questionnaire features against model training bounds.
 * Strictly guarantees whitelist-only construction for student-stress-v2-clean.
 */
export function mapQuestionnaireToModelPayload(
  state: QuestionnaireFormState
): ValidationResult {
  const errors: Record<string, string> = {};

  // Verify all 19 required features are present and bounded
  const cleanFeatures: Partial<CleanStressFeatures> = {};

  (Object.keys(FEATURE_BOUNDS) as Array<keyof CleanStressFeatures>).forEach((field) => {
    const val = state[field];
    const { min, max, label } = FEATURE_BOUNDS[field];

    if (val === undefined || val === null || typeof val !== 'number' || isNaN(val)) {
      errors[field] = label + ' has not been completed.';
      return;
    }

    if (val < min || val > max) {
      errors[field] = label + ' must be between ' + min + ' and ' + max + '.';
      return;
    }

    cleanFeatures[field] = val;
  });

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  // Construct valid 19-feature payload for student-stress-v2-clean
  const payload: StudentStressAssessmentRequest = {
    model_version: 'student-stress-v2-clean',
    anxiety_level: cleanFeatures.anxiety_level!,
    self_esteem: cleanFeatures.self_esteem!,
    mental_health_history: cleanFeatures.mental_health_history!,
    depression: cleanFeatures.depression!,
    headache: cleanFeatures.headache!,
    sleep_quality: cleanFeatures.sleep_quality!,
    breathing_problem: cleanFeatures.breathing_problem!,
    noise_level: cleanFeatures.noise_level!,
    living_conditions: cleanFeatures.living_conditions!,
    safety: cleanFeatures.safety!,
    basic_needs: cleanFeatures.basic_needs!,
    academic_performance: cleanFeatures.academic_performance!,
    study_load: cleanFeatures.study_load!,
    teacher_student_relationship: cleanFeatures.teacher_student_relationship!,
    future_career_concerns: cleanFeatures.future_career_concerns!,
    social_support: cleanFeatures.social_support!,
    peer_pressure: cleanFeatures.peer_pressure!,
    extracurricular_activities: cleanFeatures.extracurricular_activities!,
    bullying: cleanFeatures.bullying!,
    text_reflection: state.text_reflection?.trim() || undefined
  };

  return { isValid: true, errors: {}, payload };
}
