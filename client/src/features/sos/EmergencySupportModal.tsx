import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  supportRequestService,
  SupportSessionType,
  JitsiJoinAuthorization
} from '../../services/supportRequestService';
import { SupportWaitingScreen } from './SupportWaitingScreen';
import { JitsiCall } from './JitsiCall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSafety?: () => void;
}

type ModalStep = 'options' | 'waiting' | 'in_call' | 'ended';

export const EmergencySupportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenSafety
}) => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();

  const [step, setStep] = useState<ModalStep>('options');
  const [selectedType, setSelectedType] = useState<SupportSessionType>('video');
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [jwtToken, setJwtToken] = useState<string>('');
  const [jitsiDomain, setJitsiDomain] = useState<string>('8x8.vc');
  const [isModerator, setIsModerator] = useState<boolean>(false);
  const [isDemoCall, setIsDemoCall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartSession = async (type: SupportSessionType) => {
    setErrorMessage(null);
    setSelectedType(type);

    if (!user) {
      setErrorMessage(
        t(
          'sos_login_required',
          'Please sign in to your Nivara student account to start an emergency audio/video session.'
        )
      );
      return;
    }

    setLoading(true);
    try {
      const studentName = profile?.name || user.displayName || 'Student';
      const created = await supportRequestService.createSupportRequest(type, studentName);
      setCurrentRequestId(created.requestId);
      setActiveRoomId(created.roomName);
      setStep('waiting');
    } catch (err: any) {
      console.error('[EmergencySupportModal] Create request error:', err);
      setErrorMessage(
        t(
          'sos_create_error',
          "We couldn't create your live session right now. Please call our demo counselor directly at 9975873744."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSessionAccepted = (joinAuth: JitsiJoinAuthorization, isDemo = false) => {
    if (!joinAuth.configured && !joinAuth.jwtToken) {
      setErrorMessage(
        joinAuth.message ||
          t(
            'sos_calling_not_configured',
            'Secure video calling is currently being configured. Please contact the counselor directly.'
          )
      );
      setStep('options');
      return;
    }
    setActiveRoomId(joinAuth.roomName);
    setJwtToken(joinAuth.jwtToken);
    setJitsiDomain(joinAuth.jitsiDomain);
    setIsModerator(joinAuth.isModerator);
    setIsDemoCall(isDemo);
    setStep('in_call');
  };

  const handleCallEnded = async () => {
    if (currentRequestId) {
      try {
        await supportRequestService.completeSupportRequest(currentRequestId);
      } catch (e) {
        console.error('Complete request error:', e);
      }
    }
    setStep('ended');
  };

  const handleResetModal = () => {
    setStep('options');
    setCurrentRequestId(null);
    setActiveRoomId(null);
    setJwtToken('');
    setIsDemoCall(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    handleResetModal();
    onClose();
  };

  // 1. In-Call View (Full Screen Jitsi Meeting)
  if (step === 'in_call' && activeRoomId) {
    return (
      <JitsiCall
        roomName={activeRoomId}
        type={selectedType}
        userName={profile?.name || user?.displayName || 'Student'}
        userEmail={user?.email || 'student@nivara.internal'}
        jwtToken={jwtToken}
        domain={jitsiDomain}
        isModerator={isModerator}
        onCallEnd={handleCallEnded}
        isDemoTest={isDemoCall}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest max-w-xl w-full rounded-3xl shadow-2xl border border-surface-variant/70 flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-surface-variant/40 flex items-start justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
              SOS
            </div>
            <div>
              <h2 className="font-headline font-bold text-xl text-on-background flex items-center gap-2">
                <span>{t('sos_modal_title', 'Emergency Support')}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider">
                  24/7
                </span>
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {t('sos_modal_subtitle', 'You are not alone. Choose how you would like to get support.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* 2. Waiting Screen View */}
        {step === 'waiting' && currentRequestId && (
          <SupportWaitingScreen
            requestId={currentRequestId}
            type={selectedType}
            studentName={profile?.name || user?.displayName || undefined}
            onAccepted={handleSessionAccepted}
            onCancelled={handleResetModal}
          />
        )}

        {/* 3. Call Ended View */}
        {step === 'ended' && (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl">
              🌿
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="font-headline font-bold text-lg text-on-background">
                {t('sos_session_ended', 'Support session ended.')}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t(
                  'sos_session_ended_desc',
                  'We hope this conversation helped bring some calm and clarity. Take your time to reflect and breathe.'
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-primary-container transition-colors"
              >
                {t('sos_return_dashboard', 'Return to Dashboard')}
              </button>
              <button
                type="button"
                onClick={handleResetModal}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-variant text-xs font-semibold text-on-surface transition-colors"
              >
                {t('sos_start_new_request', 'Start New Support Request')}
              </button>
            </div>
          </div>
        )}

        {/* 4. Options View (Default) */}
        {step === 'options' && (
          <div className="p-6 overflow-y-auto flex flex-col gap-3.5">
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-error-container/40 border border-error/40 text-xs text-on-error-container flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-error">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* OPTION 1 — DIRECT COUNSELOR CALL */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:border-primary/40 transition-all shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-container/60 text-primary flex items-center justify-center text-xl shrink-0 mt-0.5">
                  📞
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline font-bold text-sm text-on-background">
                      {t('sos_call_counselor', 'Call Counselor')}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium border border-outline-variant/40">
                      {t('sos_demo_contact_badge', 'SIH Demo Support Contact')}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                    {t(
                      'sos_call_counselor_desc',
                      'Speak directly with a counselor using the available contact number.'
                    )}
                  </p>
                  <span className="text-sm font-mono font-bold text-primary mt-1">
                    9975873744
                  </span>
                </div>
              </div>
              <a
                href="tel:9975873744"
                className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 hover:bg-primary-container transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">call</span>
                <span>{t('sos_call_now', 'Call Now')}</span>
              </a>
            </div>

            {/* OPTION 2 — AUDIO COUNSELING */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:border-primary/40 transition-all shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-xl shrink-0 mt-0.5">
                  🎙️
                </div>
                <div className="flex flex-col">
                  <h3 className="font-headline font-bold text-sm text-on-background">
                    {t('sos_audio_session', 'Audio Session')}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                    {t(
                      'sos_audio_session_desc',
                      'Connect privately with an available counselor through an audio session.'
                    )}
                  </p>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Mic Enabled • Video Off
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStartSession('audio')}
                disabled={loading}
                className="px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95 border border-outline-variant/50"
              >
                <span className="material-symbols-outlined text-sm text-emerald-600">mic</span>
                <span>{loading ? 'Initiating...' : t('sos_start_audio', 'Start Audio Call')}</span>
              </button>
            </div>

            {/* OPTION 3 — VIDEO COUNSELING */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:border-primary/40 transition-all shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center text-xl shrink-0 mt-0.5">
                  🎥
                </div>
                <div className="flex flex-col">
                  <h3 className="font-headline font-bold text-sm text-on-background">
                    {t('sos_video_session', 'Video Session')}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                    {t(
                      'sos_video_session_desc',
                      'Connect face-to-face with an available counselor through a private video session.'
                    )}
                  </p>
                  <span className="text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-1 mt-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Private Face-to-Face Room
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStartSession('video')}
                disabled={loading}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">videocam</span>
                <span>{loading ? 'Initiating...' : t('sos_start_video', 'Start Video Call')}</span>
              </button>
            </div>

            {/* OPTION 4 — IMMEDIATE EMERGENCY HELP */}
            <div className="p-4 rounded-2xl bg-error-container/20 border border-error/30 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-error-container text-error flex items-center justify-center text-xl shrink-0">
                  🚨
                </div>
                <div>
                  <h3 className="font-headline font-bold text-sm text-error">
                    {t('sos_emergency_help', 'Immediate Emergency Help')}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                    {t(
                      'sos_emergency_help_desc',
                      'If you are in immediate danger, contact emergency services immediately.'
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-surface-container-lowest border border-error/30 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-background">112</span>
                    <span className="text-[10px] text-on-surface-variant">Emergency Services</span>
                  </div>
                  <a
                    href="tel:112"
                    className="px-3 py-1.5 rounded-full bg-error text-on-error text-xs font-bold flex items-center gap-1 hover:opacity-95"
                  >
                    <span className="material-symbols-outlined text-sm">call</span>
                    112
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-lowest border border-secondary-container flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-background">Tele-MANAS</span>
                    <span className="text-[11px] text-on-surface-variant">24/7 Mental Health</span>
                  </div>
                  <a
                    href="tel:14416"
                    className="px-3 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-bold flex items-center gap-1 hover:opacity-95"
                  >
                    <span className="material-symbols-outlined text-sm">call</span>
                    14416
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
