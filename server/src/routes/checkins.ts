import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { db } from '../db/databaseAdapter.js';
import { BaselineEngine } from '../services/twin/baselineEngine.js';

export const checkinsRouter = Router();

// Get check-in history
checkinsRouter.get('/', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const history = db.getCheckins(wellbeingId, 30);
  res.json({ checkins: history });
});

// Submit daily check-in
checkinsRouter.post('/', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const { moodTier, feelingTags, note } = req.body; // 'good' | 'okay' | 'not_great' | 'difficult'

  const scoreMap = {
    good: 4,
    okay: 3,
    not_great: 2,
    difficult: 1
  };

  const score = scoreMap[moodTier as keyof typeof scoreMap] || 3;

  const item = db.addCheckin({
    wellbeing_id: wellbeingId,
    mood_tier: moodTier,
    mood_score: score,
    feeling_tags: feelingTags || [],
    note
  });

  // Recalculate twin baseline
  const twin = BaselineEngine.calculateTwinState(wellbeingId);

  res.json({
    success: true,
    checkin: item,
    twin
  });
});
