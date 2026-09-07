import { auth } from '../config/firebase';
import {
  AiApiStatus,
  AiErrorCategory,
  AiServiceError,
  GenericApiResponse,
  StudentStressAssessmentRequest,
  StudentStressAssessmentResponse,
  WellbeingSummarySharePayload,
  AiChatRequest,
  AiChatResponse
} from '../types/ai';

/**
 * Nivara AI Platform URL
 *
 * Production:
 * Uses VITE_AI_API_URL from Vercel environment variables.
 *
 * Local development:
 * Falls back to the deployed Render backend.
 */
const RAW_AI_BASE =
  import.meta.env.VITE_AI_API_URL ||
  'https://nivara-ai-platform.onrender.com';

const AI_BASE_URL = RAW_AI_BASE.replace(/\/+$/, '');

export class AiApiClient {
  /**
   * Render free instances can take time to wake up after inactivity.
   * 60 seconds gives the backend enough time to start.
   */
  private static readonly DEFAULT_TIMEOUT_MS = 60000;

  /**
   * Get Firebase authentication token.
   *
   * Production:
   * Uses the real Firebase ID token.
   *
   * Development:
   * Falls back to a development token only when running locally.
   */
  public static async getAuthToken(): Promise<string | null> {
    try {
      if (typeof auth.authStateReady === 'function') {
        await auth.authStateReady();
      }
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();

        if (token) {
          return token;
        }
      }
    } catch (err) {
      console.warn(
        '[AiApiClient] Could not retrieve Firebase ID token:',
        err
      );
    }

