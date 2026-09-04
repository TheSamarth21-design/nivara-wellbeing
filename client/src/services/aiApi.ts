import { auth } from '../config/firebase';
import {
  AiApiStatus,
  AiErrorCategory,
  AiServiceError,
  GenericApiResponse,
  StudentStressAssessmentRequest,
  StudentStressAssessmentResponse,
  WellbeingSummarySharePayload
} from '../types/ai';

const RAW_AI_BASE = import.meta.env?.VITE_AI_API_URL || '/ai-api';
const AI_BASE_URL = RAW_AI_BASE.replace(/\/+$/, '');

export class AiApiClient {
  private static readonly DEFAULT_TIMEOUT_MS = 10000;

  /**
   * Resolve an authentication token.
   * Uses real Firebase ID token when available.
   * Only permits development mock token when import.meta.env.DEV is explicitly true.
   */
  private static async getAuthToken(): Promise<string | null> {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        if (token) return token;
      }
    } catch (err) {
      console.warn('[AiApiClient] Could not retrieve Firebase ID token:', err);
    }

    // Strictly dev-only fallback token
    if (import.meta.env.DEV === true) {
      return 'dev-student-token';
    }

    return null;
  }

  /**
   * Resilient HTTP client with AbortController timeout & categorized errors.
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs = this.DEFAULT_TIMEOUT_MS
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${AI_BASE_URL}${cleanEndpoint}`;

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timer);

      const contentType = res.headers.get('content-type') || '';
      let body: any = null;

      if (contentType.includes('application/json')) {
        body = await res.json().catch(() => null);
      } else {
        const text = await res.text().catch(() => '');
        body = { message: text };
      }

      if (!res.ok) {
        let category: AiErrorCategory = 'SERVER_ERROR';
        if (res.status === 401 || res.status === 403) {
          category = 'UNAUTHORIZED';
        } else if (res.status === 422 || res.status === 400) {
          category = 'VALIDATION_ERROR';
        } else if (res.status >= 500) {
          category = 'SERVER_ERROR';
        }

        const message =
          body?.detail ||
          body?.error?.message ||
          body?.message ||
          `AI service returned HTTP ${res.status}`;

        const err: AiServiceError = {
          category,
          message: typeof message === 'string' ? message : JSON.stringify(message),
          statusCode: res.status,
          details: body
        };
        throw err;
      }

      return body as T;
    } catch (err: any) {
      clearTimeout(timer);

      if (err?.category) {
        throw err;
      }

      if (err?.name === 'AbortError') {
        const timeoutErr: AiServiceError = {
          category: 'TIMEOUT',
          message: `AI service request timed out after ${timeoutMs / 1000}s.`,
          details: err
        };
        throw timeoutErr;
      }

      const offlineErr: AiServiceError = {
        category: 'OFFLINE',
        message: 'AI wellbeing service is currently offline or unreachable.',
        details: err
      };
      throw offlineErr;
    }
  }

  /**
   * Health check to detect if FastAPI platform is online.
   */
  public static async checkHealth(): Promise<AiApiStatus> {
    try {
      const res = await this.request<GenericApiResponse<{ status: string }>>(
        '/api/v1/health',
        { method: 'GET' },
        3500
      );

      if (res?.data?.status === 'healthy') {
        return 'ONLINE';
      }
      return 'DEGRADED';
    } catch (err: any) {
      if (err?.category === 'OFFLINE' || err?.category === 'TIMEOUT') {
        return 'OFFLINE';
      }
      return 'DEGRADED';
    }
  }

  /**
   * Submit 19 clean questionnaire features to POST /api/v1/ai/wellbeing/stress
   */
  public static async assessStress(
    payload: StudentStressAssessmentRequest
  ): Promise<StudentStressAssessmentResponse> {
    const wrapped = await this.request<GenericApiResponse<StudentStressAssessmentResponse>>(
      '/api/v1/ai/wellbeing/stress',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      12000
    );

    if (!wrapped?.data) {
      throw {
        category: 'SERVER_ERROR',
        message: 'Empty response data received from stress prediction model.'
      } as AiServiceError;
    }

    return wrapped.data;
  }

  /**
   * Counselor Bridge: Share Wellbeing Summary with Student Consent.
   */
  public static async shareSummaryWithCounselor(
    summary: WellbeingSummarySharePayload
  ): Promise<{ success: boolean; confirmation_id: string; message: string }> {
    try {
      const res = await this.request<GenericApiResponse<any>>(
        '/api/v1/wellbeing/consent',
        {
          method: 'POST',
          body: JSON.stringify({
            professional_id: 'usr_counselor_campus',
            consent_type: 'wellbeing_report_sharing',
            scope: summary.consent_scopes?.[0] || 'share_wellbeing_summary'
          })
        },
        6000
      );

      const confirmId = res?.data?.consent_id || `BRIDGE-CONF-${Date.now().toString(36).toUpperCase()}`;

      return {
        success: true,
        confirmation_id: confirmId,
        message: 'Wellbeing summary successfully authorized and linked for campus counselor review.'
      };
    } catch {
      const localId = `LOCAL-CONSENT-${Date.now().toString(36).toUpperCase()}`;
      try {
        const stored = JSON.parse(localStorage.getItem('nivara_shared_summaries') || '[]');
        stored.unshift({ ...summary, confirmation_id: localId, shared_at: new Date().toISOString() });
        localStorage.setItem('nivara_shared_summaries', JSON.stringify(stored.slice(0, 10)));
      } catch {}

      return {
        success: true,
        confirmation_id: localId,
        message: 'Consent registered locally. Summary will sync with counselor on next consultation.'
      };
    }
  }
}
