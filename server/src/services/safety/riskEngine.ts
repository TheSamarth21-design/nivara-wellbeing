import { checkDeterministicRisk } from './riskRules.js';
import { CrisisService } from './crisisService.js';
import { db } from '../../db/databaseAdapter.js';

export interface SafetyEvaluation {
  tier: 'GREEN' | 'YELLOW' | 'RED';
  triggerReason?: string;
  recommendedAction: 'CONTINUE' | 'OFFER_COUNSELLOR' | 'TRIGGER_SAFETY_MODE';
  crisisResources?: any[];
}

export class RiskEngine {
  public static evaluateMessage(wellbeingId: string, message: string): SafetyEvaluation {
    const tier = checkDeterministicRisk(message);

    if (tier === 'RED') {
      db.logAudit(wellbeingId, 'SAFETY_EVENT_RED', { snippetLength: message.length });
      return {
        tier: 'RED',
        triggerReason: 'Critical safety indicator detected',
        recommendedAction: 'TRIGGER_SAFETY_MODE',
        crisisResources: CrisisService.getCrisisDirectory()
      };
    }

    if (tier === 'YELLOW') {
      db.logAudit(wellbeingId, 'SAFETY_EVENT_YELLOW');
      return {
        tier: 'YELLOW',
        triggerReason: 'Elevated distress pattern',
        recommendedAction: 'OFFER_COUNSELLOR',
        crisisResources: CrisisService.getCrisisDirectory().filter(r => !r.urgent)
      };
    }

    return {
      tier: 'GREEN',
      recommendedAction: 'CONTINUE'
    };
  }
}
