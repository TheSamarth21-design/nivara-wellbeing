import { Router } from 'express';
import { CrisisService } from '../services/safety/crisisService.js';

export const safetyRouter = Router();

safetyRouter.get('/helplines', (req, res) => {
  const list = CrisisService.getCrisisDirectory();
  res.json({ helplines: list });
});
