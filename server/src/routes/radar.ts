import { Router } from 'express';
import { AggregationService } from '../services/privacy/aggregationService.js';

export const radarRouter = Router();

radarRouter.get('/', (req, res) => {
  const radar = AggregationService.getCampusRadar();
  res.json(radar);
});
