import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { db } from '../db/databaseAdapter.js';
import { NivaraAgent } from '../services/ai/nivaraAgent.js';

export const companionRouter = Router();

// Get conversation messages
companionRouter.get('/messages', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const messages = db.getAIMessages(wellbeingId);
  res.json({ messages });
});

// Send message to AI companion (Orchestrated by NivaraAgent)
companionRouter.post('/message', async (req: AuthRequest, res, next) => {
  try {
    const wellbeingId = req.user!.wellbeingId;
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const response = await NivaraAgent.processMessage(wellbeingId, message);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Chat alias
companionRouter.post('/chat', async (req: AuthRequest, res, next) => {
  try {
    const wellbeingId = req.user!.wellbeingId;
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const response = await NivaraAgent.processMessage(wellbeingId, message);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// AI Response Feedback (Helpful / Not Helpful + Tag)
companionRouter.post('/feedback', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const { messageId, helpful, feedbackTag, comment } = req.body;

  if (typeof helpful !== 'boolean') {
    return res.status(400).json({ error: 'helpful boolean is required' });
  }

  const feedback = db.addAIFeedback({
    wellbeing_id: wellbeingId,
    message_id: messageId,
    helpful,
    feedback_tag: feedbackTag,
    comment
  });

  res.json({ success: true, feedback });
});

// AI Memory Endpoints
companionRouter.get('/memory', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const memories = db.getAIMemories(wellbeingId);
  res.json({ memories });
});

companionRouter.post('/memory', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const { key, value } = req.body;
  if (!key || !value) {
    return res.status(400).json({ error: 'Key and value are required' });
  }
  const item = db.addAIMemory(wellbeingId, key, value);
  res.json({ success: true, item });
});

companionRouter.delete('/memory/:id', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const success = db.deleteAIMemory(wellbeingId, id);
  res.json({ success });
});

companionRouter.delete('/memory', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  db.clearAIMemory(wellbeingId);
  res.json({ success: true, message: 'AI memory cleared' });
});
