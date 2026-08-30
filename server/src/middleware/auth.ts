import { Request, Response, NextFunction } from 'express';
import { db } from '../db/databaseAdapter.js';

export interface AuthRequest extends Request {
  user?: {
    authUserId: string;
    wellbeingId: string;
    role: 'STUDENT' | 'COUNSELLOR' | 'ADMIN';
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  // For development demo, allow header x-wellbeing-id or Bearer token
  let wellbeingId = (req.headers['x-wellbeing-id'] as string) || '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token.startsWith('WELL-') || token.startsWith('COUNSELLOR-') || token.startsWith('ADMIN-')) {
      wellbeingId = token;
    }
  }

  // Default fallback to demo student if unauthenticated in local dev
  if (!wellbeingId) {
    wellbeingId = 'WELL-8F42';
  }

  const user = db.findUserByAuthId(wellbeingId) || Array.from(db['users'].values()).find(u => u.wellbeing_id === wellbeingId);

  if (user) {
    req.user = {
      authUserId: user.auth_user_id,
      wellbeingId: user.wellbeing_id,
      role: user.role
    };
  } else {
    // Temporary anonymous guest session
    req.user = {
      authUserId: 'anon-id',
      wellbeingId: wellbeingId,
      role: 'STUDENT'
    };
  }

  next();
}
