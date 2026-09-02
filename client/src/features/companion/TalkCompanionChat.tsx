import React, { useState, useEffect, useRef } from 'react';
import { ApiClient } from '../../lib/apiClient';
import { AIMessageItem } from '../../types';

interface Props {
  onOpenSafety: () => void;
  onRequestCounsellor: () => void;
}

export const TalkCompanionChat: React.FC<Props> = ({ onOpenSafety, onRequestCounsellor }) => {
  const [messages, setMessages] = useState<AIMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [memories, setMemories] = useState<any[]>([]);
  const [showMemoryDrawer, setShowMemoryDrawer] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState<
    Record<string, { helpful?: boolean; tag?: string; submitted?: boolean; showOptions?: boolean }>
  >({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    loadMessages();
    loadMemories();

    // Initialize Web Speech API if supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Multi-lingual Indian English

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadMessages = async () => {
    try {
      const res = await ApiClient.getAIMessages();
      setMessages(res.messages || []);
    } catch (e) {
      console.error(e);
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
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: AIMessageItem = {
      id: Date.now().toString(),
      sender: 'user',
      message: text,
      safety_tier: 'GREEN',
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await ApiClient.sendAIMessage(text);
      const assistantMsg: AIMessageItem = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        message: res.reply,
        safety_tier: res.safetyTier,
        suggested_action: res.suggestedAction,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (res.safetyTier === 'RED') {
        onOpenSafety();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const quickPrompts = [
    'I am feeling overwhelmed with exam prep',
    'I cannot sleep because of racing thoughts',
    'Can we do a quick grounding exercise?',
    'I feel isolated on campus'
  ];

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
            <h2 className="font-headline font-semibold text-sm text-on-background">Nivara Companion</h2>
            <span className="text-[10px] text-primary flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Active & Private
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMemoryDrawer(!showMemoryDrawer)}
            className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-xs text-on-surface font-medium flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">psychology</span>
            <span>AI Memory ({memories.length})</span>
          </button>

          <button
            onClick={onRequestCounsellor}
            className="px-3 py-1.5 rounded-full bg-secondary-container/40 hover:bg-secondary-container text-xs text-on-secondary-container font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">support_agent</span>
            <span>Silent Counsellor</span>
          </button>
        </div>
      </div>

      {/* Controlled Memory Drawer */}
      {showMemoryDrawer && (
        <div className="p-4 my-2 rounded-2xl bg-surface-container border border-outline-variant/40 flex flex-col gap-2 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-on-background">Controlled AI Memory</span>
            <button onClick={handleClearMemory} className="text-[11px] text-error hover:underline">
              Clear Memory
            </button>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Nivara only remembers preferences you approve. No medical inferences are permanently stored.
          </p>
          {memories.length === 0 ? (
            <span className="text-xs text-on-surface-variant italic">No stored memories.</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {memories.map((m) => (
                <span
                  key={m.id}
                  className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-[11px] text-on-surface border border-outline-variant/30"
                >
                  {m.memory_key}: {m.memory_value}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
            <div className="w-16 h-16 rounded-full bg-primary-fixed/40 flex items-center justify-center text-3xl">
              🌿
            </div>
            <h3 className="font-headline font-bold text-base text-on-background">
              I am here with you
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm">
              You can talk freely or use voice input to share whatever is on your mind.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  className="px-3.5 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/40 text-xs text-on-surface hover:bg-surface-container transition-colors"
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
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}
            >
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
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

                {isYellow && (
                  <div className="mt-3 pt-2 border-t border-tertiary-container/40 flex items-center gap-2">
                    <button
                      onClick={onRequestCounsellor}
                      className="px-3 py-1.5 rounded-full bg-secondary text-on-secondary text-[11px] font-semibold"
                    >
                      Connect with Counsellor
                    </button>
                  </div>
                )}
              </div>

              {/* Part 11: Feedback Loop on Assistant Responses */}
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
                    <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-surface-container-low border border-outline-variant/30 animate-fadeIn mt-1">
                      <span className="text-[10px] text-on-surface-variant w-full">
                        What could have been better?
                      </span>
                      {['Too generic', "Didn't understand me", 'Too long', 'Not helpful', 'Other'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleFeedbackTag(m.id, tag)}
                          className="px-2 py-1 rounded-lg bg-surface-container text-[10px] font-medium text-on-surface hover:bg-surface-variant"
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

        {loading && (
          <div className="flex items-center gap-2 p-3.5 bg-surface-container rounded-2xl rounded-bl-none w-max">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 ${
            isListening
              ? 'bg-error text-on-error animate-pulse shadow-lg ring-4 ring-error/30'
              : 'bg-surface-container hover:bg-surface-variant text-on-surface'
          }`}
          title={isListening ? 'Listening... tap to stop' : 'Tap to speak (Speech-to-Text)'}
        >
          <span className="material-symbols-outlined text-lg">
            {isListening ? 'mic_off' : 'mic'}
          </span>
        </button>

        <input
          type="text"
          placeholder={isListening ? 'Listening to your voice...' : 'Share your thoughts gently...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-5 py-3.5 rounded-full bg-surface-container-lowest border border-outline-variant/60 text-xs focus:outline-none focus:border-primary text-on-background shadow-sm"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-colors disabled:opacity-50 shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-lg">send</span>
        </button>
      </form>
    </div>
  );
};
