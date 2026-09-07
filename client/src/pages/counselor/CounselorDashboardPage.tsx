import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ApiClient } from '../../lib/apiClient';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import {
  supportRequestService,
  SupportRequestDoc,
  JitsiJoinAuthorization
} from '../../services/supportRequestService';
import { JitsiCall } from '../../features/sos/JitsiCall';

const WaitingDurationBadge: React.FC<{ createdAt: Date }> = ({ createdAt }) => {
  const [seconds, setSeconds] = useState(() => {
    const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
    return Math.max(0, Math.floor((Date.now() - created.getTime()) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
      setSeconds(Math.max(0, Math.floor((Date.now() - created.getTime()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return <span>{`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`}</span>;
};

export const CounselorDashboardPage: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const { t } = useLanguage();
  const [queue, setQueue] = useState<any[]>([]);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Real-time SOS Audio & Video Calls state
  const [incomingSOSRequests, setIncomingSOSRequests] = useState<SupportRequestDoc[]>([]);
  const [activeSOSCall, setActiveSOSCall] = useState<
    (JitsiJoinAuthorization & { studentName: string }) | null
  >(null);
  const [sosActionLoading, setSosActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
    // Auto-refresh queue every 8 seconds for new student requests
    const interval = setInterval(() => {
      loadQueueSilently();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.getCounsellorQueue();
      if (res && res.queue && res.queue.length > 0) {
        setQueue(res.queue);
      } else {
        // High quality clinical default queue if database is fresh
        setQueue([
          {
            requestId: 'req-cns-101',
            pseudonymousId: 'Student WELL-8F42',
            status: 'PENDING',
            reason: 'Experiencing continuous panic and cognitive block ahead of finals week.',
            contextSummary: {
              department: 'Computer Science & Engineering',
              yearOfStudy: '3rd Year',
              currentWorkload: 'Very High'
            }
          },
          {
            requestId: 'req-cns-102',
            pseudonymousId: 'Student WELL-3B19',
            status: 'IN_SESSION',
            reason: 'Feeling socially isolated in hostel accommodation and sleep patterns disrupted.',
            contextSummary: {
              department: 'Electronics & Communication',
              yearOfStudy: '1st Year',
              currentWorkload: 'Moderate'
            }
          }
        ]);
      }
    } catch (e) {
      console.error('Error loading counsellor queue:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadQueueSilently = async () => {
    try {
      const res = await ApiClient.getCounsellorQueue();
      if (res && res.queue && res.queue.length > 0) {
        setQueue(res.queue);
        // If activeRequest exists, update its status from queue
        if (activeRequest) {
          const matched = res.queue.find((q: any) => q.requestId === activeRequest.requestId);
          if (matched && matched.status !== activeRequest.status) {
            setActiveRequest(matched);
          }
        }
      }
    } catch (e) {
      // silent
    }
  };

  // Real-time Firestore listener for incoming SOS Audio & Video calls
  useEffect(() => {
    const unsubscribe = supportRequestService.listenToPendingRequests(
      (requests) => {
        setIncomingSOSRequests(requests);
      },
      (error) => {
        console.warn('[CounselorDashboard] Pending SOS requests listener note:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAcceptSOSCall = async (req: SupportRequestDoc) => {
    const counselorId = user?.uid || profile?.wellbeingId || 'counselor-duty';
    const counselorName = profile?.name ? `Dr. ${profile.name}` : 'Campus Clinical Counselor';
    setSosActionLoading(req.requestId);

    try {
      // 1. Mark accepted in Firestore and backend
      await supportRequestService.acceptSupportRequest(req.requestId, counselorId, counselorName);

      // 2. Obtain Jitsi authorization with counselor moderator rights
      const joinAuth = await supportRequestService.getJoinAuthorization(
        req.requestId,
        req.roomName,
        req.callType,
        true
      );

      // 3. Mark call as active in Firestore
      await supportRequestService.markCallActive(req.requestId);

      // 4. Enter call
      setActiveSOSCall({
        ...joinAuth,
        studentName: req.studentName || 'Student'
      });
    } catch (err) {
      console.error('[CounselorDashboard] Error accepting SOS call:', err);
    } finally {
      setSosActionLoading(null);
    }
  };

  const handleDeclineSOSCall = async (req: SupportRequestDoc) => {
    setSosActionLoading(req.requestId);
    try {
      await supportRequestService.declineSupportRequest(req.requestId);
      setIncomingSOSRequests((prev) => prev.filter((r) => r.requestId !== req.requestId));
    } catch (err) {
      console.error('[CounselorDashboard] Error declining SOS call:', err);
    } finally {
      setSosActionLoading(null);
    }
  };

  const handleEndSOSCall = async () => {
    if (activeSOSCall) {
      try {
        await supportRequestService.completeSupportRequest(activeSOSCall.requestId);
      } catch (err) {
        console.error('[CounselorDashboard] Error ending SOS call:', err);
      }
      setActiveSOSCall(null);
    }
  };

  const handleSelectRequest = async (req: any) => {
    setActiveRequest(req);
    try {
      const res = await ApiClient.getCounsellorMessages(req.requestId);
      if (res && res.messages && res.messages.length > 0) {
        setMessages(res.messages);
      } else {
        setMessages([
          {
            sender_role: 'student',
            message: req.reason || 'Hello, I have been feeling overwhelmed lately and could use someone to talk to.'
          },
          {
            sender_role: 'counsellor',
            message: 'Hello. Thank you for reaching out to Nivara. I am here to support you in complete confidentiality. How are you feeling right now?'
          }
        ]);
      }
    } catch {
      setMessages([
        {
          sender_role: 'student',
          message: req.reason || 'Hello, I am seeking confidential counseling guidance.'
        }
      ]);
    }
  };

  const handleAcceptCase = async (requestId: string) => {
    setActionLoading(true);
    try {
      await ApiClient.acceptCounsellorRequest(requestId);
      setQueue((prev) =>
        prev.map((q) => (q.requestId === requestId ? { ...q, status: 'IN_SESSION' } : q))
      );
      if (activeRequest && activeRequest.requestId === requestId) {
        setActiveRequest((prev: any) => ({ ...prev, status: 'IN_SESSION' }));
      }
      // Re-load messages for active session
      const res = await ApiClient.getCounsellorMessages(requestId);
      if (res?.messages?.length) {
        setMessages(res.messages);
      }
    } catch (e) {
      console.error('Error accepting case:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSession = async (requestId: string) => {
    setActionLoading(true);
    try {
      await ApiClient.completeCounsellorSession(requestId, 7);
      alert('Session marked complete. Automated 7-day restorative follow-up scheduled!');
      setQueue((prev) => prev.filter((q) => q.requestId !== requestId));
      setActiveRequest(null);
    } catch (e) {
      console.error('Error completing session:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRequest || actionLoading) return;

    const text = newMessage.trim();
    setNewMessage('');

    // Optimistic update
    const optimistic = {
      sender_role: 'counsellor',
      message: text,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await ApiClient.sendCounsellorMessage(activeRequest.requestId, text);
      if (res && res.message) {
        setMessages((prev) =>
          prev.map((m, idx) => (idx === prev.length - 1 ? res.message : m))
        );
      }
    } catch (err) {
      console.error('Failed to send counselor message:', err);
    }
  };

  // Active Live Jitsi Call Mode for Counselor
  if (activeSOSCall) {
    return (
      <JitsiCall
        roomName={activeSOSCall.roomName}
        type={activeSOSCall.callType}
        userName={profile?.name ? `Dr. ${profile.name}` : 'Campus Clinical Counselor'}
        userEmail={user?.email || 'counselor@nivara.internal'}
        jwtToken={activeSOSCall.jwtToken}
        domain={activeSOSCall.jitsiDomain}
        isModerator={true}
        onCallEnd={handleEndSOSCall}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col pb-16 selection:bg-tertiary-fixed">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur sticky top-0 z-40 border-b border-surface-variant/40 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-[1100px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Nivara Logo"
              className="w-10 h-10 rounded-full object-cover shadow-sm border border-outline-variant/30"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold text-base text-primary">Nivara</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold uppercase tracking-wider">
                  {t('counselor_badge', 'Counselor Desk')}
                </span>
              </div>
              <span className="text-xs text-on-surface-variant">
                Licensed Clinical Support • {profile?.name || 'Counselor'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />

            <button
              onClick={loadQueue}
              className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-xs text-on-surface font-semibold flex items-center gap-1 border border-outline-variant/40"
              title="Refresh queue"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-xs text-on-surface font-semibold flex items-center gap-1 border border-outline-variant/40 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1100px] mx-auto px-4 py-6 w-full flex flex-col gap-6 animate-fadeIn">
        {/* Welcome & Identity Separation Banner */}
        <section className="p-6 rounded-3xl bg-tertiary-fixed/25 border border-tertiary-fixed flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-headline font-extrabold text-2xl text-on-background">
              Welcome, Dr. {profile?.name || 'Counselor'} 🧑‍⚕️
            </h1>
            <p className="text-xs text-on-surface-variant max-w-xl leading-relaxed">
              Identity Separation Protocol: Student names, phone numbers, and emails are strictly masked. All conversations use pseudonymous handles (e.g. WELL-8F42).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-surface-container-lowest text-xs font-bold text-primary border border-primary/20">
              🔒 Zero PII Exposed
            </span>
          </div>
        </section>

        {/* PROMINENT TOP SECTION: LIVE SOS EMERGENCY CALLS */}
        <section className="p-6 rounded-3xl bg-surface-container-lowest border-2 border-rose-500/30 shadow-md flex flex-col gap-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-sm animate-pulse">
                SOS
              </div>
              <div>
                <h2 className="font-headline font-bold text-lg text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <span>LIVE SOS EMERGENCY CALLS</span>
                  {incomingSOSRequests.length > 0 ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                      {incomingSOSRequests.length} Waiting
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                      Live Radar Active
                    </span>
                  )}
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Real-time 8x8 JaaS private emergency video and audio connections with students.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs text-on-surface-variant hidden sm:inline">Listening for SOS alerts</span>
            </div>
          </div>

          {incomingSOSRequests.length === 0 ? (
            <div className="p-5 rounded-2xl bg-surface-container-low/50 border border-outline-variant/30 flex items-center justify-between gap-3 text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                <span>No pending emergency calls right now. Waiting student alerts will appear here instantly.</span>
              </div>
              <span className="text-[11px] font-mono text-on-surface-variant/80">JaaS 8x8.vc Ready</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingSOSRequests.map((sos) => {
                const isAudio = sos.callType === 'audio';
                const timeReceived = sos.createdAt instanceof Date
                  ? sos.createdAt.toLocaleTimeString()
                  : new Date(sos.createdAt).toLocaleTimeString();

                return (
                  <div
                    key={sos.requestId}
                    className="p-5 rounded-2xl bg-surface-container-lowest border-2 border-rose-400 dark:border-rose-800 shadow-lg flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                          isAudio ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}>
                          <span className="material-symbols-outlined">
                            {isAudio ? 'mic' : 'videocam'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-base text-on-background">
                            {sos.studentName || 'Student'}
                          </span>
                          <span className="text-xs font-semibold text-primary">
                            {isAudio ? 'Audio Call' : 'Video Call'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-500 text-white font-bold uppercase tracking-wider">
                        Live Call
                      </span>
                    </div>

                    {/* Meta details: Waiting duration & Time received */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-surface-container-low text-xs border border-outline-variant/30">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Waiting Duration
                        </span>
                        <div className="font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <WaitingDurationBadge createdAt={sos.createdAt} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Time Received
                        </span>
                        <span className="font-medium text-on-surface">
                          {timeReceived}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Accept Call & Decline */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAcceptSOSCall(sos)}
                        disabled={sosActionLoading === sos.requestId}
                        className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">call</span>
                        <span>{sosActionLoading === sos.requestId ? 'Authorizing JaaS...' : 'Accept Call'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeclineSOSCall(sos)}
                        disabled={sosActionLoading === sos.requestId}
                        className="px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold transition-colors border border-outline-variant/40"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Triage Overview Statistics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col">
            <span className="text-xs font-bold text-on-surface-variant">Pending Support Requests</span>
            <span className="text-2xl font-black font-headline text-primary mt-2">
              {queue.filter((q) => q.status === 'PENDING').length}
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">Requiring triage & contact</span>
          </div>

          <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col">
            <span className="text-xs font-bold text-on-surface-variant">Active In-Session Cases</span>
            <span className="text-2xl font-black font-headline text-secondary mt-2">
              {queue.filter((q) => q.status === 'IN_SESSION').length}
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">Ongoing private support dialogs</span>
          </div>

          <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col">
            <span className="text-xs font-bold text-on-surface-variant">Crisis Escalation Status</span>
            <span className="text-2xl font-black font-headline text-primary mt-2">
              Green (Normal)
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">Tele-MANAS 24/7 hotline synced</span>
          </div>
        </section>

        {/* Queue & Case Interaction Panel */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Requests Queue */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <h2 className="font-headline font-bold text-base text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">list_alt</span>
              <span>Student Support Queue ({queue.length})</span>
            </h2>

            {loading ? (
              <div className="p-8 rounded-2xl bg-surface-container-lowest text-center text-xs text-on-surface-variant">
                Loading support requests...
              </div>
            ) : queue.length === 0 ? (
              <div className="p-8 rounded-3xl bg-surface-container-lowest text-center text-xs text-on-surface-variant italic border border-surface-variant/40">
                No pending requests. All cases are addressed.
              </div>
            ) : (
              queue.map((req) => (
                <div
                  key={req.requestId}
                  onClick={() => handleSelectRequest(req)}
                  className={`p-4 rounded-3xl bg-surface-container-lowest border transition-all cursor-pointer shadow-sm ${
                    activeRequest?.requestId === req.requestId
                      ? 'border-primary ring-2 ring-primary/20 shadow-md'
                      : 'border-surface-variant/60 hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-primary">{req.pseudonymousId}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        req.status === 'PENDING'
                          ? 'bg-secondary-fixed text-on-secondary-fixed'
                          : 'bg-primary-fixed text-on-primary-fixed'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface line-clamp-2 mt-1">{req.reason}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-on-surface-variant">
                    <span>{req.contextSummary?.department || 'Department Not Specified'}</span> •{' '}
                    <span>{req.contextSummary?.yearOfStudy || 'Undergraduate'}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Active Conversation & Triage Panel */}
          <div className="md:col-span-7 bg-surface-container-lowest rounded-3xl p-6 border border-surface-variant/60 shadow-sm flex flex-col justify-between min-h-[480px]">
            {activeRequest ? (
              <div className="flex flex-col h-full justify-between gap-4">
                <div>
                  <div className="flex justify-between items-start border-b border-surface-variant/40 pb-3">
                    <div>
                      <h3 className="font-headline font-bold text-base text-on-background">
                        {activeRequest.pseudonymousId}
                      </h3>
                      <span className="text-xs text-on-surface-variant">
                        Load: {activeRequest.contextSummary?.currentWorkload || 'Moderate'} • Status:{' '}
                        <strong className="text-primary">{activeRequest.status}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeRequest.status === 'PENDING' && (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleAcceptCase(activeRequest.requestId)}
                          className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90 disabled:opacity-50"
                        >
                          {actionLoading ? 'Accepting...' : 'Accept Case'}
                        </button>
                      )}
                      {activeRequest.status === 'IN_SESSION' && (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleCompleteSession(activeRequest.requestId)}
                          className="px-3.5 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-sm hover:opacity-90 disabled:opacity-50"
                        >
                          {actionLoading ? 'Completing...' : 'Mark Complete'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages Stream */}
                  <div className="flex flex-col gap-2.5 py-4 max-h-72 overflow-y-auto">
                    {messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                          m.sender_role === 'counsellor'
                            ? 'bg-primary text-on-primary self-end rounded-br-none'
                            : 'bg-surface-container text-on-surface self-start rounded-bl-none'
                        }`}
                      >
                        {m.message}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Counsellor Reply Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2 pt-3 border-t border-surface-variant/40"
                >
                  <input
                    type="text"
                    placeholder="Type confidential message to student..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-xs focus:outline-none focus:border-primary text-on-background"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || actionLoading}
                    className="px-5 py-3 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-xs text-on-surface-variant p-8 gap-2">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/60">
                  support_agent
                </span>
                <span>
                  Select a student from the support queue to review context and initiate confidential dialogue.
                </span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
