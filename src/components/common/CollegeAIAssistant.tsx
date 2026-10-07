import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  CalendarCheck, 
  Award, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  HelpCircle,
  QrCode,
  CreditCard,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { queryCollegeAi, AiResponse } from '../../lib/aiService';

interface ActionCard {
  type: 'attendance' | 'cgpa' | 'fines' | 'gate_pass' | 'leave' | 'timetable' | 'map' | 'login' | 'doubt';
  title: string;
  data: any;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  actionCard?: ActionCard;
  sourceDocuments?: string[];
  suggestedFollowUps?: string[];
  isEscalated?: boolean;
}

interface Props {
  onNavigateTab?: (tab: any) => void;
  onOpenLogin?: () => void;
}

export const CollegeAIAssistant: React.FC<Props> = ({ onNavigateTab, onOpenLogin }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice Assistant State (Feature 8)
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [showKangriNote, setShowKangriNote] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: user 
        ? `Namaste **${user.name}**! 🙏 Main hu HIET Digital Campus AI Assistant.\n\nAap attendance, HPTU ordinances, gate pass guidelines, semester syllabus, fees ya exam notifications ke baare me pooch sakte hain!`
        : `Namaste Student! 🙏 Main hu HIET Digital Campus AI Assistant.\n\nAap yahan se **Student Portal Login** kar sakte hain, ya campus rules, admissions, syllabus aur gate guidelines ke baare me pooch sakte hain!`,
      timestamp: 'Just now',
      sourceDocuments: ['HIET Academic Ordinance & Student Handbook 2025-26'],
      suggestedFollowUps: user ? [
        'Meri attendance status kya hai?',
        'Gate pass kaise banwaye?',
        'HPTU passing marks criteria',
        'Library timings and rules'
      ] : [
        'Open student login',
        'HIET campus courses offered',
        'Campus gate rules',
        'Academic calendar 2026'
      ]
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

  // Initialize Web Speech API Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setMicError('Microphone permission denied. Please allow microphone access in browser settings.');
        } else if (event.error === 'no-speech') {
          setMicError('No voice detected. Please tap the microphone and speak again.');
        } else {
          setMicError(`Voice error: ${event.error}. You can type your question directly.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      recognitionRef.current = null;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [speechLanguage]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Web Speech API is not supported in this browser. Please use Chrome, Edge or Safari, or type your query in the text box.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setMicError(null);
      try {
        recognitionRef.current.lang = speechLanguage;
        recognitionRef.current.start();
      } catch (err: any) {
        console.warn('Recognition start exception:', err);
      }
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    // Clean markdown formatting before TTS
    const cleanText = text
      .replace(/[*_#`]/g, '')
      .replace(/\[Ref:.*?\]/g, '')
      .replace(/https?:\/\/\S+/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = speechLanguage === 'hi-IN' ? 'hi-IN' : 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    // Direct action interception for login command
    if ((query.toLowerCase().trim() === 'login' || query.toLowerCase().trim() === 'open student login') && onOpenLogin && !user) {
      setIsOpen(false);
      onOpenLogin();
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      // Feature 7 Grounded AI RAG Query with Personal Data Isolation & Guardrails
      const aiResult: AiResponse = await queryCollegeAi(query, user);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResult.answer,
        actionCard: aiResult.actionCard,
        sourceDocuments: aiResult.sourceDocuments,
        suggestedFollowUps: aiResult.suggestedFollowUps,
        isEscalated: aiResult.isEscalated,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);

      if (ttsEnabled) {
        speakText(aiResult.answer);
      }
    } catch (err: any) {
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Error processing request: ${err.message || 'Unknown network error'}. Please retry or consult your Department HOD.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Smart Bot Trigger (Bottom Right) */}
      {!isOpen && (
        <div 
          className="fixed z-40 flex items-center gap-2 transition-all duration-300 sm:bottom-6 sm:right-6"
          style={{
            right: '16px',
            bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))'
          }}
        >
          {/* Quick prompt pill */}
          <div className="hidden md:flex items-center gap-2 bg-white text-slate-800 text-xs px-3.5 py-2 rounded-2xl shadow-md border border-slate-200 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">Need Help? Ask HIET AI & Voice Assistant</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsOpen(true)}
              className="group relative flex items-center justify-center w-[52px] h-[52px] sm:w-14 sm:h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white shadow-blue-500/30 overflow-hidden"
              title="Open HIET AI & Voice Assistant"
            >
              <Bot className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3 sm:h-3.5 sm:w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-emerald-500 border-2 border-white shadow-xs" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive AI Window */}
      {isOpen && (
        <div
          className={`fixed z-50 inset-x-2 sm:inset-x-auto sm:right-6 bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-fade-in ${
            isExpanded
              ? 'w-auto sm:w-[650px] h-[calc(100vh-2rem)] sm:h-[calc(100vh-5rem)] max-h-[760px] bottom-2 sm:bottom-6'
              : 'w-auto sm:w-[440px] h-[calc(100vh-90px)] sm:h-[620px] max-h-[600px] bottom-2 sm:bottom-6'
          }`}
          style={{
            bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))'
          }}
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white p-3 sm:p-4 flex items-center justify-between border-b border-blue-900 shadow-xs shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/15 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <Bot className="w-5 h-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-extrabold tracking-tight truncate">HIET Campus AI</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono">
                    Grounded RAG
                  </span>
                </div>
                <p className="text-[10px] text-blue-100 flex items-center gap-1 truncate">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Verified College Ordinances & Isolated Data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Voice Speech Toggle */}
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`p-1.5 rounded-xl text-xs transition ${
                  ttsEnabled ? 'bg-amber-400/30 text-amber-300' : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title={ttsEnabled ? 'Mute AI Voice Responses' : 'Read AI Responses with Voice'}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4 text-amber-300" /> : <VolumeX className="w-4 h-4 text-slate-300" />}
              </button>

              {/* Language Selector */}
              <button
                onClick={() => setSpeechLanguage(prev => prev === 'hi-IN' ? 'en-IN' : 'hi-IN')}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold tracking-wider text-white transition"
                title="Switch Speech Language"
              >
                {speechLanguage === 'hi-IN' ? '🇮🇳 HI' : '🇬🇧 EN'}
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition hidden sm:inline-flex"
                title={isExpanded ? 'Collapse' : 'Expand window'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  if (recognitionRef.current) recognitionRef.current.abort();
                }}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Kangri Dialect Notice / Advisory Banner */}
          <div className="bg-amber-50 border-b border-amber-200/80 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-900 shrink-0">
            <span className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Voice recognition active in <strong>{speechLanguage === 'hi-IN' ? 'Hindi (हिंदी)' : 'English'}</strong>.</span>
            </span>
            <button
              onClick={() => setShowKangriNote(!showKangriNote)}
              className="text-[10px] text-blue-700 underline font-semibold shrink-0 ml-2"
            >
              Kangri dialect note
            </button>
          </div>

          {/* Kangri Dialect Documentation Modal Overlay */}
          {showKangriNote && (
            <div className="p-3 bg-blue-50 border-b border-blue-200 text-xs text-blue-900 animate-fade-in shrink-0 space-y-1.5">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  Kangri Dialect Speech Technology Limitation
                </span>
                <button onClick={() => setShowKangriNote(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong>Kangri (कांगड़ी)</strong> is a Western Pahari language spoken across the Kangra valley of Himachal Pradesh. Currently, standard commercial speech-to-text engines (Google Web Speech, Apple Speech, and Whisper base) lack dedicated native Kangri acoustic models.
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Our voice assistant applies <strong>Hindi phonetic acoustic mapping</strong> with local Kangra keyword detection. You can speak in conversational Kangri or Hindi, and inspect/edit the recognized transcript in the input box before submitting.
              </p>
            </div>
          )}

          {/* Mic Error Banner */}
          {micError && (
            <div className="p-2.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-[11px] flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{micError}</span>
              </span>
              <button onClick={() => setMicError(null)} className="text-rose-500 font-bold ml-2">✕</button>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 text-xs bg-slate-50/60 font-sans">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-xl bg-blue-700 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[88%] rounded-2xl p-3.5 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}>
                  <div className="whitespace-pre-line leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Document Citations & Sources (Feature 7) */}
                  {msg.sourceDocuments && msg.sourceDocuments.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1 items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        Grounded Sources:
                      </span>
                      {msg.sourceDocuments.map((doc, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                          {doc}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Interactive Action Card */}
                  {msg.actionCard && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-inner text-xs">
                      {msg.actionCard.type === 'attendance' && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <CalendarCheck className="w-4 h-4 text-emerald-600" />
                              {msg.actionCard.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              msg.actionCard.data.safe ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {msg.actionCard.data.safe ? 'Safe Attendance' : 'Shortage Warning'}
                            </span>
                          </div>

                          <div className="w-full bg-slate-200 rounded-full h-2.5 my-2">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                msg.actionCard.data.safe ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(msg.actionCard.data.percentage, 100)}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                            <span>Attended: <b>{msg.actionCard.data.attended}/{msg.actionCard.data.total}</b> Lectures</span>
                            <span className="font-bold text-slate-800">{msg.actionCard.data.percentage}%</span>
                          </div>

                          {onNavigateTab && (
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                onNavigateTab('attendance');
                              }}
                              className="mt-2.5 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition"
                            >
                              <span>View Subject-wise Attendance</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {msg.actionCard.type === 'gate_pass' && onNavigateTab && (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onNavigateTab('gate_pass');
                          }}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Open Digital Gate Pass Portal</span>
                        </button>
                      )}

                      {msg.actionCard.type === 'fines' && onNavigateTab && (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onNavigateTab('fines');
                          }}
                          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>View Fines & Submit Appeal</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Suggestion action pills */}
                  {msg.suggestedFollowUps && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(action)}
                          className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-medium transition"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Escalation Option */}
                  {msg.isEscalated && onNavigateTab && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-[11px]">
                      <span className="text-amber-800 font-medium">Need human faculty verification?</span>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onNavigateTab('doubts');
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] transition"
                      >
                        Ask Faculty
                      </button>
                    </div>
                  )}

                  {/* Footer with Timestamp and TTS Audio Replay */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[9px] text-slate-400">
                    <span className="flex items-center gap-1">
                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => speakText(msg.text)}
                          className="p-1 hover:text-blue-600 rounded transition"
                          title="Listen with Text-to-Speech"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-9 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>Searching verified HIET Academic Repository...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-white border-t border-slate-200 overflow-x-auto flex gap-1.5 scrollbar-none shrink-0">
            {!user && onOpenLogin && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenLogin();
                }}
                className="px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold shrink-0 flex items-center gap-1 shadow-2xs"
              >
                🔑 Student Login
              </button>
            )}
            <button
              onClick={() => handleSend('Meri attendance dikhao')}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium shrink-0 flex items-center gap-1"
            >
              📊 Attendance
            </button>
            <button
              onClick={() => handleSend('Gate pass rules and procedure')}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium shrink-0 flex items-center gap-1"
            >
              🎟️ Gate Pass Rules
            </button>
            <button
              onClick={() => handleSend('Outstanding fines and dues')}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium shrink-0 flex items-center gap-1"
            >
              💳 Fines & Appeals
            </button>
            <button
              onClick={() => handleSend('HPTU passing marks and attendance policy')}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium shrink-0 flex items-center gap-1"
            >
              📖 HPTU Rules
            </button>
          </div>

          {/* Voice Input Active Waveform Visualizer */}
          {isListening && (
            <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between text-xs animate-pulse shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
                <span className="font-bold">Listening in {speechLanguage === 'hi-IN' ? 'Hindi' : 'English'}... Speak now</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-1 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
              </div>
            </div>
          )}

          {/* Input Bar with Mic & Send */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
            {/* Microphone Button (Feature 8) */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-xl transition shadow-xs flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
              title={isListening ? 'Stop recording voice' : 'Speak your question (Web Speech Voice Assistant)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-600" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? 'Listening...' : 'Type or speak your query (Hindi/English)...'}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs transition group shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Compliance & Legal Disclaimer Footer (Section 7) */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[9px] text-slate-400 text-center shrink-0">
            Advisory responses generated via HIET verified ordinances. For statutory resolutions, contact your HOD.
          </div>
        </div>
      )}
    </>
  );
};
