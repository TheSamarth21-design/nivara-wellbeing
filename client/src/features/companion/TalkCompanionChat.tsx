import React, { useState, useEffect, useRef } from 'react';
import { ApiClient } from '../../lib/apiClient';
import { AIMessageItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SOSButton } from '../sos/SOSButton';
import { checkinService } from '../../services/checkinService';

interface Props {
  onOpenSafety: () => void;
  onOpenSOS?: () => void;
  onRequestCounsellor: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const TalkCompanionChat: React.FC<Props> = ({ onOpenSafety, onOpenSOS, onRequestCounsellor, onNavigateTab }) => {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const userKey = profile?.wellbeingId || user?.uid || 'guest';
  const storageKey = `nivara_chat_${userKey}`;
  const conversationIdStorageKey = `nivara_conv_id_${userKey}`;

  const studentFirstName =
    (profile as any)?.preferredName ||
    profile?.name?.split(' ')[0] ||
    user?.displayName?.split(' ')[0] ||
    '';

  const [conversationId, setConversationId] = useState<string>(() => {
    try {
      return localStorage.getItem(conversationIdStorageKey) || '';
    } catch {
      return '';
    }
  });

  const [messages, setMessages] = useState<AIMessageItem[]>(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [showMemoryDrawer, setShowMemoryDrawer] = useState(false);
  const [wellbeingContext, setWellbeingContext] = useState<any>(null);

  useEffect(() => {
    checkinService.getWellbeingContextForAI().then((ctx) => {
      if (ctx) {
        setWellbeingContext(ctx);
      }
    }).catch(() => {});
  }, [userKey]);

  const [feedbackMap, setFeedbackMap] = useState<
    Record<string, { helpful?: boolean; tag?: string; submitted?: boolean; showOptions?: boolean }>
  >({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check if today's checkin was done
  const todayStr = new Date().toISOString().split('T')[0];
  const lastCheckinDate = localStorage.getItem('nivara_last_checkin_date');
  const hasCompletedCheckinToday = lastCheckinDate === todayStr;

  // Detect stress signals in conversation
  const hasStressSignals = messages.some((m) =>
    /stress|anxious|anxiety|pressure|overwhelm|tired|can't sleep|insomnia|depressed|sad|panic|burnout|exhausted|तनाव|चिंता|थकान|ताण|काळजी/i.test(
      m.message
    )
  );

  useEffect(() => {
    loadMessages();
    loadMemories();
  }, [storageKey]);

  // Persist messages whenever updated
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to persist chat messages:', e);
      }
    }
  }, [messages, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadMessages = async () => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
      const res = await ApiClient.getAIMessages();
      if (res && Array.isArray(res) && res.length > 0) {
        setMessages(res);
      }
    } catch (e) {
      console.error('Could not sync remote messages:', e);
    }
  };

  const loadMemories = async () => {
    try {
      const res = await ApiClient.getAIMemories();
      setMemories(res.memories || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleVoice = () => {
    setMicError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError(t('talk_mic_unsupported', 'Microphone not supported on this device'));
      setTimeout(() => setMicError(null), 4000);
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicError(t('talk_mic_permission_denied', 'Microphone access denied'));
        } else {
          setMicError(`Voice error: ${event.error || 'Check microphone'}`);
        }
        setTimeout(() => setMicError(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Speech recognition start failed:', err);
      setIsListening(false);
      setMicError(t('talk_mic_permission_denied', 'Microphone access denied'));
      setTimeout(() => setMicError(null), 4000);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const trimmed = text.trim();
    const userMsg: AIMessageItem = {
      id: Date.now().toString(),
      sender: 'user',
      message: trimmed,
      safety_tier: 'GREEN',
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Assemble rich student context without PII leakage
    const studentContext = {
      preferred_name: studentFirstName,
      department: (profile as any)?.department || (profile as any)?.branch || '',
      academic_year: (profile as any)?.academicYear || (profile as any)?.year || '',
      college: (profile as any)?.college || '',
      recent_mood: localStorage.getItem('nivara_last_mood') || (wellbeingContext?.latest_mood ?? ''),
      recent_wellbeing: wellbeingContext,
      approved_memories: memories
    };

    try {
      const res = await ApiClient.sendAIMessage(trimmed, conversationId || undefined, studentContext);

      if (res.conversationId && res.conversationId !== conversationId) {
        setConversationId(res.conversationId);
        try {
          localStorage.setItem(conversationIdStorageKey, res.conversationId);
        } catch (e) {
          console.error('Failed to store conversation_id:', e);
        }
      }

      const assistantMsg: AIMessageItem = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        message: res.reply,
        safety_tier: res.safetyTier,
        suggested_action: res.suggestedAction,
        suggested_quick_replies: res.suggestedQuickReplies,
        suggested_exercise: res.suggestedExercise,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Reload memories if the conversation might have updated them
      loadMemories();

      if (res.safetyTier === 'RED') {
        onOpenSafety();
      }
    } catch (err: any) {
      console.error('[Nivara Chat] Error processing chat response:', err);
      const friendlyError = t(
        'talk_error_connection',
        "I'm having trouble connecting right now. Please try again in a moment."
      );
      const errorMsg: AIMessageItem = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        message: friendlyError,
        safety_tier: 'YELLOW',
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setConversationId('');
    try {
      localStorage.removeItem(conversationIdStorageKey);
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error('Failed to reset conversation storage:', e);
    }
    setMessages([]);
  };

  const handleFeedbackThumb = async (messageId: string, helpful: boolean) => {
    if (helpful) {
      setFeedbackMap((prev) => ({
        ...prev,
        [messageId]: { helpful: true, submitted: true }
      }));
      await ApiClient.sendAIFeedback({ messageId, helpful: true });
    } else {
      setFeedbackMap((prev) => ({
        ...prev,
        [messageId]: { helpful: false, showOptions: true }
      }));
    }
  };

  const handleFeedbackTag = async (messageId: string, tag: string) => {
    setFeedbackMap((prev) => ({
      ...prev,
      [messageId]: { helpful: false, tag, submitted: true, showOptions: false }
    }));
    await ApiClient.sendAIFeedback({ messageId, helpful: false, feedbackTag: tag });
  };

  const handleClearMemory = async () => {
    await ApiClient.clearAIMemory();
    setMemories([]);
  };

  // Contextual introductory quick prompts for empty conversation
  const introQuickReplies = [
    language === 'hi' ? 'परीक्षा की तैयारी से बहुत तनाव हो रहा है 😅' : language === 'mr' ? 'परीक्षेच्या अभ्यासाचा खूप ताण आला आहे 😅' : "I'm stressed about exams",
    language === 'hi' ? 'काफी थकान महसूस हो रही है 😕' : language === 'mr' ? 'खूप थकल्यासारखं वाटतंय 😕' : "I'm feeling exhausted",
    language === 'hi' ? 'आज मन बहुत उदास है 😕' : language === 'mr' ? 'आज मन उदास वाटतंय 😕' : "I'm feeling sad",
    language === 'hi' ? 'क्या हम ब्रीदिंग या रिलैक्सेशन कर सकते हैं? 🌬' : language === 'mr' ? 'आपण रिलॅक्सेशन किंवा ब्रीदिंग करू शकतो का? 🌬' : "Can we do a quick relaxation exercise?"
  ];

  // Latest assistant message quick-replies for dynamic suggestions
  const lastAssistantMsg = [...messages].reverse().find((m) => m.sender === 'assistant');
  const activeQuickReplies =
    lastAssistantMsg?.suggested_quick_replies && lastAssistantMsg.suggested_quick_replies.length > 0
      ? lastAssistantMsg.suggested_quick_replies
      : [];

  return (
    <div className="max-w-[800px] mx-auto px-4 py-4 flex flex-col h-[calc(100vh-140px)] animate-fadeIn">
      {/* Companion Top Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-variant/40">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Nivara Logo"
            className="w-8 h-8 rounded-full object-cover shadow-sm border border-outline-variant/30"
          />
          <div>
            <h2 className="font-headline font-semibold text-sm text-on-background">
              {t('talk_title', 'NIVARA AI Companion')}
            </h2>
            <span className="text-[10px] text-primary flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Active & Private
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewConversation}
            className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-xs text-on-surface font-medium flex items-center gap-1 transition-all active:scale-95"
            title="Start new conversation"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>{t('talk_new_chat', 'New Chat')}</span>
          </button>

          <button
            onClick={() => setShowMemoryDrawer(!showMemoryDrawer)}
            className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-xs text-on-surface font-medium flex items-center gap-1 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">psychology</span>
            <span>{t('talk_memory_label', 'Memory')} ({memories.length})</span>
          </button>

          <button
            onClick={onRequestCounsellor}
            className="px-3 py-1.5 rounded-full bg-secondary-container/40 hover:bg-secondary-container text-xs text-on-secondary-container font-semibold flex items-center gap-1 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">support_agent</span>
            <span>{t('tab_support', 'Counselor')}</span>
          </button>

          {onOpenSOS && (
            <SOSButton variant="header" onClick={onOpenSOS} />
          )}
        </div>
      </div>

      {/* Controlled Memory Drawer */}
      {showMemoryDrawer && (
        <div className="p-4 my-2 rounded-2xl bg-surface-container border border-outline-variant/40 flex flex-col gap-2 animate-fadeIn shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-on-background">{t('talk_memory_label', 'Companion Memory')}</span>
            <button onClick={handleClearMemory} className="text-[11px] text-error hover:underline font-medium">
              {t('talk_clear_memory', 'Clear memory')}
            </button>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            NIVARA subtly remembers helpful context like upcoming exams, study goals, or sleep habits. No clinical data or raw diaries are ever saved.
          </p>
          {memories.length === 0 ? (
            <span className="text-xs text-on-surface-variant italic py-1">No stored companion memories yet.</span>
          ) : (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {memories.map((m, idx) => (
                <span
                  key={m.id || idx}
                  className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-[11px] text-on-surface border border-outline-variant/30 shadow-2xs"
                >
                  {m.memory_key || m.key}: {m.memory_value || m.value}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mic Error Banner */}
      {micError && (
        <div className="mt-2 p-2.5 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{micError}</span>
        </div>
      )}

      {/* Contextual Wellbeing Check-in Nudge */}
      {hasStressSignals && !hasCompletedCheckinToday && (
        <div className="my-2 p-3 rounded-2xl bg-primary-container/25 border border-primary/30 flex items-center justify-between gap-3 animate-fadeIn shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🌿</span>
            <p className="text-xs text-on-surface font-medium leading-relaxed">
              {t('talk_wellbeing_nudge', 'Things sound heavy right now. A quick 1-minute check-in can help track how you are doing.')}
            </p>
          </div>
          <button
            onClick={() => {
              if (onNavigateTab) onNavigateTab('wellbeing');
              else onRequestCounsellor();
            }}
            className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold shrink-0 hover:opacity-90 shadow-sm transition-all active:scale-95"
          >
            {t('talk_take_checkin', 'Take Check-in')}
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3.5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-primary-container/40 flex items-center justify-center text-3xl shadow-sm border border-primary/20">
              👋
            </div>
            <h3 className="font-headline font-bold text-base text-on-background">
              {studentFirstName ? `Hey ${studentFirstName} 👋 How's your day going?` : "Hey! 👋 How are you feeling today?"}
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
              I'm your NIVARA companion — a quiet space to talk about college pressure, exams, daily stress, or just chat.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-md">
              {introQuickReplies.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  className="px-3.5 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/50 text-xs font-medium text-on-surface hover:bg-primary-container/25 hover:border-primary/40 hover:text-primary transition-all active:scale-95 shadow-2xs"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.sender === 'user';
          const isRed = m.safety_tier === 'RED';
          const isYellow = m.safety_tier === 'YELLOW';
          const fb = feedbackMap[m.id];

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${isUser ? 'self-end' : 'self-start'} animate-fadeIn`}
            >
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm transition-all ${
                  isUser
                    ? 'bg-primary text-on-primary rounded-br-none'
                    : isRed
                    ? 'bg-error-container text-on-error-container border border-error rounded-bl-none font-medium'
                    : isYellow
                    ? 'bg-tertiary-container/30 text-on-surface border border-tertiary-container rounded-bl-none'
                    : 'bg-surface-container-lowest text-on-surface border border-surface-variant/60 rounded-bl-none'
                }`}
              >
                {m.message}

                {/* Optional Mind Relaxation Exercise Recommendations */}
                {m.suggested_exercise && !isRed && (
                  <div className="mt-3 pt-2.5 border-t border-current/10 flex flex-wrap gap-2">
                    {m.suggested_exercise === 'breathing' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('exercises');
                          else onRequestCounsellor();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-700 dark:text-teal-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                      >
                        <span className="text-sm">🌬</span>
                        <span>{t('exercise_breathing', 'Start Breathing Exercise')}</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    )}
                    {m.suggested_exercise === 'grounding' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('exercises');
                          else onRequestCounsellor();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                      >
                        <span className="text-sm">🌿</span>
                        <span>{t('exercise_grounding', 'Try Grounding Exercise')}</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    )}
                    {m.suggested_exercise === 'relaxation' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('exercises');
                          else onRequestCounsellor();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                      >
                        <span className="text-sm">🧘</span>
                        <span>{t('exercise_relaxation', 'Try Relaxation Exercise')}</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    )}
                    {m.suggested_exercise === 'positive_self_talk' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('exercises');
                          else onRequestCounsellor();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                      >
                        <span className="text-sm">✨</span>
                        <span>{t('exercise_selftalk', 'Try Positive Self-Talk')}</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Red Crisis Alert Integration (Uses existing SOS Support & Emergency Helplines) */}
                {isRed && (
                  <div className="mt-3 pt-2.5 border-t border-error/30 flex flex-wrap items-center gap-2">
                    {onOpenSOS && (
                      <button
                        onClick={onOpenSOS}
                        className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">emergency</span>
                        <span>{t('sos_support', 'SOS Support')}</span>
                      </button>
                    )}
                    <button
                      onClick={onOpenSafety}
                      className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-[11px] font-semibold flex items-center gap-1 border border-outline-variant/40"
                    >
                      <span className="material-symbols-outlined text-sm text-error">call</span>
                      <span>{t('helplines_btn', 'Helplines (14416 / 112)')}</span>
                    </button>
                  </div>
                )}

                {/* Yellow Moderate Support */}
                {isYellow && (
                  <div className="mt-3 pt-2 border-t border-tertiary-container/40 flex items-center gap-2">
                    <button
                      onClick={onRequestCounsellor}
                      className="px-3 py-1.5 rounded-full bg-secondary text-on-secondary text-[11px] font-semibold transition-all active:scale-95"
                    >
                      {t('tab_support', 'Connect with Counselor')}
                    </button>
                  </div>
                )}
              </div>

              {/* Feedback Loop on Assistant Responses */}
              {!isUser && !isRed && (
                <div className="mt-1 flex flex-col gap-1 px-1">
                  {!fb?.submitted && !fb?.showOptions && (
                    <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/70">
                      <span>Was this helpful?</span>
                      <button
                        type="button"
                        onClick={() => handleFeedbackThumb(m.id, true)}
                        className="hover:text-primary transition-colors flex items-center gap-0.5"
                        title="Helpful"
                      >
                        <span>👍</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedbackThumb(m.id, false)}
                        className="hover:text-error transition-colors flex items-center gap-0.5"
                        title="Not helpful"
                      >
                        <span>👎</span>
                      </button>
                    </div>
                  )}

                  {fb?.showOptions && !fb?.submitted && (
                    <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-surface-container-low border border-outline-variant/30 animate-fadeIn mt-1 shadow-2xs">
                      <span className="text-[10px] text-on-surface-variant w-full font-medium">
                        What could have been better?
                      </span>
                      {['Too generic', "Didn't understand me", 'Too long', 'Not helpful', 'Other'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleFeedbackTag(m.id, tag)}
                          className="px-2 py-1 rounded-lg bg-surface-container text-[10px] font-medium text-on-surface hover:bg-surface-variant transition-all active:scale-95"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {fb?.submitted && (
                    <span className="text-[10px] text-primary italic">
                      ✓ Thank you for your feedback
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Friendly Animated Typing Indicator */}
        {loading && (
          <div className="flex items-center gap-2 p-3 bg-surface-container-low border border-outline-variant/30 rounded-2xl rounded-bl-none w-max animate-fadeIn shadow-2xs">
            <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              NIVARA is listening...
            </span>
            <div className="flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Contextual Quick-Reply Suggestions Strip */}
      {activeQuickReplies.length > 0 && !loading && (
        <div className="py-1.5 px-0.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar animate-fadeIn">
          <span className="text-[10px] text-on-surface-variant font-semibold shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-primary">lightbulb</span>
            Suggestions:
          </span>
          {activeQuickReplies.map((replyText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(replyText)}
              className="px-3 py-1 rounded-full bg-surface-container hover:bg-primary-container/30 hover:border-primary/40 hover:text-primary text-[11px] font-medium text-on-surface border border-outline-variant/40 shrink-0 transition-all active:scale-95 shadow-2xs"
            >
              {replyText}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar with Voice Recognition Button & Clean Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pt-2 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={handleToggleVoice}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 ${
            isListening
              ? 'bg-error text-on-error animate-pulse shadow-lg ring-4 ring-error/30'
              : 'bg-surface-container hover:bg-surface-variant text-on-surface'
          }`}
          title={isListening ? t('talk_listening', 'Listening...') : 'Tap to speak (Speech-to-Text)'}
        >
          <span className="material-symbols-outlined text-lg">
            {isListening ? 'mic_off' : 'mic'}
          </span>
        </button>

        <input
          type="text"
          placeholder={isListening ? t('talk_listening', 'Listening...') : t('talk_input_placeholder', 'Share your thoughts, exam worries, or feelings...')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-3 rounded-full bg-surface-container-lowest border border-outline-variant/60 text-xs focus:outline-none focus:border-primary text-on-background shadow-2xs transition-all"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-colors disabled:opacity-50 shadow-xs shrink-0 active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">send</span>
        </button>
      </form>
    </div>
  );
};
