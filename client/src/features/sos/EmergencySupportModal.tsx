import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  supportRequestService,
  SupportSessionType
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
      setCurrentRequestId(created.id);
      setActiveRoomId(created.roomId);
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

  const handleSessionAccepted = (roomId: string, isDemo = false) => {
    setActiveRoomId(roomId);
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
        onCallEnd={handleCallEnded}
        isDemoTest={isDemoCall}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest max-w-xl w-full rounded-3xl p-6 shadow-2xl border border-error-container/60 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center text-2xl shadow-sm shrink-0">
              <span className="material-symbols-outlined text-2xl text-error">emergency</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-bold text-xl text-on-background">
                  {t('sos_emergency_title', 'Emergency Support')}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-error/15 text-error font-bold uppercase tracking-wider">
                  24/7 SOS
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                {t('sos_emergency_subtitle', 'You are not alone. Choose how you would like to get support.')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-error-container/30 border border-error/30 text-xs text-on-error-container flex items-start gap-2.5 animate-fadeIn">
            <span className="material-symbols-outlined text-sm text-error shrink-0 mt-0.5">error</span>
            <div className="flex-1">
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Step: Waiting Screen */}
        {step === 'waiting' && currentRequestId && (
          <SupportWaitingScreen
            requestId={currentRequestId}
            type={selectedType}
            studentName={profile?.name || user?.displayName || 'Student'}
            onAccepted={handleSessionAccepted}
            onCancelled={handleResetModal}
          />
        )}

        {/* Step: Call Ended Screen */}
        {step === 'ended' && (
          <div className="p-8 flex flex-col items-center text-center gap-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-3xl">
              🌿
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="font-headline font-bold text-xl text-on-background">
                {t('sos_session_ended_title', 'Support session ended.')}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t(
                  'sos_session_ended_desc',
                  'We hope this session felt supportive. Remember, campus counselors and emergency helplines are always here for you.'
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-sm"
              >
                {t('sos_return_dashboard', 'Return to Dashboard')}
              </button>
              <button
                type="button"
                onClick={handleResetModal}
                className="px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold transition-colors"
              >
                {t('sos_new_request', 'Start New Support Request')}
              </button>
            </div>
          </div>
        )}

        {/* Step: 4 Support Options */}
        {step === 'options' && (
          <div className="flex flex-col gap-3.5">
            {/* OPTION 1 — DIRECT COUNSELOR CALL */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:border-primary/40 transition-all shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0 mt-0.5">
                  📞
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-headline font-bold text-sm text-on-background">
                      {t('sos_call_counselor', 'Call Counselor')}
                    </h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">
                      {t('sos_demo_label', 'SIH Demo Support Contact')}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                    {t(
                      'sos_call_counselor_desc',
                      'Speak directly with a counselor using the available contact number.'
                    )}
                  </p>
                  <span className="text-xs font-mono font-bold text-primary mt-1">
                    9975873744
                  </span>
                </div>
              </div>
              <a
                href="tel:9975873744"
                className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary-container shrink-0 transition-all active:scale-95 shadow-sm"
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
                    <span className="text-[11px] text-on-surface-variant">Emergency Services</span>
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
