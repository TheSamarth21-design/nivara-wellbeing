export interface CompanionReply {
  reply: string;
  safetyTier: 'GREEN' | 'YELLOW' | 'RED';
  suggestedAction?: string;
  crisisResources?: any[];
}

export type UserRole = 'STUDENT' | 'COUNSELLOR' | 'ADMIN';
