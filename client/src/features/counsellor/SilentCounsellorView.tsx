import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../lib/apiClient';
import { UserRole } from '../../types';

interface Props {
  role: UserRole;
}

export const SilentCounsellorView: React.FC<Props> = ({ role }) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [reason, setReason] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (role === 'COUNSELLOR') {
      loadCounsellorQueue();
    } else {
      loadStudentActiveRequest();
    }
  }, [role]);

  const loadCounsellorQueue = async () => {
    try {
      const res = await ApiClient.getCounsellorQueue();
      setQueue(res.queue || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadStudentActiveRequest = async () => {
    try {
      const res = await ApiClient.getMySupportRequest();
      if (res.activeRequest) {
        setActiveRequest(res.activeRequest);
        setMessages(res.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.requestSupport(reason);
      setRequestSent(true);
      loadStudentActiveRequest();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCounsellorAccept = async (requestId: string) => {
    await ApiClient.acceptCounsellorRequest(requestId);
    loadCounsellorQueue();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRequest) return;

    if (role === 'COUNSELLOR') {
      const res = await ApiClient.request('/counsellor/message', {
        method: 'POST',
        body: JSON.stringify({ requestId: activeRequest.requestId || activeRequest.id, message: newMessage })
      });
      setMessages((prev) => [...prev, res.message]);
    } else {
      const res = await ApiClient.sendSupportMessage(activeRequest.id, newMessage);
      setMessages((prev) => [...prev, res.message]);
    }
    setNewMessage('');
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
                    ApiClient.request(`/counsellor/messages/${req.requestId}`).then((res) => setMessages(res.messages || []));
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
                    <span>{req.contextSummary.department}</span> • <span>{req.contextSummary.yearOfStudy}</span>
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
                  <div className="flex justify-between items-start border-b border-surface-variant/40 pb-3">
                    <div>
                      <h3 className="font-headline font-bold text-sm text-on-background">
                        {activeRequest.pseudonymousId || `Student ${activeRequest.wellbeingId}`}
                      </h3>
                      <span className="text-[11px] text-on-surface-variant">
                        Status: {activeRequest.status} • Academic Load: {activeRequest.contextSummary?.currentWorkload || 'Standard'}
                      </span>
                    </div>
                    {activeRequest.status === 'PENDING' && (
                      <button
                        onClick={() => handleCounsellorAccept(activeRequest.requestId)}
                        className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold"
                      >
                        Accept Case
                      </button>
                    )}
                    {activeRequest.status === 'IN_SESSION' && (
                      <button
                        onClick={() => handleCompleteSession(activeRequest.requestId)}
                        className="px-4 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold"
                      >
                        Complete Session
                      </button>
                    )}
                  </div>

                  {/* Messages Area */}
                  <div className="flex flex-col gap-2 py-4 max-h-64 overflow-y-auto">
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

                {/* Counsellor Reply Form */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-surface-variant/40">
                  <input
                    type="text"
                    placeholder="Type supportive message to student..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-xs focus:outline-none focus:border-primary text-on-background"
                  />
                  <button type="submit" className="px-5 py-3 rounded-full bg-primary text-on-primary text-xs font-semibold">
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-xs text-on-surface-variant">
                Select a student from the queue to review context and begin secure support.
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
      <div>
        <h1 className="font-headline font-bold text-2xl text-on-background">Silent Counsellor Bridge 🕊️</h1>
        <p className="text-xs text-on-surface-variant max-w-xl">
          Connect discreetly with a campus counsellor. Your email and phone are completely hidden; only your pseudonymous ID (WELL-8F42) is shared.
        </p>
      </div>

      {activeRequest ? (
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-variant/60 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-surface-variant/40 pb-3">
            <div>
              <h3 className="font-headline font-bold text-sm text-on-background">Support Session Active</h3>
              <span className="text-xs text-primary font-medium">Status: {activeRequest.status}</span>
            </div>
            <span className="text-xs font-mono font-bold text-on-surface-variant">Anonymous Student {activeRequest.wellbeing_id}</span>
          </div>

          <div className="flex flex-col gap-2 min-h-[250px] max-h-80 overflow-y-auto py-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                  m.sender_role === 'student'
                    ? 'bg-primary text-on-primary self-end'
                    : 'bg-surface-container text-on-surface self-start'
                }`}
              >
                {m.message}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-surface-variant/40">
            <input
              type="text"
              placeholder="Type your message to counsellor..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-4 py-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-xs focus:outline-none focus:border-primary text-on-background"
            />
            <button type="submit" className="px-5 py-3 rounded-full bg-primary text-on-primary text-xs font-semibold">
              Send
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={handleStudentSubmit} className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-variant/60 shadow-sm flex flex-col gap-4">
          <h2 className="font-headline font-bold text-base text-on-background">Request Anonymous Counsellor Support</h2>
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-primary-fixed/60 text-xs text-primary leading-relaxed">
            🌿 A certified campus counsellor will receive your anonymous request and open a secure, discreet chat room.
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface mb-1">What would you like support with? (Optional)</label>
            <textarea
              rows={4}
              placeholder="e.g., Struggling with ongoing exam anxiety and feeling overwhelmed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs focus:outline-none focus:border-primary text-on-background"
            />
          </div>
          <button
            type="submit"
            className="py-3.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-md"
          >
            Submit Anonymous Support Request
          </button>
        </form>
      )}
    </div>
  );
};
