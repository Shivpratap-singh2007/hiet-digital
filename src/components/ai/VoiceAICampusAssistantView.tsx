import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Clock,
  CheckCircle2,
  HelpCircle,
  PhoneCall,
  Calendar,
  Bus,
  Receipt,
  GraduationCap
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { NavTab } from '../common/Sidebar';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  hindiText?: string;
  timestamp: string;
  category?: 'attendance' | 'fee' | 'transport' | 'exam' | 'hostel' | 'general';
}

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const VoiceAICampusAssistantView: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const studentName = student?.name || user?.name || 'Aarav Sharma';
  const studentRoll = student?.roll_no || '26CSE001';

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Namaste ${studentName}! I am your HIET Voice AI Campus Assistant. You can speak or type in Hindi, Hinglish, or English. How can I help you today?`,
      hindiText: `नमस्ते ${studentName}! मैं आपका HIET वॉइस AI कैंपस सहायक हूँ। आप हिंदी या इंग्लिश में बोलकर पूछ सकते हैं।`,
      timestamp: 'Just now',
      category: 'general'
    }
  ]);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN'; // Supports Hindi + Indian English

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleProcessUserQuery(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Text-To-Speech Speaker
  const speakText = (text: string) => {
    if (!voiceSpeechEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Speech recognition start failed', err);
      }
    }
  };

  // AI Response Generator
  const handleProcessUserQuery = (query: string) => {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let replyText = '';
    let category: Message['category'] = 'general';

    if (
      cleanQuery.includes('attendance') ||
      cleanQuery.includes('hazri') ||
      cleanQuery.includes('bunk') ||
      cleanQuery.includes('present') ||
      cleanQuery.includes('attend')
    ) {
      category = 'attendance';
      replyText = `Aapki overall attendance 84.6% hai. HPTU ke 75% statutory rule se aap safe hain. Sabhi 5 subjects me aap examination ke liye eligible hain.`;
    } else if (
      cleanQuery.includes('fee') ||
      cleanQuery.includes('fees') ||
      cleanQuery.includes('dues') ||
      cleanQuery.includes('paisa') ||
      cleanQuery.includes('receipt')
    ) {
      category = 'fee';
      replyText = `Aapki semester fees poori jama hai (₹52,000 paid). Balance dues ₹0 hain. Official verified PDF receipt aapke Fee portal par available hai.`;
    } else if (
      cleanQuery.includes('bus') ||
      cleanQuery.includes('transport') ||
      cleanQuery.includes('gaadi') ||
      cleanQuery.includes('route')
    ) {
      category = 'transport';
      replyText = `HIET Bus Route 1 (HP-68-9812) abhi Gaggal Chowk ke paas hai. Campus pahunchne ka anumanit samay lagbhag 12 se 14 minute hai. Driver Sh. Jagdish Chand (+91 98160 44101) hain.`;
    } else if (
      cleanQuery.includes('exam') ||
      cleanQuery.includes('paper') ||
      cleanQuery.includes('admit') ||
      cleanQuery.includes('hall ticket') ||
      cleanQuery.includes('seat')
    ) {
      category = 'exam';
      replyText = `Aapka agla End-Term Exam 24 November ko CS-601: Compiler Design ka hai. Aapka assigned seat Desk C-3, Exam Hall 2 (Block A, 2nd Floor) par hai.`;
    } else if (
      cleanQuery.includes('hostel') ||
      cleanQuery.includes('warden') ||
      cleanQuery.includes('outpass') ||
      cleanQuery.includes('room')
    ) {
      category = 'hostel';
      replyText = `Boys Hostel Block A ke Chief Warden Er. Rohit Thakur hain (+91 98160 44321). Weekend leave outpass ke liye digital gatepass portal se apply karein. Curfew time raat 7:30 PM hai.`;
    } else if (
      cleanQuery.includes('hod') ||
      cleanQuery.includes('teacher') ||
      cleanQuery.includes('principal') ||
      cleanQuery.includes('helpdesk') ||
      cleanQuery.includes('contact')
    ) {
      category = 'general';
      replyText = `Computer Science Department ke HOD Dr. Rajesh Kumar hain (+91 98160 11223). College accounts desk ka helpline number 01892-238125 hai.`;
    } else {
      category = 'general';
      replyText = `Aapka prashna HIET Campus desk par record ho gaya hai. Aap attendance, fee dues, bus timings, hostel outpass, ya exam seating ke baare me pooch sakte hain.`;
    }

    const aiMsg: Message = {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category
    };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInputText('');
    speakText(replyText);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleProcessUserQuery(inputText);
  };

  const quickQuestions = [
    { label: 'Meri attendance kitni hai?', query: 'Meri attendance kitni hai?' },
    { label: 'Fees bachi hai kya?', query: 'Mera fees dues kitna hai?' },
    { label: 'College bus kab aayegi?', query: 'College bus timing aur live location batao' },
    { label: 'Next exam aur seat kahan hai?', query: 'Agla exam kab hai aur meri seat kahan hai?' },
    { label: 'Warden sir ka number', query: 'Hostel warden sir ka number batao' }
  ];

  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">
      <PageHeader
        breadcrumbs={[
          { label: 'HIET Digital Campus' },
          { label: 'AI Smart Campus' },
          { label: 'Multilingual Voice Assistant', active: true }
        ]}
        title="Voice AI Campus Assistant (Hindi & English)"
        description="Instant voice & text conversational assistance for students and parents. Check real-time attendance, fees, bus routes, and exam desks by speaking aloud."
        badge="Bilingual Speech Intelligence"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVoiceSpeechEnabled(!voiceSpeechEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                voiceSpeechEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {voiceSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{voiceSpeechEnabled ? 'Spoken Voice On' : 'Voice Muted'}</span>
            </button>
            <button
              type="button"
              onClick={() => setMessages(messages.slice(0, 1))}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Reset Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Main Conversation Quad */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden flex flex-col h-[580px]">
        {/* Quick Suggestion Chips Header */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-black uppercase text-slate-400 whitespace-nowrap pl-1">
            Tap to Ask:
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleProcessUserQuery(q.query)}
              className="px-3 py-1 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-2xs"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-2xs ${
                    isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-[#0f2942] to-emerald-700'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-[80%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-3xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                    {msg.hindiText && (
                      <p className="mt-1.5 pt-1.5 border-t border-slate-200 text-slate-600 font-hindi">
                        {msg.hindiText}
                      </p>
                    )}
                  </div>

                  <div className={`flex items-center gap-2 text-[10px] text-slate-400 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.text)}
                        className="hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Speak</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Live Mic Pulse Visualizer (when listening) */}
        {isListening && (
          <div className="p-3 bg-rose-50 border-t border-rose-100 flex items-center justify-center gap-3 text-rose-800 text-xs font-bold animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
            <span>Listening... Speak now in Hindi or English (बोलिए, सुन रहे हैं...)</span>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleTextSubmit} className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          {speechSupported && (
            <button
              type="button"
              onClick={toggleMic}
              className={`p-3 rounded-2xl transition cursor-pointer shadow-xs ${
                isListening
                  ? 'bg-rose-600 text-white animate-bounce ring-4 ring-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input (Speak Hindi/English)'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Type your question or tap mic to speak in Hindi/English..."
            className="flex-1 p-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-blue-600 shadow-2xs"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition shadow-xs cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
