const API_BASE = '/api';

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

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Network request failed' }));
      throw new Error(errorData.message || `HTTP error ${res.status}`);
    }

    return res.json();
  }

  // Auth
  public static sendOtp(contact: string, type: 'email' | 'mobile' = 'email') {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ contact, type })
    });
  }

  public static verifyOtp(contact: string, otp: string, type: 'email' | 'mobile' = 'email') {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ contact, otp, type })
    });
  }

  public static demoLogin(role: 'STUDENT' | 'COUNSELLOR' | 'ADMIN') {
    return this.request('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  }

  // Profile & Onboarding
  public static getProfile() {
    return this.request('/profile/me');
  }

  public static submitOnboarding(data: any) {
    return this.request('/profile/onboarding', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Checkins
  public static getCheckins() {
    return this.request('/checkins');
  }

  public static submitCheckin(data: { moodTier: string; feelingTags?: string[]; note?: string }) {
    return this.request('/checkins', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Digital Twin
  public static getTwinStatus() {
    return this.request('/twin/status');
  }

  // AI Companion
  public static getAIMessages() {
    return this.request('/companion/messages');
  }

  public static sendAIMessage(message: string) {
    return this.request('/companion/message', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  public static getAIMemories() {
    return this.request('/companion/memory');
  }

  public static clearAIMemory() {
    return this.request('/companion/memory', { method: 'DELETE' });
  }

  // Simulator
  public static runSimulator(scenarioTitle: string, selectedPathway: string, timeHorizonDays = 10) {
    return this.request('/simulator/run', {
      method: 'POST',
      body: JSON.stringify({ scenarioTitle, selectedPathway, timeHorizonDays })
    });
  }

  // Counsellor & Support
  public static requestSupport(reason: string, priority = 'STANDARD') {
    return this.request('/support/request', {
      method: 'POST',
      body: JSON.stringify({ reason, priority })
    });
  }

  public static getMySupportRequest() {
    return this.request('/support/my-request');
  }

  public static sendSupportMessage(requestId: string, message: string) {
    return this.request('/support/message', {
      method: 'POST',
      body: JSON.stringify({ requestId, message })
    });
  }

  public static getCounsellorQueue() {
    return this.request('/counsellor/queue');
  }

  public static acceptCounsellorRequest(requestId: string) {
    return this.request('/counsellor/accept', {
      method: 'POST',
      body: JSON.stringify({ requestId })
    });
  }

  public static completeCounsellorSession(requestId: string, followupDays = 7) {
    return this.request('/counsellor/complete', {
      method: 'POST',
      body: JSON.stringify({ requestId, followupDays })
    });
  }

  // Campus Radar
  public static getCampusRadar() {
    return this.request('/radar');
  }

  // Privacy
  public static getConsents() {
    return this.request('/privacy/consents');
  }

  public static updateConsents(consents: any) {
    return this.request('/privacy/consents', {
      method: 'PUT',
      body: JSON.stringify(consents)
    });
  }

  public static purgeData() {
    return this.request('/privacy/purge', { method: 'DELETE' });
  }

  // Safety
  public static getHelplines() {
    return this.request('/safety/helplines');
  }

  // Admin
  public static getAdminMetrics() {
    return this.request('/admin/metrics');
  }
}
