/**
 * TypeScript definitions for FastAPI AI Model Platform Integration.
 * Strictly aligned with:
 * - trained_models/student-stress-v2-clean/feature_schema.json
 * - backend/app/schemas/wellbeing.py
 */

export type AiApiStatus = 'CHECKING' | 'ONLINE' | 'OFFLINE' | 'DEGRADED';

export type AiErrorCategory =
  | 'OFFLINE'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED';

export interface AiServiceError {
  category: AiErrorCategory;
  message: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Clean 19 questionnaire features for student-stress-v2-clean.
 * blood_pressure is explicitly excluded to eliminate target leakage.
 */
export interface CleanStressFeatures {
  anxiety_level: number;           // 0.0 - 21.0
  self_esteem: number;             // 0.0 - 30.0
  mental_health_history: number;   // 0 or 1 (binary)
  depression: number;              // 0.0 - 27.0
  headache: number;                // 0.0 - 5.0
  sleep_quality: number;           // 0.0 - 5.0
  breathing_problem: number;       // 0.0 - 5.0
  noise_level: number;             // 0.0 - 5.0
  living_conditions: number;       // 0.0 - 5.0
  safety: number;                  // 0.0 - 5.0
  basic_needs: number;             // 0.0 - 5.0
  academic_performance: number;   // 0.0 - 5.0
  study_load: number;              // 0.0 - 5.0
  teacher_student_relationship: number; // 0.0 - 5.0
  future_career_concerns: number;  // 0.0 - 5.0
  social_support: number;          // 0.0 - 3.0
  peer_pressure: number;           // 0.0 - 5.0
  extracurricular_activities: number;   // 0.0 - 5.0
  bullying: number;                // 0.0 - 5.0
}

/**
 * Payload sent to POST /api/v1/ai/wellbeing/stress
 */
export interface StudentStressAssessmentRequest extends CleanStressFeatures {
  model_version: 'student-stress-v2-clean';
  text_reflection?: string;
}

/**
 * Response structure from POST /api/v1/ai/wellbeing/stress wrapped in APIResponse
 */
export interface StudentStressAssessmentResponse {
  stress_prediction?: string;      // Canonical label: class_0, class_1, class_2
  stress_level: string;            // Predicted stress level
  tentative_severity?: string;     // Unverified candidate: low, medium, high
  confidence: number;              // 0.0 - 1.0 calibrated probability
  uncertain: boolean;              // True if low confidence, small margin, or distribution shift
  confidence_tier?: 'high' | 'medium' | 'low';
  distribution_shift_warning?: boolean;
  features_outside_training_range?: string[];
  model: string;                   // student-stress-v2-clean
  model_version: string;
  validation_status: string;       // experimental
  dataset_type: string;            // externally_sourced_tabular_dataset
  provenance_status?: string;      // partially_verified
  non_diagnostic_framing?: string;
  status: string;                  // ready | crisis_escalated
  safety_status?: 'safe' | 'crisis_escalated' | 'warning';
  recommendations: string[];
  leakage_hardened?: boolean;      // True
  leakage_features_excluded?: string[]; // [blood_pressure]
  scientific_status?: string;      // experimental
}

export interface GenericApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  request_id?: string;
  timestamp?: string;
}

/**
 * Summary object for the Counselor Bridge workflow
 */
export interface WellbeingSummarySharePayload {
  student_wellbeing_id: string;
  assessment_timestamp: string;
  model_version: string;
  pattern_classification: string;
  tentative_severity?: string;
  confidence: number;
  uncertain: boolean;
  confidence_tier?: string;
  safety_status: string;
  recommendations: string[];
  student_reflection?: string;
  consent_granted: boolean;
  consent_scopes: string[];
}
