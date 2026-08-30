import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { db } from '../db/databaseAdapter.js';
import { v4 as uuidv4 } from 'uuid';

export const profileRouter = Router();

// Get full student profile & context
profileRouter.get('/me', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const profile = db.getProfile(wellbeingId);
  const academics = db.getAcademicContext(wellbeingId);
  const routine = db.getRoutineProfile(wellbeingId);
  const stressors = db.getStressors(wellbeingId);
  const support = db.getSupportPreferences(wellbeingId);
  const consents = db.getConsents(wellbeingId);

  res.json({
    wellbeingId,
    profile,
    academics,
    routine,
    stressors,
    support,
    consents
  });
});

// Submit 7-step Onboarding Profile
profileRouter.post('/onboarding', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const {
    aboutYou,
    academicContext,
    routine,
    stressors,
    socialConnection,
    supportPreferences,
    personalization
  } = req.body;

  // 1. Profile
  db.saveProfile({
    id: uuidv4(),
    wellbeing_id: wellbeingId,
    preferred_name: aboutYou?.preferredName || 'Friend',
    age_range: aboutYou?.ageRange,
    education_level: aboutYou?.educationLevel,
    year_of_study: aboutYou?.yearOfStudy,
    department: aboutYou?.department,
    primary_goal: personalization?.primaryGoal || 'Understand my wellbeing',
    preferred_language: personalization?.language || 'en'
  });

  // 2. Academic Context
  if (academicContext) {
    db.saveAcademicContext({
      id: uuidv4(),
      wellbeing_id: wellbeingId,
      current_workload: academicContext.workload || 'Moderate',
      upcoming_event: academicContext.upcomingEvent || 'No major event',
      academic_pressure: academicContext.pressure || 'Manageable'
    });
  }

  // 3. Routine (Optional)
  if (routine) {
    db.saveRoutineProfile({
      id: uuidv4(),
      wellbeing_id: wellbeingId,
      sleep_duration: routine.sleepDuration,
      routine_structure: routine.routineStructure,
      study_pattern: routine.studyPattern
    });
  }

  // 4. Stressors & Social
  db.saveStressors({
    id: uuidv4(),
    wellbeing_id: wellbeingId,
    stressor_tags: stressors?.selectedTags || [],
    social_connection: socialConnection?.connectionLevel,
    primary_turn_to: socialConnection?.primaryTurnTo
  });

  // 5. Support Preferences
  db.saveSupportPreferences({
    id: uuidv4(),
    wellbeing_id: wellbeingId,
    comfortable_support_types: supportPreferences?.supportTypes || [],
    response_preference: supportPreferences?.responsePreference || 'Keep it simple'
  });

  db.completeOnboarding(wellbeingId);

  res.json({
    success: true,
    message: 'Wellbeing profile initialized successfully. Your space is ready 🌿',
    wellbeingId
  });
});
