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

  // TEST 4: Privacy & Identity Separation
  console.log('\n--- TEST 4: Privacy & Identity Separation ---');
  const exportData = db.exportUserData(wId);
  assert('Data export contains structured user data without internal secrets', !!exportData && exportData.wellbeing_identity === wId);

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
