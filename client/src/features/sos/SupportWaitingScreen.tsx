import React, { useState, useEffect } from 'react';
import {
  supportRequestService,
  SupportRequestDoc,
  SupportSessionType,
  JitsiJoinAuthorization
} from '../../services/supportRequestService';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  requestId: string;
  type: SupportSessionType;
  studentName?: string;
  onAccepted: (joinAuth: JitsiJoinAuthorization, isDemo?: boolean) => void;
  onCancelled: () => void;
}

export const SupportWaitingScreen: React.FC<Props> = ({
  requestId,
  type,
  onAccepted,
  onCancelled
}) => {
  const { t } = useLanguage();
  const [request, setRequest] = useState<SupportRequestDoc | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Real-time Firestore listener
  useEffect(() => {
    let hasTriggeredJoin = false;

    const unsubscribe = supportRequestService.listenToSupportRequest(
      requestId,
      async (data) => {
        if (!data) return;
        setRequest(data);

        // When counselor accepts or call becomes active
        if ((data.status === 'accepted' || data.status === 'active') && data.roomName && !hasTriggeredJoin) {
          hasTriggeredJoin = true;
          setIsConnecting(true);

          try {
            // Automatically request Jitsi JWT token from backend /api/v1/support/:requestId/join
            const joinAuth = await supportRequestService.getJoinAuthorization(
              data.requestId,
              data.roomName,
              data.callType,
              false
            );

            // Mark call as active in Firestore
            await supportRequestService.markCallActive(data.requestId);

            // Enter meeting
            onAccepted(joinAuth, false);
          } catch (err: any) {
            console.error('[SupportWaitingScreen] Error retrieving Jitsi token:', err);
            setJoinError(
              t(
                'sos_token_error',
                'Unable to generate secure video session token. Please try again or contact our crisis line.'
              )
            );
            setIsConnecting(false);
          }
        } else if (data.status === 'cancelled') {
          onCancelled();
        }
      },
      (error) => {
        console.error('[SupportWaitingScreen] Firestore listener error:', error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [requestId, onAccepted, onCancelled, t]);

  // Elapsed waiting timer (60s soft timer)
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= 60 && !isTimedOut) {
          setIsTimedOut(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimedOut]);

  const formatSeconds = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await supportRequestService.cancelSupportRequest(requestId);
    } catch (e) {
      console.error('Cancel request error:', e);
    } finally {
      setCancelling(false);
      onCancelled();
    }
  };

  const handleSimulateCounselorConnect = async () => {
    setSimulating(true);
    try {
      await supportRequestService.simulateCounselorAccept(requestId);
    } catch (e) {
      console.error('Error simulating counselor:', e);
    } finally {
      setSimulating(false);
    }
  };

  const isAudio = type === 'audio';

  // Connecting State: Counselor accepted, requesting JWT from backend
  if (isConnecting) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center gap-5 min-h-[360px] animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-3xl">
          <span className="material-symbols-outlined animate-spin text-3xl">sync</span>
        </div>
        <div className="flex flex-col gap-1.5 max-w-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {t('sos_connection_accepted', 'Counselor Accepted')}
          </span>
          <h3 className="font-headline font-bold text-lg sm:text-xl text-on-background">
            {t('sos_counselor_accepted_connecting', 'Counselor accepted your request. Connecting securely...')}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
            {t('sos_preparing_call', 'Authorizing your private 8x8 JaaS session token and entering room.')}
          </p>
        </div>
      </div>
    );
  }

  // Counselor Declined or Token Error State
  if (request?.status === 'declined' || joinError) {
    return (
      <div className="p-6 sm:p-8 flex flex-col gap-5 animate-fadeIn">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shrink-0">
            <span className="material-symbols-outlined">person_off</span>
          </div>
          <div className="flex flex-col">
            <h3 className="font-headline font-bold text-base sm:text-lg text-on-background">
              {joinError
                ? t('sos_session_error_title', 'Session Connection Notice')
                : t('sos_counselor_declined_title', 'Counselor is currently unavailable')}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              {joinError ||
                t(
                  'sos_counselor_unavailable_desc',
                  'All campus counselors are currently in active sessions. You can reach out directly using the helpline contacts below.'
                )}
            </p>
          </div>
        </div>

        {/* Immediate Direct Contact Option */}
        <div className="p-4 rounded-2xl bg-surface-container border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/60 text-primary flex items-center justify-center text-xl shrink-0">
              📞
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface">
                {t('sos_call_counselor', 'Emergency Counselor Line')}
              </span>
              <span className="text-xs font-mono font-bold text-primary">
                9975873744
              </span>
              <span className="text-[10px] text-on-surface-variant">
                {t('sos_demo_contact_badge', 'NIVARA Campus Duty Counselor')}
              </span>
            </div>
          </div>
          <a
            href="tel:9975873744"
            className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">call</span>
            <span>{t('sos_call_now', 'Call Now')}</span>
          </a>
        </div>

        {/* Emergency Helplines Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            href="tel:112"
            className="p-3 rounded-xl bg-error-container/20 border border-error/30 flex items-center justify-between text-xs hover:bg-error-container/30 transition-colors"
          >
            <div className="flex flex-col">
              <span className="font-bold text-error">112</span>
              <span className="text-[10px] text-on-surface-variant">National Emergency Services</span>
            </div>
            <span className="material-symbols-outlined text-sm text-error">call</span>
          </a>

          <a
            href="tel:14416"
            className="p-3 rounded-xl bg-secondary-container/20 border border-secondary-container/40 flex items-center justify-between text-xs hover:bg-secondary-container/30 transition-colors"
          >
            <div className="flex flex-col">
              <span className="font-bold text-secondary">14416</span>
              <span className="text-[10px] text-on-surface-variant">Tele-MANAS Mental Health</span>
            </div>
            <span className="material-symbols-outlined text-sm text-secondary">call</span>
          </a>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant/40">
          <button
            type="button"
            onClick={onCancelled}
            className="px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-variant text-xs font-semibold text-on-surface transition-colors"
          >
            {t('sos_return_dashboard', 'Return to Dashboard')}
          </button>
        </div>
      </div>
    );
  }

  // Active Waiting Screen
  return (
    <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-6 min-h-[360px] animate-fadeIn">
      {/* Animated Pulse Ring Indicator */}
      <div className="relative flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-rose-500/15 animate-ping absolute" />
        <div className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center text-2xl shadow-lg relative z-10">
          <span className="material-symbols-outlined text-3xl animate-pulse">
            {isAudio ? 'mic' : 'videocam'}
          </span>
        </div>
      </div>

      {/* Required Status Headings */}
      <div className="flex flex-col gap-1.5 max-w-sm">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400">
          {isAudio ? t('sos_audio_session', 'Confidential Audio Call') : t('sos_video_session', 'Confidential Video Call')}
        </span>
        <h3 className="font-headline font-bold text-lg sm:text-xl text-on-background">
          {t('sos_waiting_counselor', 'Your support request has been sent.')}
        </h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          {t('sos_waiting_counselor_desc', 'Waiting for an available counselor...')}
        </p>
      </div>

      {/* Live elapsed waiting time */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-xs font-mono text-on-surface">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>Elapsed Waiting Time: {formatSeconds(elapsedSeconds)}</span>
      </div>

      {/* Privacy Notice */}
      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[11px] text-on-surface-variant max-w-md flex items-center gap-2">
        <span className="material-symbols-outlined text-sm text-primary">lock</span>
        <span>
          {t('sos_privacy_notice', 'Your session is encrypted and securely routed through private 8x8 JaaS.')}
        </span>
      </div>

      {/* Prototype Testing Trigger */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={handleSimulateCounselorConnect}
          disabled={simulating}
          className="text-xs text-primary/80 hover:text-primary font-medium underline flex items-center gap-1"
        >
          <span>{simulating ? 'Simulating Counselor...' : 'Prototype Demo: Simulate Counselor Acceptance'}</span>
        </button>
      </div>

      {/* Cancel Request Button */}
      <div className="w-full flex items-center justify-center pt-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelling}
          className="px-6 py-2.5 rounded-full bg-surface-container hover:bg-surface-variant text-xs font-semibold text-on-surface transition-all active:scale-95 border border-outline-variant/40"
        >
          {cancelling ? 'Cancelling...' : t('sos_cancel_request', 'Cancel Request')}
        </button>
      </div>
    </div>
  );
};
