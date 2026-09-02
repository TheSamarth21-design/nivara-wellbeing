import { v4 as uuidv4 } from 'uuid';
import { firebaseDb } from './firebaseClient.js';

export interface UserIdentity {
  id: string;
  auth_user_id: string;
  wellbeing_id: string;
  email?: string;
  mobile?: string;
  role: 'STUDENT' | 'COUNSELLOR' | 'ADMIN';
  onboarding_completed: boolean;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  wellbeing_id: string;
  preferred_name: string;
  age_range?: string;
  education_level?: string;
  year_of_study?: string;
  department?: string;
  primary_goal?: string;
  preferred_language: 'en' | 'hi' | 'mr';
}

export interface AcademicContext {
  id: string;
  wellbeing_id: string;
  current_workload: 'Low' | 'Moderate' | 'High' | 'Very high';
  upcoming_event: string;
  academic_pressure: 'Manageable' | 'A little stressful' | 'Quite stressful' | 'Very difficult';
}

export interface RoutineProfile {
  id: string;
  wellbeing_id: string;
  sleep_duration: string;
  routine_structure: string;
  study_pattern: string;
}

export interface StudentStressors {
  id: string;
  wellbeing_id: string;
  stressor_tags: string[];
  social_connection: string;
  primary_turn_to: string;
}

export interface SupportPreferences {
  id: string;
  wellbeing_id: string;
  comfortable_support_types: string[];
  response_preference: string;
}

export interface StudentConsent {
  id: string;
  wellbeing_id: string;
  consent_ai_personalization: boolean;
  consent_checkins: boolean;
  consent_academic_context: boolean;
  consent_routine_data: boolean;
  consent_counsellor_sharing: boolean;
  consent_campus_analytics: boolean;
  consent_ai_memory: boolean;
  version: number;
  updated_at: string;
}

export interface WellbeingCheckin {
  id: string;
  wellbeing_id: string;
  mood_tier: 'Great' | 'Good' | 'Okay' | 'Struggling' | 'Crisis';
  mood_score: number; // 1-5
  feeling_tags: string[];
  note?: string;
  created_at: string;
}

export interface TwinBaseline {
  id: string;
  wellbeing_id: string;
  baseline_mood_avg: number;
  checkin_count: number;
  current_pattern_state: 'Stable' | 'Changing' | 'Improving' | 'Needs Attention';
  confidence_level: 'Initial' | 'Moderate' | 'Established';
  last_shift_detected?: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  wellbeing_id: string;
  sender: 'user' | 'assistant';
  message: string;
  safety_tier: 'SAFE' | 'VULNERABLE' | 'CRISIS' | 'GREEN' | 'YELLOW' | 'RED';
  suggested_action?: string;
  created_at: string;
}

export interface AIMemoryItem {
  id: string;
  wellbeing_id: string;
  memory_key: string;
  memory_value: string;
  created_at: string;
}

export interface StudentWellbeingProfile {
  userId: string;
  preferences: {
    communicationStyle?: 'friendly' | 'calm' | 'direct' | 'motivational';
    preferredLanguage?: 'en' | 'hi' | 'mr';
    supportStyle?: 'short' | 'balanced' | 'detailed';
  };
  routine: {
    typicalSleepHours?: number | string;
    studyPattern?: string;
    dailyRoutine?: string;
  };
  wellbeingPreferences: {
    mainConcerns?: string[];
    preferredSupportMethods?: string[];
  };
  baseline: {
    initialMoodRange?: string;
    stressPattern?: string;
    energyPattern?: string;
  };
  currentContext?: {
    situation?: string;
  };
  onboardingCompleted: boolean;
  updatedAt: string;
}

export interface EnhancedWellbeingCheckin {
  id: string;
  wellbeing_id: string;
  mood_tier: string;
  mood_score: number; // 1-5
  energy_level?: 'High' | 'Normal' | 'Low' | 'Very Low';
  stress_level?: 'Low' | 'Moderate' | 'High';
  sleep_quality?: 'Good' | 'Okay' | 'Poor';
  feeling_tags: string[];
  note?: string;
  created_at: string;
}

export interface AdaptiveCheckinQuestion {
  id: string;
  trigger: 'HIGH_STRESS' | 'LOW_ENERGY' | 'POOR_SLEEP';
  question: string;
  options: string[];
}

