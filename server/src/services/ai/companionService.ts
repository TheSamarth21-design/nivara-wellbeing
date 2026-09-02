import { CompanionReply } from '../../types';
import { NivaraAgent } from './nivaraAgent.js';

export class CompanionService {
  public static async processUserMessage(
    wellbeingId: string,
    message: string,
    _context?: any
  ): Promise<CompanionReply> {
    return await NivaraAgent.processMessage(wellbeingId, message);
  }
}
