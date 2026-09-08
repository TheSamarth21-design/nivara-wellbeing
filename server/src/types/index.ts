export interface CompanionReply {
  reply: string;
  safetyTier: 'GREEN' | 'YELLOW' | 'RED';
  suggestedAction?: string;
  crisisResources?: any[];
  suggestedQuickReplies?: string[];
  suggestedExercise?: string;
}

export type UserRole = 'STUDENT' | 'COUNSELLOR' | 'ADMIN';
