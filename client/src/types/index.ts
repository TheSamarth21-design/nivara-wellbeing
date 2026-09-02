export * from './auth';
export type UserRole = 'student' | 'teacher' | 'counselor' | 'STUDENT' | 'COUNSELLOR' | 'ADMIN';

export type MoodTier = 'good' | 'okay' | 'not_great' | 'difficult';

export type PatternState = 'Cold Start' | 'Stable' | 'Changing' | 'Improving' | 'Needs Attention';

export interface UserSession {
  wellbeingId: string;
  role: UserRole;
  onboardingCompleted: boolean;
  isFirstTime?: boolean;
}

export interface StudentProfileData {
  wellbeingId: string;
  profile?: {
    preferred_name: string;
    age_range?: string;
    education_level?: string;
    year_of_study?: string;
    department?: string;
    primary_goal?: string;
    preferred_language: 'en' | 'hi' | 'mr';
  };
  academics?: {
    current_workload: 'Low' | 'Moderate' | 'High' | 'Very high';
    upcoming_event: string;
    academic_pressure: 'Manageable' | 'A little stressful' | 'Quite stressful' | 'Very difficult';
  };
  routine?: {
    sleep_duration?: string;
    routine_structure?: string;
    study_pattern?: string;
  };
  stressors?: {
    stressor_tags: string[];
    social_connection?: string;
    primary_turn_to?: string;
  };
  support?: {
    comfortable_support_types: string[];
    response_preference?: string;
  };
  consents?: {
    consent_ai_personalization: boolean;
    consent_checkins: boolean;
    consent_academic_context: boolean;
    consent_routine_data: boolean;
    consent_counsellor_sharing: boolean;
    consent_campus_analytics: boolean;
    consent_ai_memory: boolean;
  };
}

export interface TwinStatus {
  wellbeingId: string;
  currentPatternState: PatternState;
  confidenceLevel: 'Initial' | 'Moderate' | 'Established';
  checkinCount: number;
  baselineMoodAvg: number;
  recentMoodAvg: number;
  lastShiftDetected?: string;
  insights: string[];
  microNudges: string[];
  recentHistory: Array<{ date: string; moodTier: MoodTier; score: number }>;
}

export interface CheckinItem {
  id: string;
  wellbeing_id: string;
  mood_tier: MoodTier;
  mood_score: number;
  feeling_tags: string[];
  note?: string;
  created_at: string;
}

export interface AIMessageItem {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  message: string;
  safety_tier: 'GREEN' | 'YELLOW' | 'RED';
  suggested_action?: string;
  created_at: string;
}

export interface CrisisResourceItem {
  name: string;
  tollFree: string;
  description: string;
  urgent: boolean;
  languages: string[];
}
