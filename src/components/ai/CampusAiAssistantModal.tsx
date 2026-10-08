// HIET Digital Campus - Role-Aware Campus AI Assistant Modal
// Strict security: Role-isolated intents, no raw database querying, human-in-the-loop

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { askCampusAiAssistant, AssistantQueryResponse } from '../../lib/aiCampusService';
import { NavTab } from '../common/Sidebar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: NavTab) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  intent?: string;
  sources?: string[];
  actionUrl?: string;
  disclaimer?: string;
}

export const CampusAiAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const { user, role } = useAuth();
  const effectiveRole = (role || 'student').toLowerCase();

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Role-specific starter questions
  const getStarterQuestions = (): string[] => {
    switch (effectiveRole) {
      case 'student':
        return [
          'What is my attendance?',
          'What classes do I have today?',
          'Which assignments are pending?',
          'What is my leave request status?',
          'What is my gate pass status?'
        ];
      case 'teacher':
      case 'faculty':
        return [
          'What classes do I have today?',
          'Which submissions are pending grading?',
          'Which students have low attendance?',
          'What is my syllabus progress?'
        ];
      case 'hod':
        return [
          'Show CSE low-attendance students.',
          'What is department syllabus progress?',
          'Which Smart Board lessons were logged today?',
          'Which complaints need review?'
        ];
      case 'principal':
      case 'admin':
        return [
          'Show institution attendance summary.',
          'Which departments have the most open complaints?',
          'What approvals are pending?'
        ];
      default:
        return [
          'What is my attendance?',
          'What classes do I have today?'
        ];
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: `Hello ${user?.name || 'there'}! I am your official HIET Campus Assistant.\n\nYou can ask about your authorized academic and campus information.`,
      timestamp: 'Just now',
      disclaimer: 'Information grounded in authorized HIET academic records.'
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await askCampusAiAssistant({
        query: q,
        userRole: effectiveRole
      });

      if (res.success && res.data) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          intent: res.data.intent,
          sources: res.data.sources,
          actionUrl: res.data.actionUrl,
          disclaimer: res.data.disclaimer
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const fallbackMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.error || 'I am currently unable to reach the academic server. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          disclaimer: 'System alert'
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }
    } catch {
      const errMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: 'An unexpected connection issue occurred. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (actionUrl?: string) => {
    if (!actionUrl || !onNavigateTab) return;
    if (actionUrl.includes('attendance')) onNavigateTab('attendance');
    else if (actionUrl.includes('timetable')) onNavigateTab('timetable');
    else if (actionUrl.includes('assignment')) onNavigateTab('assignments');
    else if (actionUrl.includes('leave')) onNavigateTab('leaves');
    else if (actionUrl.includes('gatepass') || actionUrl.includes('gate_pass')) onNavigateTab('gate_pass');
    else if (actionUrl.includes('complaint')) onNavigateTab('complaints');
    else if (actionUrl.includes('analytics')) onNavigateTab('principal_analytics');
    else onNavigateTab('dashboard');
    onClose();
  };

  const starterQuestions = getStarterQuestions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-[#222222] rounded-3xl shadow-2xl max-w-xl w-full flex flex-col h-[85vh] max-h-[700px] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1e1e1e] flex items-center justify-between bg-slate-50/70 dark:bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0f2942] dark:bg-[#202020] text-amber-400 flex items-center justify-center shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  HIET Campus Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#0f2942] dark:bg-[#1a2533] dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  {effectiveRole}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-tight">
                Ask about your authorized academic and campus information.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202020] transition"
            aria-label="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-[#0f2942] text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-[#0f2942] text-white rounded-tr-xs shadow-xs'
                    : 'bg-slate-100 dark:bg-[#191919] text-slate-800 dark:text-[#f0f0f0] border border-slate-200/80 dark:border-[#282828] rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">
                  {msg.text}
                </div>

                {/* Sources & Action links for AI messages */}
                {msg.sender === 'ai' && (msg.sources || msg.actionUrl) && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-[#2e2e2e] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex items-center gap-1 text-slate-500 dark:text-neutral-400">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <span>Source: {msg.sources.join(', ')}</span>
                      </div>
                    )}

                    {msg.actionUrl && onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => handleActionClick(msg.actionUrl)}
                        className="inline-flex items-center gap-1 font-bold text-[#0f2942] dark:text-blue-400 hover:underline"
                      >
                        <span>Open details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {msg.disclaimer && (
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 italic">
                    {msg.disclaimer}
                  </p>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-[#252525] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-lg bg-[#0f2942] text-amber-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-3 bg-slate-100 dark:bg-[#191919] rounded-2xl border border-slate-200 dark:border-[#282828] flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px]">Consulting authorized records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Prompts Carousel / Pills */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-[#1e1e1e] bg-slate-50/50 dark:bg-[#121212]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 block mb-1.5">
            Suggested questions:
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {starterQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#2c2c2c] hover:border-[#0f2942] dark:hover:border-blue-400 text-slate-700 dark:text-neutral-300 text-[11px] font-medium transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0f0f0f]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask attendance, timetable, assignments, leaves..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-[#333333] bg-slate-50 dark:bg-[#171717] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-[#0f2942] dark:focus:border-blue-500 outline-hidden transition"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-neutral-500 mt-2 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Role-Scoped Grounding • No Arbitrary SQL
            </span>
            <span>Rate-limited: 30 queries/hour</span>
          </div>
        </div>

      </div>
    </div>
  );
};
