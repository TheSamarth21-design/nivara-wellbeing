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

  // 6. Enhanced Wellbeing Profile Sync
  db.saveWellbeingProfile({
    userId: wellbeingId,
    preferences: {
      communicationStyle: personalization?.communicationStyle || 'calm',
      preferredLanguage: personalization?.language || 'en',
      supportStyle: personalization?.supportStyle || 'balanced'
    },
    routine: {
      typicalSleepHours: routine?.sleepDuration || 7,
      studyPattern: routine?.studyPattern,
      dailyRoutine: routine?.routineStructure
    },
    wellbeingPreferences: {
      mainConcerns: stressors?.selectedTags || [],
      preferredSupportMethods: supportPreferences?.supportTypes || []
    },
    baseline: {
      initialMoodRange: 'Good',
      stressPattern: academicContext?.pressure || 'Manageable',
      energyPattern: 'Normal'
    },
    currentContext: {
      situation: academicContext?.upcomingEvent || 'Managing regular classes'
    },
    onboardingCompleted: true,
    updatedAt: new Date().toISOString()
  });

  db.completeOnboarding(wellbeingId);

  res.json({
    success: true,
    message: 'Wellbeing profile initialized successfully. Your space is ready 🌿',
    wellbeingId
  });
});

// GET Enhanced Wellbeing Profile
profileRouter.get('/wellbeing', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const profile = db.getWellbeingProfile(wellbeingId);
  res.json({ profile: profile || null });
});

// PUT / Update Enhanced Wellbeing Profile
profileRouter.put('/wellbeing', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const existing = db.getWellbeingProfile(wellbeingId);

  const updated = {
    userId: wellbeingId,
    preferences: {
      ...existing?.preferences,
      ...req.body.preferences
    },
    routine: {
      ...existing?.routine,
      ...req.body.routine
    },
    wellbeingPreferences: {
      ...existing?.wellbeingPreferences,
      ...req.body.wellbeingPreferences
    },
    baseline: {
      ...existing?.baseline,
      ...req.body.baseline
    },
    currentContext: {
      ...existing?.currentContext,
      ...req.body.currentContext
    },
    onboardingCompleted: true,
    updatedAt: new Date().toISOString()
  };

  db.saveWellbeingProfile(updated);
  res.json({ success: true, profile: updated });
});

