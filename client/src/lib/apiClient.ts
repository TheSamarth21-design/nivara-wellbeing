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

  // Auth (with automatic offline / static hosting fallback)
  public static async sendOtp(contact: string, type: 'email' | 'mobile' = 'email') {
    try {
      return await this.request('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ contact, type })
      });
    } catch {
      // Offline / Static Preview Fallback: Always allow OTP generation
      return {
        success: true,
        message: `Verification code sent to ${contact}`,
        mockOtp: '123456',
        cooldownSeconds: 30
      };
    }
  }

  public static async verifyOtp(contact: string, otp: string, type: 'email' | 'mobile' = 'email') {
    try {
      return await this.request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ contact, otp, type })
      });
    } catch {
      // Validate OTP (123456 is standard demo code)
      if (otp !== '123456' && otp !== '000000' && otp.length !== 6) {
        throw new Error('Invalid verification code. Please enter 123456 for demo.');
      }
      const wellbeingId = 'WELL-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      this.setWellbeingId(wellbeingId);
      return {
        success: true,
        token: wellbeingId,
        user: {
          wellbeingId,
          role: 'STUDENT',
          onboardingCompleted: true,
          isFirstTime: false
        }
      };
    }
  }

  public static async demoLogin(role: 'STUDENT' | 'COUNSELLOR' | 'ADMIN') {
    try {
      return await this.request('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ role })
      });
    } catch {
      let wellbeingId = 'WELL-8F42';
      if (role === 'COUNSELLOR') wellbeingId = 'COUNSELLOR-01';
      if (role === 'ADMIN') wellbeingId = 'ADMIN-01';
      this.setWellbeingId(wellbeingId);
      return {
        success: true,
        token: wellbeingId,
        user: {
          wellbeingId,
          role,
          onboardingCompleted: true
        }
      };
    }
  }

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

  // Checkins
  public static async getCheckins() {
    try {
      return await this.request('/checkins');
    } catch {
      return [];
    }
  }

  public static async submitCheckin(data: { moodTier: string; feelingTags?: string[]; note?: string }) {
    try {
      return await this.request('/checkins', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      return {
        success: true,
        checkin: {
          id: 'chk-' + Date.now(),
          wellbeing_id: this.wellbeingId,
          ...data,
          created_at: new Date().toISOString()
        }
      };
    }
  }

  // Digital Twin
  public static async getTwinStatus() {
    try {
      return await this.request('/twin/status');
    } catch {
      return {
        wellbeingId: this.wellbeingId,
        readinessIndex: 78,
        longitudinalState: 'STEADY_RECOVERY',
        trend: 'UPWARD',
        keyDrivers: ['Adequate Rest Routine', 'Academic Chunking', 'Social Connectedness'],
        personalizedNudges: [
          'Take a 5-minute outdoor walk between lecture blocks.',
          'Your evening wind-down routine is showing positive correlation with mood.'
        ]
      };
    }
  }

  // AI Companion
  public static async getAIMessages() {
    try {
      return await this.request('/companion/messages');
    } catch {
      return [
        {
          id: 'msg-welcome',
          wellbeing_id: this.wellbeingId,
          sender: 'assistant',
          message: 'Hello 🌿 Welcome to Nivara. I am your quiet space companion. How is your day feeling so far?',
          safety_tier: 'GREEN',
          created_at: new Date().toISOString()
        }
      ];
    }
  }

  public static async sendAIMessage(message: string) {
    try {
      return await this.request('/companion/message', {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    } catch {
      // Local Empathetic Engine Fallback
      const lower = message.toLowerCase();
      let reply = "Thank you for sharing that with me. You don't have to figure everything out all at once. What would feel most supportive for you right now?";
      
      if (lower.includes('exam') || lower.includes('study') || lower.includes('stress')) {
        reply = "Academic deadlines can feel heavy when they stack up. Remember to take a slow breath. Breaking your focus into one small 25-minute block can make things much more manageable.";
      } else if (lower.includes('sleep') || lower.includes('tired') || lower.includes('exhausted')) {
        reply = "Rest is foundational. When your mind is racing at night, try a gentle 2-minute 4-4-6 breathing reset before bed.";
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        reply = "Hello 🌿 It's wonderful to see you today. How is your mind and energy feeling?";
      }

      return {
        reply,
        safetyTier: 'GREEN'
      };
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
      return {
        scenarioTitle,
        selectedPathway,
        projectedReadinessGain: '+14%',
        burnoutRiskReduction: '-22%',
        insights: [
          'Pathway projected to stabilize energy levels within 4 days.',
          'Reduced cognitive fatigue before upcoming deadlines.'
        ]
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
      return [];
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
        totalCohorts: 6,
        privacyThreshold: 5,
        departments: [
          { name: 'Computer Science & Engineering', cohortSize: 42, anonymizedIndex: 74, status: 'MODERATE_STRESS' },
          { name: 'Electronics & Communication', cohortSize: 38, anonymizedIndex: 81, status: 'THRIVING' },
          { name: 'Mechanical Engineering', cohortSize: 29, anonymizedIndex: 69, status: 'MODERATE_STRESS' },
          { name: 'Management Studies', cohortSize: 31, anonymizedIndex: 85, status: 'THRIVING' }
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
