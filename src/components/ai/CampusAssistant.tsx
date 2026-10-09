// =============================================================================
// HIET DIGITAL CAMPUS — CAMPUS AI ASSISTANT COMPONENT
// Himachal Institute of Engineering & Technology, Shahpur
// Strict UI/UX preservation with controlled input, intent feedback & dev debug
// =============================================================================

import React, { useRef, useEffect, useState } from 'react';
import {
  Send,
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Bug,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { useCampusAssistant } from '../../hooks/useCampusAssistant';
import { NavTab } from '../common/Sidebar';

interface Props {
  onNavigateTab?: (tab: NavTab) => void;
  onClose?: () => void;
}

export const CampusAssistant: React.FC<Props> = ({ onNavigateTab }) => {
  const {
    question,
    setQuestion,
    isSending,
    messages,
    handleSendQuestion,
    clearMessages,
    debugInfo,
    effectiveRole
  } = useCampusAssistant();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const isDevMode = import.meta.env.DEV === true || import.meta.env.VITE_AI_ASSISTANT_DEBUG === 'true';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuestion();
    }
  };

  const getStarterPrompts = (): string[] => {
    switch (effectiveRole) {
      case 'faculty':
      case 'teacher':
        return [
          'Aaj meri classes kya hain?',
          'Pending submissions dikhao',
          'Low attendance students dikhao',
          'Syllabus progress kya hai?'
        ];
      case 'hod':
        return [
          'CSE department attendance dikhao',
          'Syllabus progress kya hai?',
          'Smart Board activity dikhao',
          'Pending complaints dikhao'
        ];
      case 'principal':
      case 'admin':
        return [
          'College attendance summary dikhao',
          'Pending approvals kya hain?',
          'Open complaints kitni hain?'
        ];
      default:
        return [
          'Meri attendance kitni hai?',
          'Meri next class kab hai?',
          'Mere assignment pending hain?',
          'Meri leave ka status kya hai?',
          'Mera gate pass status kya hai?'
        ];
    }
  };

  const handleActionClick = (url?: string) => {
    if (!url || !onNavigateTab) return;
    const tab = url.replace('/app/student/', '').replace('/app/faculty/', '').replace('/app/hod/', '').replace('/app/principal/', '');
    onNavigateTab(tab as NavTab);
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh] font-sans">
      {/* 1. Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-[#0f2942] dark:bg-[#1f2937] text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 space-y-2 leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#0f2942] text-white rounded-tr-xs shadow-xs'
                  : msg.isError
                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 rounded-tl-xs'
                  : 'bg-slate-100 dark:bg-[#181818] text-slate-800 dark:text-[#f0f0f0] border border-slate-200/80 dark:border-[#262626] rounded-tl-xs'
              }`}
            >
              <div className="whitespace-pre-line font-medium">{msg.content}</div>

              {/* Sources & Action Links */}
              {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-[#2e2e2e] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5 text-slate-500 dark:text-neutral-400">
                    <span className="font-semibold text-slate-400 dark:text-neutral-500">Source:</span>
                    {msg.sources.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#333333] text-[10px] font-bold text-slate-700 dark:text-neutral-300"
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>

                  {msg.sources[0]?.actionUrl && onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(msg.sources![0].actionUrl)}
                      className="inline-flex items-center gap-1 font-bold text-[#0f2942] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      <span>Open details</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {msg.disclaimer && (
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 italic pt-1">
                  {msg.disclaimer}
                </p>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-[#282828] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-[#0f2942] dark:bg-[#1f2937] text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-3 bg-slate-100 dark:bg-[#181818] rounded-2xl border border-slate-200 dark:border-[#262626] flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px]">Consulting authorized records...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 2. Starter Prompts Carousel */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-[#1e1e1e] bg-slate-50/70 dark:bg-[#121212]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
            Suggested questions:
          </span>
          <button
            type="button"
            onClick={clearMessages}
            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 flex items-center gap-1 cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Reset</span>
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {getStarterPrompts().map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendQuestion(q)}
              disabled={isSending}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#2c2c2c] hover:border-[#0f2942] dark:hover:border-blue-400 text-slate-700 dark:text-neutral-300 text-[11px] font-medium transition cursor-pointer shrink-0 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Controlled Textarea Input Bar */}
      <div className="p-3 border-t border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0f0f0f] space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuestion();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your attendance, timetable, assignments or leave status..."
              disabled={isSending}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-[#333333] bg-slate-50 dark:bg-[#171717] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-[#0f2942] dark:focus:border-blue-500 outline-hidden transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!question.trim() || isSending}
            className="px-4 py-2.5 h-[42px] rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0 cursor-pointer"
          >
            {isSending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-neutral-500 px-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Role-Scoped Grounding • No Arbitrary SQL
          </span>
          {isDevMode && (
            <button
              type="button"
              onClick={() => setShowDebugPanel((prev) => !prev)}
              className="flex items-center gap-1 text-blue-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
            >
              <Bug className="w-3 h-3" />
              <span>Debug {showDebugPanel ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Development-Only Debug Panel (PART J) */}
      {isDevMode && showDebugPanel && debugInfo && (
        <div className="p-3 bg-amber-50/90 dark:bg-[#18150f] border-t border-amber-200 dark:border-amber-900/60 text-[11px] text-slate-800 dark:text-neutral-200 space-y-1.5 animate-fade-in font-mono">
          <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-400 pb-1 border-b border-amber-200/60 dark:border-amber-900/40">
            <span>🛠️ AI Assistant Debug — Development Only</span>
            <span className="text-[10px]">{debugInfo.timestamp}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            <div>
              <span className="text-slate-500 dark:text-neutral-400">Sent Message: </span>
              <strong className="text-slate-900 dark:text-white font-semibold">"{debugInfo.sentMessage}"</strong>
            </div>

            <div>
              <span className="text-slate-500 dark:text-neutral-400">Detected Intent: </span>
              <strong className="text-blue-700 dark:text-sky-300 font-semibold">{debugInfo.detectedIntent}</strong>
            </div>

            <div>
              <span className="text-slate-500 dark:text-neutral-400">Active Roles: </span>
              <strong className="text-slate-800 dark:text-neutral-200 font-semibold">{debugInfo.activeRoles.join(', ')}</strong>
            </div>

            <div>
              <span className="text-slate-500 dark:text-neutral-400">Data Source: </span>
              <strong className="text-slate-800 dark:text-neutral-200 font-semibold">{debugInfo.dataSource}</strong>
            </div>

            <div>
              <span className="text-slate-500 dark:text-neutral-400">Data Available: </span>
              <strong className={debugInfo.dataAvailable ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-amber-700 dark:text-amber-400 font-semibold'}>
                {debugInfo.dataAvailable ? 'true' : 'false'}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 dark:text-neutral-400">Function Response: </span>
              <strong className={debugInfo.functionResponse === 'success' ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : debugInfo.functionResponse === 'error' ? 'text-rose-700 dark:text-rose-400 font-semibold' : 'text-blue-700 dark:text-sky-400 font-semibold'}>
                {debugInfo.functionResponse} {debugInfo.modelUsed ? `(${debugInfo.modelUsed})` : ''}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