    return null;
  }

  /**
   * Generic HTTP request handler.
   *
   * Features:
   * - Authentication
   * - Timeout handling
   * - JSON parsing
   * - Error categorization
   * - Render cold-start support
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs = this.DEFAULT_TIMEOUT_MS
  ): Promise<T> {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const token = await this.getAuthToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {})
      };

      /**
       * Add Firebase authentication token when available.
       */
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const cleanEndpoint = endpoint.startsWith('/')
        ? endpoint
        : `/${endpoint}`;

      const url = `${AI_BASE_URL}${cleanEndpoint}`;

      console.log('[AiApiClient] Request:', url);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      const contentType =
        response.headers.get('content-type') || '';

      let body: any = null;

      if (contentType.includes('application/json')) {
        body = await response.json().catch(() => null);
      } else {
        const text = await response.text().catch(() => '');

        body = {
          message: text
        };
      }

      if (!response.ok) {
        let category: AiErrorCategory = 'SERVER_ERROR';

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          category = 'UNAUTHORIZED';
        } else if (
          response.status === 400 ||
          response.status === 422
        ) {
          category = 'VALIDATION_ERROR';
        } else if (response.status >= 500) {
          category = 'SERVER_ERROR';
        }

        const message =
          body?.detail ||
          body?.error?.message ||
          body?.message ||
          `AI service returned HTTP ${response.status}`;

        const error: AiServiceError = {
          category,
          message:
            typeof message === 'string'
              ? message
              : JSON.stringify(message),
          statusCode: response.status,
          details: body
        };

        console.error(
          '[AiApiClient] API Error:',
          error
        );

        throw error;
      }

      return body as T;
    } catch (err: any) {
      /**
       * Preserve already categorized API errors.
       */
      if (err?.category) {
        throw err;
      }

      /**
       * Request timeout.
       */
      if (err?.name === 'AbortError') {
        const timeoutError: AiServiceError = {
          category: 'TIMEOUT',
          message:
            'The AI service took too long to respond. Please try again.',
          details: err
        };

        throw timeoutError;
      }

      console.error(
        '[AiApiClient] Connection Error:',
        err
      );

      /**
       * Network / CORS / unreachable backend.
       */
      const offlineError: AiServiceError = {
        category: 'OFFLINE',
        message:
          'AI wellbeing service is currently offline or unreachable.',
        details: err
      };

      throw offlineError;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Check whether the Nivara AI backend is online.
   */
  public static async checkHealth(): Promise<AiApiStatus> {
    try {
      const response =
        await this.request<
          GenericApiResponse<{
            status: string;
          }>
        >(
          '/api/v1/health',
          {
            method: 'GET'
          },
          10000
        );

      /**
       * Expected backend response:
       *
       * {
       *   success: true,
       *   data: {
       *     status: "healthy"
       *   }
       * }
       */
      if (
        response?.data?.status === 'healthy'
      ) {
        return 'ONLINE';
      }

      return 'DEGRADED';
    } catch (err: any) {
      console.warn(
        '[AiApiClient] Health check failed:',
        err
      );

      if (
        err?.category === 'OFFLINE' ||
        err?.category === 'TIMEOUT'
      ) {
        return 'OFFLINE';
      }

      return 'DEGRADED';
    }
  }

  /**
   * Submit the student's wellbeing questionnaire
   * to the AI Stress Prediction Model.
   *
   * Endpoint:
   *
   * POST
   * /api/v1/ai/wellbeing/stress
   */
  public static async assessStress(
    payload: StudentStressAssessmentRequest
  ): Promise<StudentStressAssessmentResponse> {
    console.log(
      '[AiApiClient] Sending stress assessment'
    );

    const response =
      await this.request<
        GenericApiResponse<StudentStressAssessmentResponse>
      >(
        '/api/v1/ai/wellbeing/stress',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        60000
      );

    if (!response?.data) {
      const error: AiServiceError = {
        category: 'SERVER_ERROR',
        message:
          'The AI model returned an empty response.',
        details: response
      };

      throw error;
    }

    console.log(
      '[AiApiClient] Stress assessment successful:',
      response.data
    );

    return response.data;
  }

  /**
   * Share a wellbeing summary with a counselor
   * after student consent.
   */
  public static async shareSummaryWithCounselor(
    summary: WellbeingSummarySharePayload
  ): Promise<{
    success: boolean;
    confirmation_id: string;
    message: string;
  }> {
    try {
      const response =
        await this.request<
          GenericApiResponse<any>
        >(
          '/api/v1/wellbeing/consent',
          {
            method: 'POST',
            body: JSON.stringify({
              professional_id:
                'usr_counselor_campus',

              consent_type:
                'wellbeing_report_sharing',

              scope:
                summary.consent_scopes?.[0] ||
                'share_wellbeing_summary'
            })
          },
          30000
        );

      const confirmationId =
        response?.data?.consent_id ||
        `BRIDGE-CONF-${Date.now()
          .toString(36)
          .toUpperCase()}`;

      return {
        success: true,

        confirmation_id:
          confirmationId,

        message:
          'Wellbeing summary successfully authorized for counselor review.'
      };
    } catch (error) {
      console.warn(
        '[AiApiClient] Counselor API unavailable. Saving locally.'
      );

      /**
       * Local fallback.
       */
      const localId =
        `LOCAL-CONSENT-${Date.now()
          .toString(36)
          .toUpperCase()}`;

      try {
        const existing = JSON.parse(
          localStorage.getItem(
            'nivara_shared_summaries'
          ) || '[]'
        );

        existing.unshift({
          ...summary,

          confirmation_id: localId,

          shared_at:
            new Date().toISOString()
        });

        /**
         * Keep only the latest 10 summaries.
         */
        localStorage.setItem(
          'nivara_shared_summaries',
          JSON.stringify(
            existing.slice(0, 10)
          )
        );
      } catch (storageError) {
        console.error(
          '[AiApiClient] Local storage failed:',
          storageError
        );
      }

      return {
        success: true,

        confirmation_id: localId,

        message:
          'Consent registered locally. The summary can sync during the next counselor consultation.'
      };
    }
  }

  /**
   * Send chat message to the Render Gemini AI Platform.
   *
   * Endpoint: POST /api/v1/ai/chat
   * URL: ${VITE_AI_API_URL}/api/v1/ai/chat
   */
  public static async sendChatMessage(
    message: string,
    conversationId?: string
  ): Promise<AiChatResponse> {
    const cleanEndpoint = '/api/v1/ai/chat';
    const url = `${AI_BASE_URL}${cleanEndpoint}`;

    // Debugging Step 1: Log the API request URL
    console.log('[Nivara Chat] Request URL:', url);

    const token = await this.getAuthToken();
    if (!token) {
      console.error('[Nivara Chat] Authentication failed: No Firebase user ID token available.');
      throw new Error('Please sign in to chat with your Nivara wellbeing companion.');
    }

    const payload: AiChatRequest = {
      message: message.trim(),
      ...(conversationId ? { conversation_id: conversationId } : {})
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      // Debugging Step 2: Log the HTTP response status
      console.log('[Nivara Chat] HTTP Status:', response.status);

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
      } else {
        const text = await response.text().catch(() => '');
        data = { message: text };
      }

      // Debugging Step 3: Log the complete backend response
      console.log('[Nivara Chat] Backend Response:', data);

      if (!response.ok) {
        const errorMsg =
          data?.error?.message ||
          data?.detail ||
          data?.message ||
          `Chat API error: HTTP ${response.status}`;
        console.error('[Nivara Chat] Backend error response:', errorMsg, data);
        throw new Error(errorMsg);
      }

      // Handle backend response format: direct fields or nested data
      const assistantText: string =
        data?.response ||
        data?.data?.response ||
        data?.reply ||
        '';

      // Debugging Step 4: Confirm that the displayed message comes specifically from response.response
      console.log('[Nivara Chat] Displayed Message (response.response):', assistantText);

      const result: AiChatResponse = {
        success: data?.success ?? true,
        response: assistantText,
        conversation_id: data?.conversation_id || data?.data?.conversation_id || conversationId || '',
        domain: data?.domain || data?.data?.domain || 'student_wellbeing',
        safety_status: data?.safety_status || data?.data?.safety_status || 'normal',
        ...data
      };

      if (!result.response) {
        throw new Error('The AI companion returned an empty response.');
      }

      return result;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.error('[Nivara Chat] Request timed out after', this.DEFAULT_TIMEOUT_MS, 'ms');
        throw new Error('The AI companion took too long to respond. Please try again.');
      }
      console.error('[Nivara Chat] Error during chat request:', err);
      throw err;
    } finally {
      clearTimeout(timeoutTimer);
    }
  }
}