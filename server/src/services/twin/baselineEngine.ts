import { db } from '../../db/databaseAdapter.js';

export interface TwinStatusResponse {
  wellbeingId: string;
  currentPatternState: 'Cold Start' | 'Stable' | 'Changing' | 'Improving' | 'Needs Attention';
  confidenceLevel: 'Initial' | 'Moderate' | 'Established';
  checkinCount: number;
  baselineMoodAvg: number;
  recentMoodAvg: number;
  lastShiftDetected?: string;
  insights: string[];
  microNudges: string[];
  recentHistory: Array<{ date: string; moodTier: string; score: number }>;
}

export class BaselineEngine {
  public static calculateTwinState(wellbeingId: string): TwinStatusResponse {
    const baseline = db.getTwinBaseline(wellbeingId);
    const checkins = db.getCheckins(wellbeingId, 14);
    const academics = db.getAcademicContext(wellbeingId);

    const count = checkins.length;

    // Cold start handling
    if (count < 3) {
      return {
        wellbeingId,
        currentPatternState: 'Cold Start',
        confidenceLevel: 'Initial',
        checkinCount: count,
        baselineMoodAvg: 3.0,
        recentMoodAvg: count > 0 ? checkins[0].mood_score : 3.0,
        lastShiftDetected: 'Your Twin is learning your daily natural rhythm.',
        insights: [
          'Your Digital Twin learns by observing your check-ins over time.',
          'Complete daily check-ins to build your longitudinal personal baseline.'
        ],
        microNudges: [
          'Try a 2-minute breathing reset before study sessions.',
          'Take a 5-minute walk outside between lectures.'
        ],
        recentHistory: checkins.map(c => ({
          date: c.created_at.slice(0, 10),
          moodTier: c.mood_tier,
          score: c.mood_score
        }))
      };
    }

    // Compute personal baseline vs recent 3 check-ins
    const totalScore = checkins.reduce((sum, c) => sum + c.mood_score, 0);
    const overallAvg = parseFloat((totalScore / count).toFixed(2));

    const recent3 = checkins.slice(0, 3);
    const recentAvg = parseFloat((recent3.reduce((sum, c) => sum + c.mood_score, 0) / recent3.length).toFixed(2));

    let state: 'Stable' | 'Changing' | 'Improving' | 'Needs Attention' = 'Stable';
    let shift = 'Consistent baseline maintained over recent days.';
    const insights: string[] = [];

    const delta = recentAvg - overallAvg;

    if (delta <= -0.6) {
      state = 'Needs Attention';
      shift = 'Recent check-ins indicate higher strain relative to your typical baseline.';
      insights.push('Your recent wellbeing pattern has noticeably dipped compared to your usual baseline.');
      if (academics?.upcoming_event === 'Exams' || academics?.current_workload === 'High') {
        insights.push('This pattern correlates with heightened academic workload and upcoming assessments.');
      }
    } else if (delta < -0.2) {
      state = 'Changing';
      shift = 'Slight downward variation detected against historical baseline.';
      insights.push('Your daily rhythm has shifted slightly over the last few check-ins.');
    } else if (delta >= 0.3) {
      state = 'Improving';
      shift = 'Positive momentum observed across recent check-ins.';
      insights.push('Your reflections show an upward, restorative trend over recent days.');
    } else {
      state = 'Stable';
      shift = 'Steady personal equilibrium maintained.';
      insights.push('Your wellbeing pattern is currently steady and resilient.');
    }

    const confidence: 'Initial' | 'Moderate' | 'Established' = count >= 10 ? 'Established' : count >= 5 ? 'Moderate' : 'Initial';

    // Update in store
    if (baseline) {
      baseline.baseline_mood_avg = overallAvg;
      baseline.checkin_count = count;
      baseline.current_pattern_state = state;
      baseline.confidence_level = confidence;
      baseline.last_shift_detected = shift;
      db.updateTwinBaseline(baseline);
    }

    return {
      wellbeingId,
      currentPatternState: state,
      confidenceLevel: confidence,
      checkinCount: count,
      baselineMoodAvg: overallAvg,
      recentMoodAvg: recentAvg,
      lastShiftDetected: shift,
      insights,
      microNudges: [
        'Protect at least 20 minutes of unstructured downtime tonight.',
        'Hydrate and take a screen break before your next revision block.',
        'If stress persists, consider a discreet check-in with campus support.'
      ],
      recentHistory: checkins.map(c => ({
        date: c.created_at.slice(0, 10),
        moodTier: c.mood_tier,
        score: c.mood_score
      }))
    };
  }
}