export interface AIFeedbackItem {
  id: string;
  wellbeing_id: string;
  message_id?: string;
  helpful: boolean;
  feedback_tag?: string;
  comment?: string;
  created_at: string;
}

export interface ResearchConsent {
  userId: string;
  contributeToImprovement: boolean;
  allowDeidentifiedFeedback: boolean;
  allowDeidentifiedUsageAnalytics: boolean;
  allowPrivateChatForTraining: false;
  consentVersion: string;
  updatedAt: string;
}

export interface SupportRequest {
  id: string;
  wellbeing_id: string;
  reason: string;
  priority: 'STANDARD' | 'PRIORITY' | 'URGENT';
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'IN_SESSION' | 'RESOLVED' | 'CLOSED' | 'COMPLETED';
  counsellor_id?: string;
  assigned_counsellor_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CounsellorMessage {
  id: string;
  support_request_id: string;
  sender_role: 'student' | 'counsellor';
  message: string;
  created_at: string;
}

export interface SupportFollowup {
  id: string;
  support_request_id: string;
  wellbeing_id: string;
  scheduled_for: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  created_at: string;
}

export interface SimulationHistoryItem {
  id: string;
  wellbeing_id: string;
  scenario_title: string;
  parameters?: {
    sleep_change_hours: number;
    upcoming_exam: boolean;
    workload_multiplier: number;
    social_engagement: 'LOW' | 'NORMAL' | 'HIGH';
  };
  predicted_outcome?: {
    stress_forecast: 'Low' | 'Moderate' | 'High' | 'Severe';
    energy_trajectory: string;
    actionable_interventions: string[];
  };
  selected_pathway?: string;
  projected_implication?: string;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  wellbeing_id?: string;
  action: string;
  details?: any;
  created_at: string;
}

/**
 * Resilient In-Memory & Cloud Database Adapter for Nivara
 */
export class DatabaseAdapter {
  private users: Map<string, UserIdentity> = new Map();
  private profiles: Map<string, StudentProfile> = new Map();
  private academics: Map<string, AcademicContext> = new Map();
  private routines: Map<string, RoutineProfile> = new Map();
  private stressors: Map<string, StudentStressors> = new Map();
  private supportPrefs: Map<string, SupportPreferences> = new Map();
  private consents: Map<string, StudentConsent> = new Map();
  private checkins: WellbeingCheckin[] = [];
  private twinBaselines: Map<string, TwinBaseline> = new Map();
  private aiMessages: AIMessage[] = [];
  private aiMemories: AIMemoryItem[] = [];
  private supportRequests: Map<string, SupportRequest> = new Map();
  private counsellorMessages: CounsellorMessage[] = [];
  private followups: SupportFollowup[] = [];
  private simulations: SimulationHistoryItem[] = [];
  private auditLogs: AuditLogItem[] = [];

  // Enhanced Phase 1 Personalization & Research Collections
  private wellbeingProfiles: Map<string, StudentWellbeingProfile> = new Map();
  private enhancedCheckins: EnhancedWellbeingCheckin[] = [];
  private aiFeedbacks: AIFeedbackItem[] = [];
  private researchConsents: Map<string, ResearchConsent> = new Map();

  constructor() {
    this.seedInstitutionalAccounts();
  }

  private seedInstitutionalAccounts() {
    const counsellor: UserIdentity = {
      id: uuidv4(),
      auth_user_id: '22222222-2222-2222-2222-222222222222',
      wellbeing_id: 'COUNSELLOR-01',
      email: 'counsellor.sharma@college.edu',
      mobile: '+919988776655',
      role: 'COUNSELLOR',
      onboarding_completed: true,
      created_at: new Date().toISOString()
    };
    this.users.set(counsellor.wellbeing_id, counsellor);

    const admin: UserIdentity = {
      id: uuidv4(),
      auth_user_id: '33333333-3333-3333-3333-333333333333',
      wellbeing_id: 'ADMIN-01',
      email: 'wellbeing.director@college.edu',
      mobile: '+919123456789',
      role: 'ADMIN',
      onboarding_completed: true,
      created_at: new Date().toISOString()
    };
    this.users.set(admin.wellbeing_id, admin);
  }

  // --- Auth & Identity Separation ---
  public findUserByAuthId(authId: string): UserIdentity | undefined {
    return Array.from(this.users.values()).find(u => u.auth_user_id === authId);
  }

