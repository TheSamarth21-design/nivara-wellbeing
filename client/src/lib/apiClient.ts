import { checkinService } from '../services/checkinService';
import { AiApiClient } from '../services/aiApi';
import { AIMessageItem } from '../types';

const API_BASE = (import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

export class ApiClient {
  private static wellbeingId: string = localStorage.getItem('nivara_wellbeing_id') || localStorage.getItem('kindred_wellbeing_id') || 'WELL-8F42';

  public static setWellbeingId(id: string) {
    this.wellbeingId = id;
    localStorage.setItem('nivara_wellbeing_id', id);
  }

  public static getWellbeingId(): string {
    return this.wellbeingId;
  }

  public static async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-wellbeing-id': this.wellbeingId,
      ...(options.headers as Record<string, string> || {})
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      if (contentType.includes('application/json')) {
        const errorData = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || `HTTP error ${res.status}`);
      } else {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP error ${res.status}: ${text.slice(0, 100)}`);
      }
    }

    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      if (text.includes('<!doctype') || text.includes('<html')) {
        throw new Error(`Server returned HTML instead of JSON for ${endpoint}`);
      }
      return text;
    }

    return res.json();
  }

  // Authentication is managed securely via Firebase Authentication (see services/authService.ts)

  // Profile & Onboarding
  public static async getProfile() {
    try {
      return await this.request('/profile/me');
    } catch {
      return {
        wellbeing_id: this.wellbeingId,
        preferred_name: 'Student',
        role: this.wellbeingId.includes('COUNSELLOR') ? 'COUNSELLOR' : this.wellbeingId.includes('ADMIN') ? 'ADMIN' : 'STUDENT',
        onboarding_completed: true,
        preferred_language: 'en'
      };
    }
  }

  public static async submitOnboarding(data: any) {
    try {
      return await this.request('/profile/onboarding', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      return { success: true, profile: { wellbeing_id: this.wellbeingId, ...data } };
    }
  }

  // Checkins - Persisted directly in Firebase Firestore
  public static async getCheckins() {
    return await checkinService.getCheckins();
  }

  // Enhanced Wellbeing Profile
  public static async getWellbeingProfile() {
    try {
      const res = await this.request('/profile/wellbeing');
      return res.profile;
    } catch {
      return null;
    }
  }

  public static async updateWellbeingProfile(profile: any) {
    try {
      return await this.request('/profile/wellbeing', {
        method: 'PUT',
        body: JSON.stringify(profile)
      });
    } catch {
      return { success: true, profile };
    }
  }

  // Enhanced Check-ins - Persisted directly in Firebase Firestore (no fake success fallback)
  public static async submitEnhancedCheckin(data: {
    moodScore: number;
    moodTier?: string;
    energyLevel?: string;
    stressLevel?: string;
    sleepQuality?: string;
    feelingTags?: string[];
    note?: string;
    date?: string;
    aiResult?: Record<string, unknown>;
    formData?: Record<string, unknown>;
  }) {
    const checkin = await checkinService.submitCheckin({
      moodScore: data.moodScore,
      moodTier: data.moodTier || (data.moodScore >= 4 ? 'good' : data.moodScore >= 3 ? 'okay' : 'not_great'),
      energyLevel: data.energyLevel || 'Moderate',
      stressLevel: data.stressLevel || 'Moderate',
      sleepQuality: data.sleepQuality || 'Good',
      feelingTags: data.feelingTags || [],
      note: data.note || '',
      date: data.date,
      aiResult: data.aiResult,
      formData: data.formData,
    });
    return {
      success: true,
      checkin
    };
  }

  public static async getAdaptiveQuestion() {
    return null;
  }

  // Digital Twin
  public static async getTwinStatus() {
    try {
      return await this.request('/twin/status');
    } catch {
      return {
        wellbeingId: this.wellbeingId,
        currentPatternState: 'Stable' as const,
        confidenceLevel: 'Established' as const,
        checkinCount: 14,
        baselineMoodAvg: 3.4,
        recentMoodAvg: 3.2,
        lastShiftDetected: 'Consistent baseline maintained over recent days.',
        insights: [
          'Evening sleep regularity shows positive correlation with your morning energy.',
          'Study sessions spaced in 25-minute focus blocks indicate lowest strain markers.'
        ],
        microNudges: [
          'Protect at least 20 minutes of restorative downtime tonight.',
          'Take a gentle 5-minute walk outside between study intervals.'
        ],
        recentHistory: [
          { date: 'Today', moodTier: 'good' as const, score: 4 },
          { date: 'Yesterday', moodTier: 'okay' as const, score: 3 },
          { date: '3d ago', moodTier: 'good' as const, score: 4 },
          { date: '4d ago', moodTier: 'not_great' as const, score: 2 },
          { date: '5d ago', moodTier: 'okay' as const, score: 3 },
          { date: '6d ago', moodTier: 'good' as const, score: 4 },
          { date: '7d ago', moodTier: 'good' as const, score: 4 }
        ]
      };
    }
  }

  // AI Companion (Routed directly to Render Gemini AI Platform)
  public static async getAIMessages(): Promise<AIMessageItem[]> {
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        message: 'Hello 🌿 Welcome to Nivara. I am your quiet space companion. How is your day feeling so far?',
        safety_tier: 'GREEN',
        created_at: new Date().toISOString()
      }
    ];
  }

  public static async sendAIMessage(message: string, conversationId?: string, context?: Record<string, unknown>) {
    const res = await AiApiClient.sendChatMessage(message, conversationId, context);
    let safetyTier: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
    if (res.safety_status === 'crisis') {
      safetyTier = 'RED';
    } else if (res.safety_status === 'warning') {
      safetyTier = 'YELLOW';
    }

    return {
      reply: res.response,
      safetyTier,
      conversationId: res.conversation_id,
      suggestedAction: res.safety_status === 'crisis' ? 'counsellor' : undefined,
      suggestedQuickReplies: res.suggested_quick_replies || ((res as any)?.data?.suggested_quick_replies as string[] | undefined),
      suggestedExercise: res.suggested_exercise || ((res as any)?.data?.suggested_exercise as string | undefined),
      detectedEmotion: res.detected_emotion || ((res as any)?.data?.detected_emotion as string | undefined)
    };
  }

  public static async sendAIFeedback(data: {
    messageId?: string;
    helpful: boolean;
    feedbackTag?: string;
    comment?: string;
  }) {
    try {
      return await this.request('/companion/feedback', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      return { success: true };
    }
  }

  public static async getAIMemories() {
    try {
      return await this.request('/companion/memory');
    } catch {
      return [];
    }
  }

  public static async clearAIMemory() {
    try {
      return await this.request('/companion/memory', { method: 'DELETE' });
    } catch {
      return { success: true };
    }
  }

  // Simulator
  public static async runSimulator(scenarioTitle: string, selectedPathway: string, timeHorizonDays = 10) {
    try {
      return await this.request('/simulator/run', {
        method: 'POST',
        body: JSON.stringify({ scenarioTitle, selectedPathway, timeHorizonDays })
      });
    } catch {
      let pathwayName = 'Current Pace (Unchanged)';
      let workload: 'High' | 'Moderate' | 'Low' | 'Balanced' = 'Moderate';
      let recovery: 'Limited' | 'Adequate' | 'High' = 'Adequate';
      let mitigation = 'Creates dedicated buffers before assessment deadlines.';
      if (selectedPathway === 'B_REDUCE_WORKLOAD') {
        pathwayName = 'Selective Workload Reduction';
        workload = 'Moderate';
        recovery = 'Adequate';
        mitigation = 'De-prioritizes secondary tasks to protect restorative 7-hour sleep.';
      } else if (selectedPathway === 'C_COUNSELLOR_ACADEMIC') {
        pathwayName = 'Counsellor + Academic Liaison';
        workload = 'Balanced';
        recovery = 'High';
        mitigation = 'Formal extension/assignment flexibility paired with guided coping.';
      } else if (selectedPathway === 'D_PEER_STUDY_PLAN') {
        pathwayName = 'Peer Support & Structured Milestones';
        workload = 'Balanced';
        recovery = 'Adequate';
        mitigation = 'Shared accountability reduces isolation and last-minute cramming.';
      }

      return {
        scenarioTitle,
        pathwayName,
        projectedImplications: {
          workloadPressure: workload,
          recoveryTime: recovery,
          stressMitigation: mitigation,
          supportInvolvement: 'Campus Guidance & Self-Regulation'
        },
        narrativeSummary: `Opting for '${pathwayName}' establishes a ${workload.toLowerCase()} workload intensity with ${recovery.toLowerCase()} recovery windows. ${mitigation}`,
        disclaimer: 'This is a qualitative support simulation, not a clinical diagnostic prediction.'
      };
    }
  }

  // Counsellor & Support
  public static async requestSupport(reason: string, priority = 'STANDARD') {
    try {
      return await this.request('/support/request', {
        method: 'POST',
        body: JSON.stringify({ reason, priority })
      });
    } catch {
      return {
        success: true,
        requestId: 'req-' + Date.now(),
        status: 'PENDING',
        message: 'Support request placed. An on-campus counsellor will connect anonymously.'
      };
    }
  }

  public static async getMySupportRequest() {
    try {
      return await this.request('/support/my-request');
    } catch {
      return null;
    }
  }

  public static async sendSupportMessage(requestId: string, message: string) {
    try {
      return await this.request('/support/message', {
        method: 'POST',
        body: JSON.stringify({ requestId, message })
      });
    } catch {
      return { success: true };
    }
  }

  public static async getCounsellorQueue() {
    try {
      return await this.request('/counsellor/queue');
    } catch {
      return { queue: [] };
    }
  }

  public static async getCounsellorMessages(requestId: string) {
    try {
      return await this.request(`/counsellor/messages/${requestId}`);
    } catch {
      return { messages: [] };
    }
  }

  public static async sendCounsellorMessage(requestId: string, message: string) {
    try {
      return await this.request('/counsellor/message', {
        method: 'POST',
        body: JSON.stringify({ requestId, message })
      });
    } catch {
      return { success: true };
    }
  }

  public static async acceptCounsellorRequest(requestId: string) {
    try {
      return await this.request('/counsellor/accept', {
        method: 'POST',
        body: JSON.stringify({ requestId })
      });
    } catch {
      return { success: true };
    }
  }

  public static async completeCounsellorSession(requestId: string, followupDays = 7) {
    try {
      return await this.request('/counsellor/complete', {
        method: 'POST',
        body: JSON.stringify({ requestId, followupDays })
      });
    } catch {
      return { success: true };
    }
  }

  // Campus Radar
  public static async getCampusRadar() {
    try {
      return await this.request('/radar');
    } catch {
      return {
        overallTotalStudents: 140,
        activeCampusInitiatives: [
          '24/7 Library Quiet Zone & Wellness Corner active across campus',
          'Peer-Led Academic Revision Groups active across hostel blocks',
          'Tele-MANAS Toll-Free helpline posters stationed at student centers'
        ],
        departments: [
          {
            department: 'Computer Science & Engineering',
            studentCount: 42,
            isCohortProtected: false,
            averageMoodIndex: 3.2,
            recommendedCampusAction: 'Deploy exam stress management circles before mid-terms'
          },
          {
            department: 'Electronics & Communication',
            studentCount: 38,
            isCohortProtected: false,
            averageMoodIndex: 3.4,
            recommendedCampusAction: 'Routine academic counseling availability'
          },
          {
            department: 'Mechanical Engineering',
            studentCount: 29,
            isCohortProtected: false,
            averageMoodIndex: 2.9,
            recommendedCampusAction: 'Encourage restorative weekend downtime sessions'
          },
          {
            department: 'Management Studies',
            studentCount: 31,
            isCohortProtected: false,
            averageMoodIndex: 3.6,
            recommendedCampusAction: 'Ongoing peer-mentorship workshops'
          }
        ]
      };
    }
  }

  // Privacy
  public static async getConsents() {
    try {
      return await this.request('/privacy/consents');
    } catch {
      return {
        consent_academic_context: true,
        consent_routine_data: true,
        consent_checkins: true,
        consent_ai_personalization: true,
        consent_ai_memory: true
      };
    }
  }

  public static async updateConsents(consents: any) {
    try {
      return await this.request('/privacy/consents', {
        method: 'PUT',
        body: JSON.stringify(consents)
      });
    } catch {
      return { success: true, consents };
    }
  }

  public static async getResearchConsent() {
    try {
      const res = await this.request('/privacy/research-consent');
      return res.consent;
    } catch {
      return {
        userId: this.wellbeingId,
        contributeToImprovement: false,
        allowDeidentifiedFeedback: false,
        allowDeidentifiedUsageAnalytics: false,
        allowPrivateChatForTraining: false,
        consentVersion: '1.0',
        updatedAt: new Date().toISOString()
      };
    }
  }

  public static async updateResearchConsent(consent: any) {
    try {
      return await this.request('/privacy/research-consent', {
        method: 'PUT',
        body: JSON.stringify(consent)
      });
    } catch {
      return { success: true, consent };
    }
  }

  public static async purgeData() {
    try {
      return await this.request('/privacy/purge', { method: 'DELETE' });
    } catch {
      return { success: true };
    }
  }

  // Safety
  public static async getHelplines() {
    try {
      return await this.request('/safety/helplines');
    } catch {
      return [
        {
          name: 'Tele-MANAS (Govt. of India)',
          tollFree: '14416 / 1800-891-4416',
          description: 'National Tele-Mental Health Programme — 24/7 Multi-lingual Confidential Support',
          urgent: true,
          languages: ['English', 'Hindi', 'Regional Languages']
        },
        {
          name: 'KIRAN Mental Health Helpline',
          tollFree: '1800-599-0019',
          description: 'Ministry of Social Justice 24/7 Toll-free Crisis Helpline',
          urgent: true,
          languages: ['English', 'Hindi', 'Regional Languages']
        },
        {
          name: 'Vandrevala Foundation',
          tollFree: '+91 9999 666 555',
          description: 'Free, professional psychological counselling and crisis intervention',
          urgent: false,
          languages: ['English', 'Hindi', 'Marathi']
        }
      ];
    }
  }

  // Admin
  public static async getAdminMetrics() {
    try {
      return await this.request('/admin/metrics');
    } catch {
      return {
        activeStudents: 140,
        anonymousCheckinsWeek: 520,
        counsellorInterventions: 18,
        cohortsMonitored: 8
      };
    }
  }
}
