import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { db } from '../db/databaseAdapter.js';
import { BaselineEngine } from '../services/twin/baselineEngine.js';

export const checkinsRouter = Router();

// Get check-in history
checkinsRouter.get('/', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const history = db.getEnhancedCheckins(wellbeingId, 30);
  res.json({ checkins: history });
});

// Submit daily check-in (Supporting 5-point scale, energy, stress, sleep)
checkinsRouter.post('/', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const {
    moodScore,
    moodTier,
    energyLevel,
    stressLevel,
    sleepQuality,
    feelingTags,
    note
  } = req.body;

  // Validate or calculate score (1-5)
  let score = Number(moodScore);
  if (!score || isNaN(score) || score < 1 || score > 5) {
    const scoreMap: Record<string, number> = {
      great: 5,
      good: 4,
      okay: 3,
      low: 2,
      not_great: 2,
      very_low: 1,
      difficult: 1
    };
    score = scoreMap[(moodTier || '').toLowerCase()] || 3;
  }

  const derivedTier =
    score === 5 ? 'Great' : score === 4 ? 'Good' : score === 3 ? 'Okay' : score === 2 ? 'Low' : 'Very Low';

  const item = db.addEnhancedCheckin({
    wellbeing_id: wellbeingId,
    mood_tier: derivedTier,
    mood_score: score,
    energy_level: energyLevel || 'Normal',
    stress_level: stressLevel || 'Moderate',
    sleep_quality: sleepQuality || 'Okay',
    feeling_tags: feelingTags || [],
    note
  });

  // Recalculate twin baseline
  const twin = BaselineEngine.calculateTwinState(wellbeingId);

  // Check if an adaptive question should trigger
  const adaptiveQuestion = db.getAdaptiveQuestion(wellbeingId);

  res.json({
    success: true,
    checkin: item,
    twin,
    adaptiveQuestion
  });
});

// GET Smart Adaptive Question for today
checkinsRouter.get('/adaptive', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const adaptive = db.getAdaptiveQuestion(wellbeingId);
  res.json({ adaptiveQuestion: adaptive });
});

// GET Recent check-ins for the authenticated student (Phase 8 API)
checkinsRouter.get('/recent', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const history = db.getEnhancedCheckins(wellbeingId, 7);
  res.json({ checkins: history });
});

// GET Non-clinical trend summary for the authenticated student (Phase 8 API)
checkinsRouter.get('/trends', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const history = db.getEnhancedCheckins(wellbeingId, 14);
  const twin = BaselineEngine.calculateTwinState(wellbeingId);

  const trends = {
    recentMoodTrend:
      twin.currentPatternState === 'Improving'
        ? 'improving'
        : twin.currentPatternState === 'Needs Attention'
        ? 'declining'
        : 'stable',
    stressTrend: history.some(h => h.stress_level === 'High') ? 'high' : 'moderate',
    sleepTrend: history.some(h => h.sleep_quality === 'Poor') ? 'poor' : 'good',
    academicPressure: 'moderate',
    keyConcerns: twin.currentPatternState === 'Needs Attention' ? ['Elevated stress'] : [],
    positiveSignals: twin.insights.slice(0, 2),
    checkinCount: history.length,
    latestMood: history[0]?.mood_tier || 'Okay'
  };

  res.json({ trends });
});
