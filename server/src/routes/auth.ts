import { Router } from 'express';
import { db } from '../db/databaseAdapter.js';

export const authRouter = Router();

// Send OTP
authRouter.post('/send-otp', (req, res) => {
  const { contact, type } = req.body; // email or mobile
  if (!contact) {
    return res.status(400).json({ error: 'Contact identifier is required' });
  }

  // Development mock OTP: always 123456
  res.json({
    success: true,
    message: `OTP sent successfully to ${contact}`,
    mockOtp: '123456',
    cooldownSeconds: 30
  });
});

// Verify OTP & Login/Register
authRouter.post('/verify-otp', (req, res) => {
  const { contact, otp, type } = req.body;

  if (otp !== '123456' && otp !== '000000') {
    return res.status(400).json({ error: 'Invalid or expired OTP. Please enter 123456 for demo.' });
  }

  let user = db.findUserByContact(contact);
  let isFirstTime = false;

  if (!user) {
    user = db.createUser(contact, type === 'mobile');
    isFirstTime = true;
  }

  res.json({
    success: true,
    token: user.wellbeing_id,
    user: {
      wellbeingId: user.wellbeing_id,
      role: user.role,
      onboardingCompleted: user.onboarding_completed,
      isFirstTime
    }
  });
});

// Quick Demo Login for Reviewers (Switch roles instantly)
authRouter.post('/demo-login', (req, res) => {
  const { role } = req.body; // 'STUDENT', 'COUNSELLOR', 'ADMIN'
  let wellbeingId = 'WELL-8F42';
  if (role === 'COUNSELLOR') wellbeingId = 'COUNSELLOR-01';
  if (role === 'ADMIN') wellbeingId = 'ADMIN-01';

  res.json({
    success: true,
    token: wellbeingId,
    user: {
      wellbeingId,
      role: role || 'STUDENT',
      onboardingCompleted: true
    }
  });
});
