import React, { useState, useEffect, useRef } from 'react';
import { ApiClient } from '../../lib/apiClient';
import { UserRole } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  role: UserRole;
  onNavigateTab?: (tab: string) => void;
}

export const SilentCounsellorView: React.FC<Props> = ({ role, onNavigateTab }) => {
  const { t } = useLanguage();
  const [queue, setQueue] = useState<any[]>([]);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (role === 'COUNSELLOR') {
      loadCounsellorQueue();
    } else {
      loadStudentActiveRequest();
    }
  }, [role]);

  // Polling for status changes and messages
  useEffect(() => {
    if (role !== 'COUNSELLOR' && activeRequest) {
      const interval = setInterval(() => {
        pollStudentSession();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [role, activeRequest]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadCounsellorQueue = async () => {
    try {
      const res = await ApiClient.getCounsellorQueue();
      setQueue(res.queue || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentActiveRequest = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.getMySupportRequest();
      if (res && res.activeRequest) {
        setActiveRequest(res.activeRequest);
        setMessages(res.messages || []);
      } else {
        setActiveRequest(null);
        setMessages([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pollStudentSession = async () => {
    try {
      const res = await ApiClient.getMySupportRequest();
      if (res && res.activeRequest) {
        setActiveRequest(res.activeRequest);
        if (res.messages && res.messages.length > 0) {
          setMessages(res.messages);
        }
      }
    } catch (e) {
      // silent
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await ApiClient.requestSupport(reason);
      if (res?.request) {
        setActiveRequest(res.request);
      } else {
        setActiveRequest({
          id: 'req-' + Date.now(),
          status: 'PENDING',
          reason: reason || 'Seeking academic and wellbeing support.'
        });
      }
      setReason('');
      loadStudentActiveRequest();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCounsellorAccept = async (requestId: string) => {
    await ApiClient.acceptCounsellorRequest(requestId);
    loadCounsellorQueue();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRequest) return;

    const text = newMessage.trim();
    setNewMessage('');

    if (role === 'COUNSELLOR') {
      const reqId = activeRequest.requestId || activeRequest.id;
      const optimistic = { sender_role: 'counsellor', message: text };
      setMessages((prev) => [...prev, optimistic]);
      await ApiClient.sendCounsellorMessage(reqId, text);
    } else {
      const optimistic = { sender_role: 'student', message: text };
      setMessages((prev) => [...prev, optimistic]);
      await ApiClient.sendSupportMessage(activeRequest.id || activeRequest.requestId, text);
    }
  };

  const handleCompleteSession = async (reqId: string) => {
    await ApiClient.completeCounsellorSession(reqId);
    alert('Session marked completed. Automated 7-day follow-up scheduled!');
    loadCounsellorQueue();
    setActiveRequest(null);
  };

  // COUNSELLOR PORTAL VIEW
  if (role === 'COUNSELLOR') {
    return (
      <div className="max-w-[1000px] mx-auto px-4 py-6 flex flex-col gap-6 animate-fadeIn pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline font-bold text-2xl text-on-background">Counsellor Support Queue</h1>
            <p className="text-xs text-on-surface-variant">
              Identity Separation strictly preserved. Only pseudonymous handles and consented context summaries are visible.
            </p>
          </div>
          <button onClick={loadCounsellorQueue} className="px-4 py-2 rounded-full bg-surface-container text-xs font-semibold">
            Refresh Queue
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Requests List */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <h2 className="font-semibold text-sm text-on-background">Active Student Requests ({queue.length})</h2>
            {queue.length === 0 ? (
              <div className="p-6 rounded-2xl bg-surface-container-lowest text-xs text-on-surface-variant italic text-center">
                No pending support requests right now.
              </div>
            ) : (
              queue.map((req) => (
                <div
                  key={req.requestId}
                  onClick={() => {
                    setActiveRequest(req);
                    ApiClient.getCounsellorMessages(req.requestId).then((res) => setMessages(res.messages || []));
                  }}
                  className={`p-4 rounded-2xl bg-surface-container-lowest border transition-all cursor-pointer ${
                    activeRequest?.requestId === req.requestId ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-surface-variant/60 hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-primary">{req.pseudonymousId}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold">
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface line-clamp-2 mt-1">{req.reason}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-on-surface-variant">
                    <span>{req.contextSummary?.department}</span> • <span>{req.contextSummary?.yearOfStudy}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Conversation & Context Panel */}
          <div className="md:col-span-7 bg-surface-container-lowest rounded-3xl p-6 border border-surface-variant/60 shadow-sm flex flex-col justify-between min-h-[450px]">
            {activeRequest ? (
              <div className="flex flex-col h-full justify-between gap-4">
                <div>
                  <div className="flex justify-between items-center border-b border-surface-variant/40 pb-3">
                    <span className="font-bold text-sm text-primary">{activeRequest.pseudonymousId}</span>
                    <div className="flex gap-2">
                      {activeRequest.status === 'PENDING' && (
                        <button
                          onClick={() => handleCounsellorAccept(activeRequest.requestId)}
                          className="px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-semibold"
                        >
                          Accept
                        </button>
                      )}
                      {activeRequest.status === 'IN_SESSION' && (
                        <button
                          onClick={() => handleCompleteSession(activeRequest.requestId)}
                          className="px-3 py-1 rounded-full bg-secondary text-on-secondary text-xs font-semibold"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 py-3 max-h-60 overflow-y-auto">
                    {messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                          m.sender_role === 'counsellor'
                            ? 'bg-primary text-on-primary self-end'
                            : 'bg-surface-container text-on-surface self-start'
                        }`}
                      >
                        {m.message}
                      </div>
                    ))}
                  </div>
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-surface-variant/40">
                  <input
                    type="text"
                    placeholder="Type supportive message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-full bg-surface-container text-xs"
                  />
                  <button type="submit" className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold">
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-on-surface-variant">
                Select a student from the queue
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // STUDENT VIEW
  return (
    <div className="max-w-[800px] mx-auto px-4 py-6 flex flex-col gap-6 animate-fadeIn pb-24">
      {/* Header */}
      <div>
        <h1 className="font-headline font-bold text-2xl text-on-background">
          {t('support_title')}
        </h1>
        <p className="text-xs text-on-surface-variant max-w-xl mt-1 leading-relaxed">
          {t('support_sub')}
        </p>
      </div>

      {/* Strict Anonymity Guarantee Notice */}
      <div className="p-4 rounded-3xl bg-secondary-container/20 border border-secondary-container/40 flex items-start gap-3 shadow-sm">
        <span className="text-xl">🔒</span>
        <p className="text-xs text-on-secondary-container leading-relaxed">
          {t('support_anonymity_notice')}
        </p>
      </div>

      {/* Pending Request State */}
      {activeRequest && activeRequest.status === 'PENDING' && (
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-variant/60 shadow-sm flex flex-col gap-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
              <h3 className="font-headline font-bold text-sm text-on-background">
                {t('support_pending_status')}
              </h3>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold uppercase">
              Pending
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Your Request Note
            </span>
            <p className="text-xs text-on-surface italic">
              "{activeRequest.reason || 'Support requested'}"
            </p>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            {t('support_pending_note')}
          </p>

          <div className="flex items-center gap-2 pt-2 border-t border-surface-variant/40 text-[11px] text-on-surface-variant">
            <span className="material-symbols-outlined text-sm text-primary animate-spin">
              sync
            </span>
            <span>Checking room status automatically... (Will open as soon as counselor accepts)</span>
          </div>
        </div>
      )}

      {/* Active In-Session State */}
      {activeRequest && activeRequest.status === 'IN_SESSION' && (
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-variant/60 shadow-sm flex flex-col gap-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-surface-variant/40 pb-3">
            <div>
              <h3 className="font-headline font-bold text-sm text-on-background">
                {t('support_active_status')}
              </h3>
              <span className="text-xs text-primary font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Live Confidential Chat with Campus Counselor
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-on-surface-variant">
              {activeRequest.pseudonymousId || 'Anonymous Session'}
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex flex-col gap-2.5 min-h-[250px] max-h-80 overflow-y-auto py-2">
            {messages.length === 0 ? (
              <div className="p-6 text-center text-xs text-on-surface-variant italic">
                Counselor has joined the private room. Feel free to say hello.
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    m.sender_role === 'student'
                      ? 'bg-primary text-on-primary self-end rounded-br-none'
                      : 'bg-surface-container text-on-surface self-start rounded-bl-none border border-outline-variant/30'
                  }`}
                >
                  {m.message}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-surface-variant/40">
            <input
              type="text"
              placeholder={t('support_type_message')}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-4 py-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-xs focus:outline-none focus:border-primary text-on-background"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-5 py-3 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
            >
              {t('talk_send')}
            </button>
          </form>
        </div>
      )}

      {/* New Request Creation Form */}
      {(!activeRequest || activeRequest.status === 'COMPLETED') && (
        <form onSubmit={handleStudentSubmit} className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-variant/60 shadow-sm flex flex-col gap-4">
          <h2 className="font-headline font-bold text-base text-on-background">
            {t('support_request_title')}
          </h2>
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-primary-fixed/60 text-xs text-primary leading-relaxed">
            🌿 A certified campus counselor will receive your anonymous request and open a secure, discreet chat room.
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface mb-1">
              {t('support_reason_label')}
            </label>
            <textarea
              rows={4}
              placeholder={t('support_reason_placeholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs focus:outline-none focus:border-primary text-on-background"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="py-3.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-md disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : t('support_submit_btn')}
          </button>
        </form>
      )}
    </div>
  );
};
