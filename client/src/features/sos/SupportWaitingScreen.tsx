import React, { useState, useEffect } from 'react';
import { supportRequestService, SupportRequestDoc, SupportSessionType } from '../../services/supportRequestService';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  requestId: string;
  type: SupportSessionType;
  studentName?: string;
  onAccepted: (roomName: string, isDemo?: boolean) => void;
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
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Real-time Firestore listener
  useEffect(() => {
    const unsubscribe = supportRequestService.listenToSupportRequest(
      requestId,
      (data) => {
        if (!data) return;
        setRequest(data);

        if (data.status === 'accepted' && data.roomId) {
          onAccepted(data.roomId, false);
        } else if (data.status === 'cancelled') {
          onCancelled();
        }
      },
      (error) => {
        console.error('[SupportWaitingScreen] Firestore listener error:', error);
        setPermissionError(
          t(
            'sos_permission_fallback',
            "We couldn't connect your live session right now. Please use the direct counselor contact option below."
          )
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [requestId, onAccepted, onCancelled, t]);

  // Elapsed waiting timer; show counselor unavailable after 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= 30 && !isTimedOut) {
          setIsTimedOut(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimedOut]);

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
      if (request?.roomId) {
        onAccepted(request.roomId, true);
      }
    } catch (e) {
      console.error('Error simulating counselor:', e);
    } finally {
      setSimulating(false);
    }
  };

  const isAudio = type === 'audio';

  // Counselor Declined or Timed Out State
  if (request?.status === 'declined' || isTimedOut || permissionError) {
    return (
      <div className="p-6 flex flex-col items-center text-center gap-5 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center text-3xl">
          <span className="material-symbols-outlined text-3xl">support_agent</span>
        </div>

        <div className="flex flex-col gap-1.5 max-w-md">
          <h3 className="font-headline font-bold text-lg text-on-background">
            {t('sos_counselor_unavailable_title', 'Counselor connection is currently unavailable')}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {permissionError ||
              (request?.declineReason
                ? request.declineReason
                : t(
                    'sos_counselor_unavailable_desc',
                    'All campus counselors are currently in active sessions. You can reach out directly via phone or access 24/7 national emergency helplines below.'
                  ))}
          </p>
        </div>

        {/* Alternative 1: Direct Call Counselor */}
        <div className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/50 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0">
              📞
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-on-background">
                  {t('sos_call_counselor', 'Call Counselor')}
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold uppercase">
                  {t('sos_demo_label', 'SIH Demo Support Contact')}
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-primary mt-0.5">9975873744</p>
            </div>
          </div>
          <a
            href="tel:9975873744"
            className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary-container transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">call</span>
            <span>{t('sos_call_now', 'Call Now')}</span>
          </a>
        </div>

        {/* Alternative 2: Emergency Helplines */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-error-container/25 border border-error/30 flex items-center justify-between">
            <div>
              <span className="font-semibold text-xs text-on-background">112 — Emergency</span>
              <p className="text-[11px] text-on-surface-variant">Police / Medical / Crisis</p>
            </div>
            <a
              href="tel:112"
              className="px-3 py-1.5 rounded-full bg-error text-on-error text-xs font-bold"
            >
              112
            </a>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary-container/30 border border-secondary-container flex items-center justify-between">
            <div>
              <span className="font-semibold text-xs text-on-background">Tele-MANAS</span>
              <p className="text-[11px] text-on-surface-variant">24/7 Mental Health Toll-Free</p>
            </div>
            <a
              href="tel:14416"
              className="px-3 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-bold"
            >
              14416
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2 w-full">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold transition-colors"
          >
            {t('sos_return_options', 'Back to Support Options')}
          </button>

          {/* SIH Demo Testing Trigger */}
          <button
            type="button"
            onClick={handleSimulateCounselorConnect}
            disabled={simulating}
            className="px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            title="SIH Demo: Simulate an available counselor joining the call"
          >
            <span className="material-symbols-outlined text-sm">science</span>
            <span>{simulating ? 'Connecting...' : 'SIH Demo: Join Test Room'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Pending Waiting State
  return (
    <div className="p-8 flex flex-col items-center text-center gap-6 animate-fadeIn">
      {/* Pulsing Ripple Effect */}
      <div className="relative flex items-center justify-center w-24 h-24">
        <div className="absolute w-24 h-24 rounded-full bg-primary/20 animate-ping" />
        <div className="absolute w-20 h-20 rounded-full bg-primary/30 animate-pulse" />
        <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center text-3xl shadow-lg relative z-10">
          <span className="material-symbols-outlined text-3xl">
            {isAudio ? 'mic' : 'videocam'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 max-w-sm">
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {isAudio ? '🎙️ Audio Support Requested' : '🎥 Video Support Requested'}
        </span>
        <h3 className="font-headline font-bold text-xl text-on-background">
          {t('sos_finding_support', 'Finding available support...')}
        </h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          {t(
            'sos_waiting_counselor_desc',
            'Waiting for an available counselor to accept your private session. Please keep this screen open.'
          )}
        </p>
      </div>

      {/* Progress & Info Badge */}
      <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-on-surface">
            Status: <strong className="text-primary capitalize">{request?.status || 'Pending'}</strong>
          </span>
        </div>
        <span className="text-outline-variant">•</span>
        <span className="font-mono text-on-surface-variant">
          Waiting: {elapsedSeconds}s
        </span>
      </div>

      {/* SIH Demo Testing Box */}
      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 max-w-md w-full">
        <span className="text-[11px] font-medium text-center sm:text-left">
          💡 <strong>SIH Demo Note:</strong> If testing without a live counselor, you can trigger counselor acceptance immediately:
        </span>
        <button
          type="button"
          onClick={handleSimulateCounselorConnect}
          disabled={simulating}
          className="px-3.5 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold shrink-0 shadow-sm transition-all"
        >
          {simulating ? 'Connecting...' : 'Simulate Accept'}
        </button>
      </div>

      {/* Cancel Request Button */}
      <button
        type="button"
        onClick={handleCancel}
        disabled={cancelling}
        className="px-6 py-2.5 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-sm">close</span>
        <span>{cancelling ? 'Cancelling...' : t('sos_cancel_request', 'Cancel Request')}</span>
      </button>
    </div>
  );
};
