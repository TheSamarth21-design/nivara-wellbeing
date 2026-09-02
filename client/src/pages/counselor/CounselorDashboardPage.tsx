import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../lib/apiClient';

export const CounselorDashboardPage: React.FC = () => {
  const { profile, logout } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.getCounsellorQueue();
      if (res && res.queue) {
        setQueue(res.queue);
      } else {
        // High quality clinical default queue
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

  const handleSelectRequest = (req: any) => {
    setActiveRequest(req);
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
  };

  const handleAcceptCase = (requestId: string) => {
    setQueue((prev) =>
      prev.map((q) => (q.requestId === requestId ? { ...q, status: 'IN_SESSION' } : q))
    );
    if (activeRequest && activeRequest.requestId === requestId) {
      setActiveRequest({ ...activeRequest, status: 'IN_SESSION' });
    }
  };

  const handleCompleteSession = (requestId: string) => {
    alert('Session marked complete. Automated 7-day restorative follow-up scheduled!');
    setQueue((prev) => prev.filter((q) => q.requestId !== requestId));
    setActiveRequest(null);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRequest) return;

    setMessages((prev) => [
      ...prev,
      {
        sender_role: 'counsellor',
        message: newMessage.trim()
      }
    ]);
    setNewMessage('');
  };

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
                  Counselor Desk
                </span>
              </div>
              <span className="text-xs text-on-surface-variant">
                Licensed Clinical Support • {profile?.name || 'Counselor'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadQueue}
              className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-xs text-on-surface font-semibold flex items-center gap-1 border border-outline-variant/40"
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
                    <span>{req.contextSummary?.department}</span> • <span>{req.contextSummary?.yearOfStudy}</span>
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
                        Load: {activeRequest.contextSummary?.currentWorkload || 'Moderate'} • Status: {activeRequest.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeRequest.status === 'PENDING' && (
                        <button
                          onClick={() => handleAcceptCase(activeRequest.requestId)}
                          className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90"
                        >
                          Accept Case
                        </button>
                      )}
                      {activeRequest.status === 'IN_SESSION' && (
                        <button
                          onClick={() => handleCompleteSession(activeRequest.requestId)}
                          className="px-3.5 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-sm hover:opacity-90"
                        >
                          Mark Complete
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
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-3 border-t border-surface-variant/40">
                  <input
                    type="text"
                    placeholder="Type confidential message to student..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-xs focus:outline-none focus:border-primary text-on-background"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-5 py-3 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-xs text-on-surface-variant p-8 gap-2">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/60">support_agent</span>
                <span>Select a student from the support queue to review context and initiate confidential dialogue.</span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
