import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { db } from '../db/databaseAdapter.js';

export const supportRouter = Router();

// Student creates silent support request
supportRouter.post('/request', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const { reason, priority } = req.body;

  const request = db.createSupportRequest(wellbeingId, reason, priority || 'STANDARD');
  res.json({
    success: true,
    message: 'Your anonymous support request has been queued discreetly.',
    request
  });
});

// Student gets active support request status & messages
supportRouter.get('/my-request', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const requests = db.getSupportRequests().filter(r => r.wellbeing_id === wellbeingId);
  const active = requests[0];
  const messages = active ? db.getCounsellorMessages(active.id) : [];

  res.json({
    activeRequest: active || null,
    messages
  });
});

// Student sends message in active session
supportRouter.post('/message', (req: AuthRequest, res) => {
  const { requestId, message } = req.body;
  if (!requestId || !message) {
    return res.status(400).json({ error: 'Request ID and message required' });
  }

  const msg = db.addCounsellorMessage(requestId, 'student', message);
  res.json({ success: true, message: msg });
});
