import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { db } from '../db/databaseAdapter.js';

export const privacyRouter = Router();

// Get current consents
privacyRouter.get('/consents', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const consents = db.getConsents(wellbeingId);
  res.json({ consents });
});

// Update consents
privacyRouter.put('/consents', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const existing = db.getConsents(wellbeingId);
  if (existing) {
    const updated = {
      ...existing,
      ...req.body,
      version: existing.version + 1,
      updated_at: new Date().toISOString()
    };
    db.saveConsents(updated);
    return res.json({ success: true, consents: updated });
  }
  res.status(404).json({ error: 'Consents record not found' });
});

// Export all user data in structured JSON
privacyRouter.get('/export', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const data = db.exportUserData(wellbeingId);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=nivara_data_${wellbeingId}.json`);
  res.send(JSON.stringify(data, null, 2));
});

// Purge / Delete all user data
privacyRouter.delete('/purge', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  db.purgeUserData(wellbeingId);
  res.json({
    success: true,
    message: 'Your personal data, wellbeing profile, check-ins, and identity mapping have been completely purged from the system.'
  });
});