  public findUserByContact(contact: string): UserIdentity | undefined {
    return Array.from(this.users.values()).find(u => u.email === contact || u.mobile === contact);
  }

  public createUser(emailOrPhone: string, isMobile: boolean): UserIdentity {
    const randomHex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
    const wellbeingId = `WELL-${randomHex}`;
    const user: UserIdentity = {
      id: uuidv4(),
      auth_user_id: uuidv4(),
      wellbeing_id: wellbeingId,
      email: isMobile ? undefined : emailOrPhone,
      mobile: isMobile ? emailOrPhone : undefined,
      role: 'STUDENT',
      onboarding_completed: false,
      created_at: new Date().toISOString()
    };
    this.users.set(wellbeingId, user);

    // Default consent
    const consent: StudentConsent = {
      id: uuidv4(),
      wellbeing_id: wellbeingId,
      consent_ai_personalization: true,
      consent_checkins: true,
      consent_academic_context: true,
      consent_routine_data: true,
      consent_counsellor_sharing: true,
      consent_campus_analytics: true,
      consent_ai_memory: true,
      version: 1,
      updated_at: new Date().toISOString()
    };
    this.consents.set(wellbeingId, consent);

    // Cold Start Twin Baseline
    const twin: TwinBaseline = {
      id: uuidv4(),
      wellbeing_id: wellbeingId,
      baseline_mood_avg: 3.0,
      checkin_count: 0,
      current_pattern_state: 'Stable',
      confidence_level: 'Initial',
      last_shift_detected: 'Getting to know your natural daily baseline',
      updated_at: new Date().toISOString()
    };
    this.twinBaselines.set(wellbeingId, twin);

    this.logAudit(wellbeingId, 'USER_REGISTERED', { isMobile });
    return user;
  }

  public completeOnboarding(wellbeingId: string): void {
    const user = this.users.get(wellbeingId);
    if (user) {
      user.onboarding_completed = true;
      this.logAudit(wellbeingId, 'ONBOARDING_COMPLETED');
    }
  }

  // --- Profile & Context ---
  public getProfile(wellbeingId: string): StudentProfile | undefined {
    return this.profiles.get(wellbeingId);
  }

  public saveProfile(profile: StudentProfile): void {
    this.profiles.set(profile.wellbeing_id, profile);
    this.logAudit(profile.wellbeing_id, 'PROFILE_UPDATED');
  }

  public getAcademicContext(wellbeingId: string): AcademicContext | undefined {
    return this.academics.get(wellbeingId);
  }

  public saveAcademicContext(ctx: AcademicContext): void {
    this.academics.set(ctx.wellbeing_id, ctx);
  }

  public getRoutineProfile(wellbeingId: string): RoutineProfile | undefined {
    return this.routines.get(wellbeingId);
  }

  public saveRoutineProfile(routine: RoutineProfile): void {
    this.routines.set(routine.wellbeing_id, routine);
  }

  public getStressors(wellbeingId: string): StudentStressors | undefined {
    return this.stressors.get(wellbeingId);
  }

  public saveStressors(stressors: StudentStressors): void {
    this.stressors.set(stressors.wellbeing_id, stressors);
  }

  public getSupportPreferences(wellbeingId: string): SupportPreferences | undefined {
    return this.supportPrefs.get(wellbeingId);
  }

  public saveSupportPreferences(prefs: SupportPreferences): void {
    this.supportPrefs.set(prefs.wellbeing_id, prefs);
  }

  public getConsents(wellbeingId: string): StudentConsent | undefined {
    return this.consents.get(wellbeingId);
  }

  public saveConsents(consent: StudentConsent): void {
    this.consents.set(consent.wellbeing_id, consent);
    this.logAudit(consent.wellbeing_id, 'CONSENT_UPDATED', { version: consent.version });
  }

