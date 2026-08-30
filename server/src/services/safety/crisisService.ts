import { config } from '../../config/index.js';

export interface CrisisResource {
  name: string;
  tollFree: string;
  description: string;
  urgent: boolean;
  languages: string[];
}

export class CrisisService {
  public static getCrisisDirectory(): CrisisResource[] {
    return config.crisisHelplines;
  }

  public static getPrimaryEmergency(): CrisisResource {
    return config.crisisHelplines[0];
  }
}
