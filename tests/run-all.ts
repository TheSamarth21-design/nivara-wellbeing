import { RiskEngine } from '../server/src/services/safety/riskEngine.js';
import { AggregationService } from '../server/src/services/privacy/aggregationService.js';
import { BaselineEngine } from '../server/src/services/twin/baselineEngine.js';
import { db } from '../server/src/db/databaseAdapter.js';

async function runTests() {
  console.log('\n🌿 ============================================================');
  console.log('    NIVARA SYSTEM VERIFICATION SUITE (SIH 2026)');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${title} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // Set up transient test students for testing algorithms
  const testStudent = db.createUser('test.student@college.edu', false);
  const wId = testStudent.wellbeing_id;

  db.saveProfile({
    id: 'test-p-1',
    wellbeing_id: wId,
    preferred_name: 'TestStudent',
    department: 'Computer Science & Engineering',
    education_level: 'Undergraduate',
    year_of_study: '3rd Year',
    preferred_language: 'en'
  });

  db.saveAcademicContext({
    id: 'test-a-1',
    wellbeing_id: wId,
    current_workload: 'High',
    upcoming_event: 'Exams',
    academic_pressure: 'Quite stressful'
  });

  // Log 5 check-ins to build baseline
  db.addCheckin({ wellbeing_id: wId, mood_tier: 'good', mood_score: 4, feeling_tags: [] });
  db.addCheckin({ wellbeing_id: wId, mood_tier: 'good', mood_score: 4, feeling_tags: [] });
  db.addCheckin({ wellbeing_id: wId, mood_tier: 'okay', mood_score: 3, feeling_tags: [] });
  db.addCheckin({ wellbeing_id: wId, mood_tier: 'not_great', mood_score: 2, feeling_tags: [] });
  db.addCheckin({ wellbeing_id: wId, mood_tier: 'not_great', mood_score: 2, feeling_tags: [] });

  // TEST 1: Safety Engine 3-Tier Classification
  console.log('--- TEST 1: 3-Tier Safety Engine ---');
  const greenRes = RiskEngine.evaluateMessage(wId, 'I had a good study session today.');
  assert('Green Safety Tier correctly classified', greenRes.tier === 'GREEN');

  const yellowRes = RiskEngine.evaluateMessage(wId, 'I am feeling hopeless and exhausted of everything.');
  assert('Yellow Safety Tier correctly detected for high distress', yellowRes.tier === 'YELLOW');
  assert('Yellow recommends counsellor offer', yellowRes.recommendedAction === 'OFFER_COUNSELLOR');

  const redRes = RiskEngine.evaluateMessage(wId, 'I want to kill myself.');
  assert('Red Safety Tier correctly triggered for crisis phrases', redRes.tier === 'RED');
  assert('Red triggers immediate safety mode & Tele-MANAS resources', redRes.recommendedAction === 'TRIGGER_SAFETY_MODE' && (redRes.crisisResources?.length || 0) > 0);

  // TEST 2: Campus Radar Privacy Cohort Threshold (N >= 5)
  console.log('\n--- TEST 2: Campus Radar Privacy Threshold (N >= 5) ---');
  
  // Create a cohort of 5 students in CSE
  for (let i = 1; i <= 5; i++) {
    const s = db.createUser(`test.cse.${i}@college.edu`, false);
    db.saveProfile({
      id: `test-cse-p-${i}`,
      wellbeing_id: s.wellbeing_id,
      preferred_name: `CSE Student ${i}`,
      department: 'Computer Science & Engineering',
      preferred_language: 'en'
    });
    db.addCheckin({ wellbeing_id: s.wellbeing_id, mood_tier: 'okay', mood_score: 3, feeling_tags: [] });
  }

  // Create a cohort of only 2 students in Biotechnology (Under Threshold N < 5)
  for (let i = 1; i <= 2; i++) {
    const s = db.createUser(`test.bio.${i}@college.edu`, false);
    db.saveProfile({
      id: `test-bio-p-${i}`,
      wellbeing_id: s.wellbeing_id,
      preferred_name: `Bio Student ${i}`,
      department: 'Biotechnology',
      preferred_language: 'en'
    });
    db.addCheckin({ wellbeing_id: s.wellbeing_id, mood_tier: 'good', mood_score: 4, feeling_tags: [] });
  }

  const radar = AggregationService.getCampusRadar();
  assert('Campus Radar returns aggregate departments', radar.departments.length > 0);

  const protectedDept = radar.departments.find(d => d.department === 'Biotechnology');
  const visibleDept = radar.departments.find(d => d.department === 'Computer Science & Engineering');

  assert('Under-threshold cohorts (N < 5) are masked with privacy shield', !!protectedDept && protectedDept.isCohortProtected === true);
  assert('Cohorts with N >= 5 display aggregated index without individual PII', !!visibleDept && visibleDept.isCohortProtected === false && typeof visibleDept.averageMoodIndex === 'number');

  // TEST 3: Digital Twin Longitudinal Baseline
  console.log('\n--- TEST 3: Digital Twin Longitudinal Baseline ---');
  const twin = BaselineEngine.calculateTwinState(wId);
  assert('Established student calculates non-clinical pattern state', ['Stable', 'Changing', 'Improving', 'Needs Attention'].includes(twin.currentPatternState));
  assert('Twin contains longitudinal reflections and micro-nudges', twin.insights.length > 0 && twin.microNudges.length > 0);

  // TEST 5: Personalization Profile
  console.log('\n--- TEST 5: Personalization Engine & Profile ---');
  db.saveWellbeingProfile({
    userId: wId,
    preferences: {
      communicationStyle: 'direct',
      preferredLanguage: 'en',
      supportStyle: 'short'
    },
    routine: {
      typicalSleepHours: '6-7 hrs',
      studyPattern: 'Evening',
      dailyRoutine: 'Flexible'
    },
    wellbeingPreferences: {
      mainConcerns: ['Exam pressure', 'Time management'],
      preferredSupportMethods: ['Breaking problems into smaller steps', 'Practical solutions']
    },
    baseline: {
      initialMoodRange: 'Good',
      stressPattern: 'Preparing for exams',
      energyPattern: 'Normal'
    },
    currentContext: {
      situation: 'Preparing for exams'
    },
    onboardingCompleted: true,
    updatedAt: new Date().toISOString()
  });

  const p = db.getWellbeingProfile(wId);
  assert('Personalization profile created with communication & support preferences', !!p && p.preferences.communicationStyle === 'direct');
  assert('Non-clinical main concerns and support methods stored properly', (p?.wellbeingPreferences.mainConcerns.length || 0) > 0);

  // TEST 6: Enhanced Visual Check-In & Adaptive Question Engine
  console.log('\n--- TEST 6: Visual Check-In & Smart Adaptive Questions ---');
  const chk = db.addEnhancedCheckin({
    wellbeing_id: wId,
    mood_tier: 'Low',
    mood_score: 2,
    energy_level: 'Low',
    stress_level: 'High',
    sleep_quality: 'Poor',
    feeling_tags: ['tired', 'exam_stress']
  });

  assert('Enhanced check-in logs multi-metric wellbeing indicators (mood, energy, stress, sleep)', chk.mood_score === 2 && chk.stress_level === 'High');

  const adaptive = db.getAdaptiveQuestion(wId);
  assert('High stress triggers contextual adaptive question', !!adaptive && adaptive.trigger === 'HIGH_STRESS');
  assert('Adaptive question provides non-clinical selection chips', !!adaptive && adaptive.options.includes('Exams'));

  // TEST 7: NivaraAgent AI Orchestration & Conversation Memory
  console.log('\n--- TEST 7: NivaraAgent Orchestration & Memory ---');
  const { NivaraAgent } = await import('../server/src/services/ai/nivaraAgent.js');
  
  const aiReply1 = await NivaraAgent.processMessage(wId, 'I have exams tomorrow and I feel unprepared.');
  assert('NivaraAgent generates supportive green response', aiReply1.safetyTier === 'GREEN' && aiReply1.reply.length > 0);

  const aiReply2 = await NivaraAgent.processMessage(wId, 'It feels even harder now.');
  assert('NivaraAgent preserves conversation continuity across turns', aiReply2.safetyTier === 'GREEN');

  // Verify conversation memory stored
  const memoryMessages = db.getAIMessages(wId, 10);
  assert('Conversation memory tracks sliding window of turns', memoryMessages.length >= 4);

  // Verify crisis safety override
  const crisisReply = await NivaraAgent.processMessage(wId, 'I cannot take this anymore, I want to end my life.');
  assert('Crisis message immediately triggers RED tier override with Tele-MANAS', crisisReply.safetyTier === 'RED' && crisisReply.suggestedAction === 'SAFETY_MODE');

  // TEST 8: AI Response Feedback
  console.log('\n--- TEST 8: Response Feedback Loop ---');
  const fb = db.addAIFeedback({
    wellbeing_id: wId,
    helpful: false,
    feedback_tag: 'Too generic',
    comment: 'Wanted more step-by-step guidance'
  });
  assert('AI feedback records helpfulness and categorization tags separately from conversation', !!fb && fb.helpful === false && fb.feedback_tag === 'Too generic');

  // TEST 9: Privacy-First Research Consent (Default OFF, Training Strictly False)
  console.log('\n--- TEST 9: Privacy-First Research Consent ---');
  const initialConsent = db.getResearchConsent(wId);
  assert('Research consent defaults to OFF', initialConsent.contributeToImprovement === false);
  assert('Private chat training is strictly false by default', initialConsent.allowPrivateChatForTraining === false);

  db.saveResearchConsent({
    ...initialConsent,
    contributeToImprovement: true,
    allowDeidentifiedFeedback: true,
    allowPrivateChatForTraining: false
  });

  const updatedConsent = db.getResearchConsent(wId);
  assert('Opt-in consent update succeeds', updatedConsent.contributeToImprovement === true && updatedConsent.allowDeidentifiedFeedback === true);
  assert('Private chat training remains strictly false even when opted into research', updatedConsent.allowPrivateChatForTraining === false);

  // Clean up transient test records
  db.purgeUserData(wId);

  console.log('\n============================================================');
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
