import { checkinService, StoredCheckin } from '../client/src/services/checkinService';

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`✅ PASS: ${description}`);
  } else {
    console.error(`❌ FAIL: ${description}`);
    process.exit(1);
  }
}

console.log('--- TEST: Wellbeing Check-in Trend Analysis Engine ---');

const mockCheckins: StoredCheckin[] = [
  {
    id: 'chk-1',
    studentId: 'student_123',
    userId: 'student_123',
    mood: 'Good',
    moodScore: 4,
    moodTier: 'good',
    energyLevel: 'Normal',
    energyScore: 3,
    stressLevel: 'High',
    stressScore: 3,
    anxietyLevel: 5,
    sleepQuality: 'Poor',
    sleepScore: 1,
    academicPressure: 4,
    lonelinessLevel: 1,
    answers: { study_load: 4, sleep_quality: 1 },
    source: 'daily_checkin',
    feelingTags: ['exam_stress'],
    note: 'Studying for vivas',
    date: '2026-09-08',
    createdAt: new Date('2026-09-08T09:00:00Z'),
    updatedAt: new Date('2026-09-08T09:00:00Z')
  },
  {
    id: 'chk-2',
    studentId: 'student_123',
    userId: 'student_123',
    mood: 'Okay',
    moodScore: 3,
    moodTier: 'okay',
    energyLevel: 'Moderate',
    energyScore: 2,
    stressLevel: 'Moderate',
    stressScore: 2,
    anxietyLevel: 6,
    sleepQuality: 'Poor',
    sleepScore: 1,
    academicPressure: 4,
    lonelinessLevel: 1,
    answers: { study_load: 4, sleep_quality: 1 },
    source: 'daily_checkin',
    feelingTags: [],
    note: 'Tired today',
    date: '2026-09-07',
    createdAt: new Date('2026-09-07T09:00:00Z'),
    updatedAt: new Date('2026-09-07T09:00:00Z')
  },
  {
    id: 'chk-3',
    studentId: 'student_123',
    userId: 'student_123',
    mood: 'Difficult',
    moodScore: 2,
    moodTier: 'difficult',
    energyLevel: 'Low',
    energyScore: 1,
    stressLevel: 'High',
    stressScore: 3,
    anxietyLevel: 8,
    sleepQuality: 'Okay',
    sleepScore: 2,
    academicPressure: 5,
    lonelinessLevel: 2,
    answers: { study_load: 5, sleep_quality: 2 },
    source: 'daily_checkin',
    feelingTags: ['overwhelmed'],
    note: 'Sleepless night',
    date: '2026-09-06',
    createdAt: new Date('2026-09-06T09:00:00Z'),
    updatedAt: new Date('2026-09-06T09:00:00Z')
  }
];

const trends = checkinService.analyzeWellbeingTrends(mockCheckins, 7);

assert('Calculates non-clinical latest mood', trends.latestMood === 'Good');
assert('Detects improving mood trend over history (2 -> 3 -> 4)', trends.recentMoodTrend === 'improving');
assert('Detects elevated academic pressure', trends.academicPressure === 'high');
assert('Detects poor sleep trend', trends.sleepTrend === 'poor');
assert('Identifies non-clinical key concerns', trends.keyConcerns.includes('Elevated academic pressure'));
assert('Generates supportive summary sentence', trends.summarySentence.includes('experiencing elevated academic workload'));
assert('Preserves privacy with zero clinical labels or diagnostic assertions', !trends.summarySentence.includes('depression') && !trends.summarySentence.includes('disorder'));

console.log('All check-in pipeline trend tests passed successfully!');
