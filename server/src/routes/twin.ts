import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { BaselineEngine } from '../services/twin/baselineEngine.js';

export const twinRouter = Router();

twinRouter.get('/status', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const twin = BaselineEngine.calculateTwinState(wellbeingId);
  res.json(twin);
});
