import React, { useState, useEffect, useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useLanguage } from '../../context/LanguageContext';
import { supportRequestService } from '../../services/supportRequestService';

export interface JitsiCallProps {
  requestId?: string;
  roomName: string;
  callType?: 'audio' | 'video';
  type?: 'audio' | 'video'; // backward compatibility
  userName?: string;
  userEmail?: string;
  jwtToken?: string;
  domain?: string;
  isModerator?: boolean;
  onCallEnd: () => void;
  isDemoTest?: boolean;
}

const DEFAULT_JAAS_APP_ID = 'vpaas-magic-cookie-fa2e5fd198d04fdca12c4b95aa4ba3e3';

export const JitsiCall: React.FC<JitsiCallProps> = ({
  requestId,
  roomName,
  callType,
  type,
  userName = 'Student',
  userEmail = 'support@nivara.internal',
  jwtToken,
  domain,
  isModerator = false,
  onCallEnd,
  isDemoTest = false
}) => {
  const { t } = useLanguage();
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [apiInstance, setApiInstance] = useState<any>(null);

  // Audio/Video control states
  const effectiveType = callType || type || 'video';
  const isAudioOnly = effectiveType === 'audio';

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(isAudioOnly);

  // 1. Session duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Browser Device Permission Check
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      const constraints = isAudioOnly
        ? { audio: true }
        : { audio: true, video: true };

      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          // Clean up the temporary probe tracks
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch((err: any) => {
          console.warn('[JitsiCall] Media devices permission note:', err?.name);
          if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
            setDeviceError(
              t(
                'sos_permission_denied',
                'Microphone or camera permission was blocked. Please click the camera/lock icon in your browser address bar and choose "Allow".'
              )
            );
          }
        });
    }
  }, [isAudioOnly, t]);

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const title = isAudioOnly
    ? t('sos_audio_session_title', 'NIVARA Confidential Audio Support')
    : t('sos_video_session_title', 'NIVARA Confidential Video Support');

  // Enforce production 8x8 JaaS domain — do NOT fallback to public meet.jit.si
  const effectiveDomain = domain && domain.includes('8x8.vc') ? domain : '8x8.vc';

  // Format full room name according to 8x8 JaaS requirements: vpaas-magic-cookie-XXX/<cleanRoom>
  const resolvedRoomName = React.useMemo(() => {
    if (roomName.startsWith('vpaas-magic-cookie-')) {
      return roomName;
    }
    const clean = roomName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    return `${DEFAULT_JAAS_APP_ID}/${clean}`;
  }, [roomName]);

  // Handle local mute/unmute toggles through Jitsi External API
  const handleToggleAudio = () => {
    if (apiInstance) {
      try {
        apiInstance.executeCommand('toggleAudio');
      } catch (e) {
        console.error('Toggle audio error:', e);
      }
    }
  };

  const handleToggleVideo = () => {
    if (apiInstance) {
      try {
        apiInstance.executeCommand('toggleVideo');
      } catch (e) {
        console.error('Toggle video error:', e);
      }
    }
  };

  const handleHangup = () => {
    if (apiInstance) {
      try {
        apiInstance.executeCommand('hangup');
      } catch {}
    }
    if (requestId) {
      supportRequestService.completeSupportRequest(requestId).catch(() => {});
    }
    onCallEnd();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b120e] text-white flex flex-col select-none">
      {/* Call Header Bar */}
      <div className="px-4 py-3 bg-[#121c16] border-b border-[#1e2f25] flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${
              isAudioOnly
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                : 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {isAudioOnly ? 'mic' : 'videocam'}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-headline font-bold text-sm sm:text-base text-white tracking-tight">
                {title}
              </h2>
              {isModerator && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider">
                  Counselor (Moderator)
                </span>
              )}
              {isDemoTest && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
                  SIH Demo
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-zinc-300 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-xs text-emerald-400">lock</span>
                {t('sos_confidential_badge', 'Private 8x8 JaaS Session')}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] font-mono text-emerald-300 font-semibold">
                {formatDuration(sessionSeconds)}
              </span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="text-[11px] text-zinc-400 hidden sm:inline">
                {userName}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isAudioMuted
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
            title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            <span className="material-symbols-outlined text-lg">
              {isAudioMuted ? 'mic_off' : 'mic'}
            </span>
          </button>

          {/* Video toggle (enabled for video calls) */}
          {!isAudioOnly && (
            <button
              type="button"
              onClick={handleToggleVideo}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isVideoMuted
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
              }`}
              title={isVideoMuted ? 'Enable camera' : 'Disable camera'}
            >
              <span className="material-symbols-outlined text-lg">
                {isVideoMuted ? 'videocam_off' : 'videocam'}
              </span>
            </button>
          )}

          {/* Hangup button */}
          <button
            type="button"
            onClick={handleHangup}
            className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all ml-1"
            title={t('sos_leave_call', 'End Call')}
          >
            <span className="material-symbols-outlined text-base">call_end</span>
            <span className="hidden sm:inline">{t('sos_leave_call', 'End Call')}</span>
          </button>
        </div>
      </div>

      {/* Permission Warning Banner */}
      {deviceError && (
        <div className="px-4 py-2 bg-amber-500/20 border-b border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-amber-400">warning</span>
            <span>{deviceError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeviceError(null)}
            className="text-amber-300 hover:text-white text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Jitsi Meeting Viewport */}
      <div className="flex-1 w-full h-full relative bg-[#0b120e]">
        {loadError ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto gap-4 animate-fadeIn">
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
                9975873744 (Emergency Support Contact)
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
            domain={effectiveDomain}
            roomName={resolvedRoomName}
            jwt={jwtToken || undefined}
            configOverwrite={{
              startWithAudioMuted: false,
              startWithVideoMuted: isAudioOnly,
              disableVideo: isAudioOnly,
              prejoinPageEnabled: false,
              disableDeepLinking: true,
              enableWelcomePage: false,
              enableClosePage: false,
              disableRemoteMute: false,
              enableLobby: false,
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
              displayName: userName,
              email: userEmail
            }}
            onApiReady={(externalApi) => {
              setApiInstance(externalApi);

              externalApi.on('videoConferenceLeft', () => {
                onCallEnd();
              });

              externalApi.on('readyToClose', () => {
                onCallEnd();
              });

              externalApi.on('audioMuteStatusChanged', (event: any) => {
                setIsAudioMuted(Boolean(event?.muted));
              });

              externalApi.on('videoMuteStatusChanged', (event: any) => {
                setIsVideoMuted(Boolean(event?.muted));
              });

              externalApi.on('participantRoleChanged', (event: any) => {
                console.log('[JitsiCall] 8x8 JaaS participant role changed:', event);
              });
            }}
            onReadyToClose={() => {
              onCallEnd();
            }}
            spinner={() => (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b120e]">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <span className="text-xs text-emerald-300 font-medium tracking-wide">
                  {t('sos_connecting_session', 'Connecting securely to 8x8 JaaS private room...')}
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