  // --- Checkins ---
  public getCheckins(wellbeingId: string, limit = 30): WellbeingCheckin[] {
    return this.checkins
      .filter(c => c.wellbeing_id === wellbeingId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  public addCheckin(checkin: Omit<WellbeingCheckin, 'id' | 'created_at'>): WellbeingCheckin {
    const item: WellbeingCheckin = {
      ...checkin,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    this.checkins.unshift(item);
    this.logAudit(checkin.wellbeing_id, 'CHECKIN_RECORDED', { mood: checkin.mood_tier });
    return item;
  }

  // --- Digital Twin ---
  public getTwinBaseline(wellbeingId: string): TwinBaseline | undefined {
    return this.twinBaselines.get(wellbeingId);
  }

  public updateTwinBaseline(baseline: TwinBaseline): void {
    this.twinBaselines.set(baseline.wellbeing_id, baseline);
  }

  // --- AI Companion & Memory ---
  public getAIMessages(wellbeingId: string, limit = 50): AIMessage[] {
    return this.aiMessages
      .filter(m => m.wellbeing_id === wellbeingId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-limit);
  }

  public addAIMessage(msg: Omit<AIMessage, 'id' | 'created_at'>): AIMessage {
    const item: AIMessage = {
      ...msg,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    this.aiMessages.push(item);
    return item;
  }

  public getAIMemories(wellbeingId: string): AIMemoryItem[] {
    return this.aiMemories.filter(m => m.wellbeing_id === wellbeingId);
  }

  public addAIMemory(wellbeingId: string, key: string, value: string): AIMemoryItem {
    const item: AIMemoryItem = {
      id: uuidv4(),
      wellbeing_id: wellbeingId,
      memory_key: key,
      memory_value: value,
      created_at: new Date().toISOString()
    };
    this.aiMemories.push(item);
    this.logAudit(wellbeingId, 'AI_MEMORY_ADDED', { key });
    return item;
  }

  public deleteAIMemory(wellbeingId: string, id: string): boolean {
    const idx = this.aiMemories.findIndex(m => m.id === id && m.wellbeing_id === wellbeingId);
    if (idx !== -1) {
      this.aiMemories.splice(idx, 1);
      this.logAudit(wellbeingId, 'AI_MEMORY_DELETED', { id });
      return true;
    }
    return false;
  }

  public clearAIMemory(wellbeingId: string): void {
    this.aiMemories = this.aiMemories.filter(m => m.wellbeing_id !== wellbeingId);
    this.logAudit(wellbeingId, 'AI_MEMORY_CLEARED');
  }

  // --- Support Requests & Counsellor ---
  public createSupportRequest(wellbeingId: string, reason: string, priority: 'STANDARD' | 'PRIORITY' | 'URGENT' = 'STANDARD'): SupportRequest {
    const req: SupportRequest = {
      id: uuidv4(),
      wellbeing_id: wellbeingId,
      reason,
      priority,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.supportRequests.set(req.id, req);
    this.logAudit(wellbeingId, 'SUPPORT_REQUESTED', { priority });
    return req;
  }

  public getSupportRequests(): SupportRequest[] {
    return Array.from(this.supportRequests.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getSupportRequestById(id: string): SupportRequest | undefined {
    return this.supportRequests.get(id);
  }

  public updateSupportRequest(id: string, updates: Partial<SupportRequest>): SupportRequest | undefined {
    const req = this.supportRequests.get(id);
    if (req) {
      Object.assign(req, updates, { updated_at: new Date().toISOString() });
      this.logAudit(req.wellbeing_id, 'SUPPORT_STATUS_UPDATED', { status: req.status });
      return req;
    }
    return undefined;
  }

  public getCounsellorMessages(requestId: string): CounsellorMessage[] {
    return this.counsellorMessages.filter(m => m.support_request_id === requestId);
  }

  public addCounsellorMessage(requestId: string, role: 'student' | 'counsellor', message: string): CounsellorMessage {
    const item: CounsellorMessage = {
      id: uuidv4(),
      support_request_id: requestId,
      sender_role: role,
      message,
      created_at: new Date().toISOString()
    };
    this.counsellorMessages.push(item);
    return item;
  }

  public createFollowup(requestId: string, wellbeingId: string, scheduledFor: string, notes?: string): SupportFollowup {
    const item: SupportFollowup = {
      id: uuidv4(),
      support_request_id: requestId,
      wellbeing_id: wellbeingId,
      scheduled_for: scheduledFor,
      status: 'SCHEDULED',
      notes,
      created_at: new Date().toISOString()
    };
    this.followups.push(item);
    this.logAudit(wellbeingId, 'FOLLOWUP_SCHEDULED', { scheduledFor });
    return item;
  }

  public getFollowups(wellbeingId?: string): SupportFollowup[] {
    if (wellbeingId) {
      return this.followups.filter(f => f.wellbeing_id === wellbeingId);
    }
    return this.followups;
  }

  // --- What-if Simulations ---
  public saveSimulation(item: Omit<SimulationHistoryItem, 'id' | 'created_at'>): SimulationHistoryItem {
    const entry: SimulationHistoryItem = {
      ...item,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    this.simulations.push(entry);
    this.logAudit(item.wellbeing_id, 'SIMULATION_SAVED', { scenario: item.scenario_title });
    return entry;
  }

  public getSimulations(wellbeingId: string): SimulationHistoryItem[] {
    return this.simulations.filter(s => s.wellbeing_id === wellbeingId);
  }

  // --- Campus Radar ---
  public getAllProfilesForRadar(): StudentProfile[] {
    return Array.from(this.profiles.values());
  }

  public getAllCheckinsForRadar(): WellbeingCheckin[] {
    return this.checkins;
  }

  public getAllAcademicsForRadar(): AcademicContext[] {
    return Array.from(this.academics.values());
  }

  // --- Data Export & Wipe ---
  public exportUserData(wellbeingId: string): any {
    const profile = this.profiles.get(wellbeingId);
    const academics = this.academics.get(wellbeingId);
    const routine = this.routines.get(wellbeingId);
    const stressors = this.stressors.get(wellbeingId);
    const supportPrefs = this.supportPrefs.get(wellbeingId);
    const consents = this.consents.get(wellbeingId);
    const checkins = this.getCheckins(wellbeingId, 1000);
    const twin = this.twinBaselines.get(wellbeingId);
    const memories = this.getAIMemories(wellbeingId);
    const simulations = this.getSimulations(wellbeingId);

    this.logAudit(wellbeingId, 'DATA_EXPORTED');

    return {
      export_version: '1.0',
      exported_at: new Date().toISOString(),
      wellbeing_identity: wellbeingId,
      profile,
      academic_context: academics,
      routine_profile: routine,
      stressors,
      support_preferences: supportPrefs,
      consents,
      checkins,
      digital_twin: twin,
      ai_memory: memories,
      simulations
    };
  }

  public purgeUserData(wellbeingId: string): boolean {
    this.users.delete(wellbeingId);
    this.profiles.delete(wellbeingId);
    this.academics.delete(wellbeingId);
    this.routines.delete(wellbeingId);
    this.stressors.delete(wellbeingId);
    this.supportPrefs.delete(wellbeingId);
    this.consents.delete(wellbeingId);
    this.twinBaselines.delete(wellbeingId);
    this.checkins = this.checkins.filter(c => c.wellbeing_id !== wellbeingId);
    this.aiMessages = this.aiMessages.filter(m => m.wellbeing_id !== wellbeingId);
    this.aiMemories = this.aiMemories.filter(m => m.wellbeing_id !== wellbeingId);
    this.simulations = this.simulations.filter(s => s.wellbeing_id !== wellbeingId);
    this.followups = this.followups.filter(f => f.wellbeing_id !== wellbeingId);
    this.wellbeingProfiles.delete(wellbeingId);
    this.enhancedCheckins = this.enhancedCheckins.filter(c => c.wellbeing_id !== wellbeingId);
    this.aiFeedbacks = this.aiFeedbacks.filter(f => f.wellbeing_id !== wellbeingId);
    this.researchConsents.delete(wellbeingId);

    this.logAudit(wellbeingId, 'USER_DATA_PURGED');
    return true;
  }

  // --- Enhanced Phase 1 Personalization Methods ---
  public getWellbeingProfile(wellbeingId: string): StudentWellbeingProfile | undefined {
    return this.wellbeingProfiles.get(wellbeingId);
  }

  public saveWellbeingProfile(profile: StudentWellbeingProfile): void {
    this.wellbeingProfiles.set(profile.userId, profile);
    this.logAudit(profile.userId, 'WELLBEING_PROFILE_SAVED');
  }

  public addEnhancedCheckin(checkin: Omit<EnhancedWellbeingCheckin, 'id' | 'created_at'>): EnhancedWellbeingCheckin {
    const item: EnhancedWellbeingCheckin = {
      ...checkin,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    this.enhancedCheckins.unshift(item);

    // Also mirror to legacy checkins array so Digital Twin & Campus Radar work seamlessly
    const legacyTier = checkin.mood_score >= 4 ? 'Good' : checkin.mood_score === 3 ? 'Okay' : checkin.mood_score === 2 ? 'Struggling' : 'Crisis';
    this.addCheckin({
      wellbeing_id: checkin.wellbeing_id,
      mood_tier: legacyTier as any,
      mood_score: checkin.mood_score,
      feeling_tags: checkin.feeling_tags,
      note: checkin.note
    });

    this.logAudit(checkin.wellbeing_id, 'ENHANCED_CHECKIN_RECORDED', {
      mood: checkin.mood_tier,
      stress: checkin.stress_level,
      energy: checkin.energy_level
    });

    return item;
  }

  public getEnhancedCheckins(wellbeingId: string, limit = 30): EnhancedWellbeingCheckin[] {
    return this.enhancedCheckins
      .filter(c => c.wellbeing_id === wellbeingId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  public getAdaptiveQuestion(wellbeingId: string): AdaptiveCheckinQuestion | null {
    const recent = this.getEnhancedCheckins(wellbeingId, 1);
    if (!recent || recent.length === 0) return null;

    const latest = recent[0];

    // High stress trigger
    if (latest.stress_level === 'High' || latest.mood_score <= 2) {
      return {
        id: `adaptive-stress-${latest.id}`,
        trigger: 'HIGH_STRESS',
        question: 'Would you like to tell me what is contributing most to your stress right now?',
        options: ['Exams', 'Workload', 'Personal life', 'Relationships', 'Something else', 'Prefer not to say']
      };
    }

    // Poor sleep trigger
    if (latest.sleep_quality === 'Poor') {
      return {
        id: `adaptive-sleep-${latest.id}`,
        trigger: 'POOR_SLEEP',
        question: 'Has something specific been interrupting your rest recently?',
        options: ['Late studying', 'Racing thoughts', 'Hostel noise', 'Screen time', 'Prefer not to say']
      };
    }

    // Very low energy trigger
    if (latest.energy_level === 'Very Low') {
      return {
        id: `adaptive-energy-${latest.id}`,
        trigger: 'LOW_ENERGY',
        question: 'When your energy feels depleted, what gives you the gentlest reset?',
        options: ['Quiet rest', 'Short walk', 'Music / podcast', 'Talking to a friend', 'Prefer not to say']
      };
    }

    return null;
  }

  // --- AI Response Feedback ---
  public addAIFeedback(feedback: Omit<AIFeedbackItem, 'id' | 'created_at'>): AIFeedbackItem {
    const item: AIFeedbackItem = {
      ...feedback,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    this.aiFeedbacks.push(item);
    this.logAudit(feedback.wellbeing_id, 'AI_FEEDBACK_RECORDED', { helpful: feedback.helpful });
    return item;
  }

  public getAIFeedbacks(): AIFeedbackItem[] {
    return this.aiFeedbacks;
  }

  // --- Privacy-First Research & Model Improvement Consent ---
  public getResearchConsent(userId: string): ResearchConsent {
    const existing = this.researchConsents.get(userId);
    if (existing) return existing;

    // Strict default: OFF for all data improvement, and training is always strictly false
    const defaultConsent: ResearchConsent = {
      userId,
      contributeToImprovement: false,
      allowDeidentifiedFeedback: false,
      allowDeidentifiedUsageAnalytics: false,
      allowPrivateChatForTraining: false,
      consentVersion: '1.0',
      updatedAt: new Date().toISOString()
    };
    this.researchConsents.set(userId, defaultConsent);
    return defaultConsent;
  }

  public saveResearchConsent(consent: ResearchConsent): void {
    // Strictly enforce allowPrivateChatForTraining is false
    const sanitized: ResearchConsent = {
      ...consent,
      allowPrivateChatForTraining: false,
      updatedAt: new Date().toISOString()
    };
    this.researchConsents.set(consent.userId, sanitized);
    this.logAudit(consent.userId, 'RESEARCH_CONSENT_UPDATED', {
      contribute: sanitized.contributeToImprovement
    });
  }

  public logAudit(wellbeingId: string | undefined, action: string, details?: any): void {
    const item: AuditLogItem = {
      id: uuidv4(),
      wellbeing_id: wellbeingId,
      action,
      details,
      created_at: new Date().toISOString()
    };
    this.auditLogs.push(item);
  }

  public getAuditLogs(): AuditLogItem[] {
    return this.auditLogs;
  }
}

export const db = new DatabaseAdapter();
export const dbAdapter = db;
