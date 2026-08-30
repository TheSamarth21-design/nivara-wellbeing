import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { SupportSimulationEngine } from '../services/simulator/supportSimulationEngine.js';

export const simulatorRouter = Router();

simulatorRouter.post('/run', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const { scenarioTitle, timeHorizonDays, selectedPathway } = req.body;

  const result = SupportSimulationEngine.runSimulation({
    wellbeingId,
    scenarioTitle: scenarioTitle || 'Upcoming Mid-Semester Examination',
    timeHorizonDays: timeHorizonDays || 10,
    selectedPathway: selectedPathway || 'A_UNCHANGED'
  });

  res.json(result);
});
