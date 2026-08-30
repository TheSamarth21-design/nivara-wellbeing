import { Router } from 'express';
import { CounsellorService } from '../services/support/counsellorService.js';
import { db } from '../db/databaseAdapter.js';

export const counsellorRouter = Router();

// Counsellor Dashboard Queue (Identity Separation strictly preserved)
counsellorRouter.get('/queue', (req, res) => {
  const queue = CounsellorService.getCounsellorQueue();
  res.json({ queue });
});

// Accept request
counsellorRouter.post('/accept', (req, res) => {
  const { requestId, counsellorId } = req.body;
  const updated = CounsellorService.acceptRequest(requestId, counsellorId || 'COUNSELLOR-01');
  res.json({ success: true, request: updated });
});

// Get session messages
counsellorRouter.get('/messages/:requestId', (req, res) => {
  const messages = db.getCounsellorMessages(req.params.requestId);
  res.json({ messages });
});

// Counsellor sends message
counsellorRouter.post('/message', (req, res) => {
  const { requestId, message } = req.body;
  const msg = db.addCounsellorMessage(requestId, 'counsellor', message);
  res.json({ success: true, message: msg });
});

// Complete session & schedule follow-up
counsellorRouter.post('/complete', (req, res) => {
  const { requestId, followupDays } = req.body;
  const result = CounsellorService.completeSession(requestId, followupDays || 7);
  res.json(result);
});
