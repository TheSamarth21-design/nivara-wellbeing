import React, { useState, useEffect } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  roomName: string;
  type: 'audio' | 'video';
  userName?: string;
  onCallEnd: () => void;
  isDemoTest?: boolean;
}

export const JitsiCall: React.FC<Props> = ({
  roomName,
  type,
  userName = 'Student',
  onCallEnd,
  isDemoTest = false
}) => {
  const { t } = useLanguage();
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [apiInstance, setApiInstance] = useState<any>(null);

  // Session duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isAudioOnly = type === 'audio';
  const title = isAudioOnly
    ? t('sos_audio_session_title', 'NIVARA Audio Support Session')
    : t('sos_video_session_title', 'NIVARA Video Support Session');

  const handleHangup = () => {
    if (apiInstance) {
      try {
        apiInstance.executeCommand('hangup');
      } catch {}
    }
    onCallEnd();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1410] text-white flex flex-col">
      {/* Call Header Bar */}
      <div className="px-4 py-3 bg-[#131f18] border-b border-[#21352a] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
            isAudioOnly ? 'bg-emerald-800 text-emerald-300' : 'bg-rose-900 text-rose-300'
          }`}>
            <span className="material-symbols-outlined text-lg">
              {isAudioOnly ? 'mic' : 'videocam'}
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-headline font-semibold text-sm sm:text-base text-white">
                {title}
              </h2>
              {isDemoTest && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                  SIH Demo
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-emerald-400">lock</span>
                {t('sos_confidential_badge', 'Confidential Support')}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] font-mono text-zinc-300">
                {formatDuration(sessionSeconds)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleHangup}
            className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            title={t('sos_leave_call', 'Leave Call')}
          >
            <span className="material-symbols-outlined text-base">call_end</span>
            <span className="hidden sm:inline">{t('sos_leave_call', 'Leave Call')}</span>
          </button>
        </div>
      </div>

      {/* Jitsi Meeting Viewport */}
      <div className="flex-1 w-full h-full relative bg-[#0b120e]">
        {loadError ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto gap-4">
            <div className="w-14 h-14 rounded-full bg-red-900/40 text-red-400 flex items-center justify-center text-3xl">
              <span className="material-symbols-outlined">error</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              {t('sos_call_error_title', 'Session Connection Error')}
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {loadError}
            </p>
            <div className="p-3.5 rounded-2xl bg-[#16231b] border border-[#273d2f] text-left w-full text-xs">
              <p className="text-zinc-400 mb-1 font-medium">Alternative Contact:</p>
              <a
                href="tel:9975873744"
                className="text-emerald-400 font-bold text-sm hover:underline flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">call</span>
                9975873744 (SIH Demo Counselor)
              </a>
            </div>
            <button
              onClick={onCallEnd}
              className="px-5 py-2.5 rounded-full bg-zinc-700 hover:bg-zinc-600 text-xs font-semibold text-white transition-colors"
            >
              {t('sos_return_dashboard', 'Return to Dashboard')}
            </button>
          </div>
        ) : (
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={roomName}
            configOverwrite={{
              startWithAudioMuted: false,
              startWithVideoMuted: isAudioOnly,
              disableVideo: isAudioOnly,
              prejoinPageEnabled: false,
              disableDeepLinking: true,
              enableWelcomePage: false,
              enableClosePage: false,
              disableRemoteMute: false,
              toolbarButtons: isAudioOnly
                ? [
                    'microphone',
                    'hangup',
                    'tileview',
                    'chat',
                    'raisehand',
                    'settings'
                  ]
                : [
                    'camera',
                    'microphone',
                    'hangup',
                    'tileview',
                    'chat',
                    'raisehand',
                    'settings'
                  ]
            }}
            interfaceConfigOverwrite={{
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              SHOW_POWERED_BY: false,
              DEFAULT_BACKGROUND: '#0b120e',
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
            }}
            userInfo={{
              displayName: userName || 'Student',
              email: 'student@nivara.internal'
            }}
            onApiReady={(externalApi) => {
              setApiInstance(externalApi);
              externalApi.on('videoConferenceLeft', () => {
                onCallEnd();
              });
              externalApi.on('readyToClose', () => {
                onCallEnd();
              });
            }}
            onReadyToClose={() => {
              onCallEnd();
            }}
            spinner={() => (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b120e]">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <span className="text-xs text-zinc-400 font-medium">
                  {t('sos_connecting_session', 'Connecting to secure support room...')}
                </span>
              </div>
            )}
            getIFrameRef={(iframeRef) => {
              if (iframeRef) {
                iframeRef.style.height = '100%';
                iframeRef.style.width = '100%';
                iframeRef.style.border = 'none';
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
