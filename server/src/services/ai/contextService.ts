import { db } from '../../db/databaseAdapter.js';

export interface ConsentedContext {
  preferredName: string;
  primaryGoal?: string;
  preferredLanguage: string;
  academicWorkload?: string;
  upcomingEvent?: string;
  academicPressure?: string;
  routineSleep?: string;
  stressors?: string[];
  recentCheckinMood?: string;
  approvedMemories: Array<{ key: string; value: string }>;
}

export class ContextService {
  public static buildContext(wellbeingId: string): ConsentedContext {
    const profile = db.getProfile(wellbeingId);
    const consents = db.getConsents(wellbeingId);
    const academics = db.getAcademicContext(wellbeingId);
    const routine = db.getRoutineProfile(wellbeingId);
    const stressors = db.getStressors(wellbeingId);
    const checkins = db.getCheckins(wellbeingId, 1);
    const memories = db.getAIMemories(wellbeingId);

    const context: ConsentedContext = {
      preferredName: profile?.preferred_name || 'Friend',
      primaryGoal: profile?.primary_goal,
      preferredLanguage: profile?.preferred_language || 'en',
      approvedMemories: []
    };

    if (consents?.consent_academic_context && academics) {
      context.academicWorkload = academics.current_workload;
      context.upcomingEvent = academics.upcoming_event;
      context.academicPressure = academics.academic_pressure;
    }

    if (consents?.consent_routine_data && routine) {
      context.routineSleep = routine.sleep_duration;
    }

    if (consents?.consent_checkins && checkins.length > 0) {
      context.recentCheckinMood = checkins[0].mood_tier;
    }

    if (stressors?.stressor_tags) {
      context.stressors = stressors.stressor_tags;
    }

    if (consents?.consent_ai_memory) {
      context.approvedMemories = memories.map(m => ({ key: m.memory_key, value: m.memory_value }));
    }

    return context;
  }
}
