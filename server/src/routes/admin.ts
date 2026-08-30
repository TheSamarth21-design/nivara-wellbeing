import { Router } from 'express';
import { db } from '../db/databaseAdapter.js';
import { AggregationService } from '../services/privacy/aggregationService.js';

export const adminRouter = Router();

adminRouter.get('/metrics', (req, res) => {
  const radar = AggregationService.getCampusRadar();
  const logs = db.getAuditLogs().slice(-50);
  const supportRequests = db.getSupportRequests();

  res.json({
    radar,
    totalAuditLogs: logs.length,
    recentAuditLogs: logs,
    totalSupportRequests: supportRequests.length,
    activeSupportRequests: supportRequests.filter(s => s.status !== 'COMPLETED').length
  });
});
