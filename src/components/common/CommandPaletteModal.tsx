import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  CalendarCheck, 
  Clock, 
  BookOpen, 
  FileText, 
  GraduationCap, 
  ShieldCheck, 
  HelpCircle, 
  AlertCircle, 
  Layers, 
  Calendar, 
  Trophy, 
  Settings, 
  User, 
  Building2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { isStudentHosteler } from '../../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onOpenAiAssistant?: () => void;
}

interface CommandItem {
  id: string;
  tab: NavTab;
  title: string;
  category: 'Academics' | 'Campus Presence & Passes' | 'Student Services' | 'Institutional' | 'Preferences';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
  roles?: string[];
}

const COMMAND_ITEMS: CommandItem[] = [
  // Academics
  {
    id: 'cmd-timetable',
    tab: 'timetable',
    title: 'Daily Lecture Schedule & Timetable',
    category: 'Academics',
    description: 'Check active class, room allocation, and weekly schedule',
    icon: Clock,
    keywords: ['schedule', 'timetable', 'classes', 'period', 'lecture', 'routine', 'time']
  },
  {
    id: 'cmd-attendance',
    tab: 'attendance',
    title: 'Academic Attendance & Eligibility',
    category: 'Academics',
    description: 'Review 75% statutory criteria and scan classroom QR',
    icon: CalendarCheck,
    keywords: ['attendance', 'present', 'absent', 'scan', 'qr', 'percentage', '75']
  },
  {
    id: 'cmd-assignments',
    tab: 'assignments',
    title: 'Assignments & Lab Submissions',
    category: 'Academics',
    description: 'View active homework deadlines, submit PDFs, and view grades',
    icon: FileText,
    keywords: ['assignment', 'homework', 'submission', 'upload', 'due', 'grade']
  },
  {
    id: 'cmd-syllabus',
    tab: 'syllabus',
    title: 'Syllabus & Course Modules',
    category: 'Academics',
    description: 'Download unit-wise curriculum and course objectives',
    icon: BookOpen,
    keywords: ['syllabus', 'curriculum', 'units', 'topics', 'course']
  },
  {
    id: 'cmd-pyqs',
    tab: 'pyqs',
    title: 'Previous Year Question Papers (PYQs)',
    category: 'Academics',
    description: 'HPTU archive question papers and solution keys',
    icon: BookOpen,
    keywords: ['pyq', 'question paper', 'exam paper', 'previous year', 'old paper']
  },
  {
    id: 'cmd-sessional',
    tab: 'sessional_results',
    title: 'Sessional & Mid-Term Marks',
    category: 'Academics',
    description: 'Verified MST marks, internal assessments, and answer keys',
    icon: GraduationCap,
    keywords: ['sessional', 'mst', 'marks', 'score', 'internal', 'exam']
  },
  {
    id: 'cmd-cgpa',
    tab: 'cgpa',
    title: 'End-Semester Grades & SGPA/CGPA',
    category: 'Academics',
    description: 'Semester-wise grade report cards and transcript breakdown',
    icon: GraduationCap,
    keywords: ['cgpa', 'sgpa', 'result', 'grade', 'marksheet', 'percentage']
  },

  // Campus Presence & Passes
  {
    id: 'cmd-gatepass',
    tab: 'gate_pass',
    title: 'Digital Gate Pass',
    category: 'Campus Presence & Passes',
    description: 'Apply for transit day pass and show signed QR to campus security',
    icon: ShieldCheck,
    keywords: ['gate pass', 'outpass', 'exit', 'entry', 'security', 'guard', 'transit']
  },
  {
    id: 'cmd-hostel',
    tab: 'hostel_outpass',
    title: 'Hostel Night & Weekend Outpass',
    category: 'Campus Presence & Passes',
    description: 'Submit hostel leave request with parent phone confirmation',
    icon: Building2,
    keywords: ['hostel', 'warden', 'night pass', 'home', 'weekend outpass', 'room']
  },
  {
    id: 'cmd-nodues',
    tab: 'no_dues',
    title: '5-Department No-Dues Clearance',
    category: 'Campus Presence & Passes',
    description: 'Track clearance from Accounts, Library, Hostel, Labs, and Sports',
    icon: ShieldCheck,
    keywords: ['no dues', 'clearance', 'hall ticket', 'admit card', 'fees', 'library fine']
  },

  // Student Services
  {
    id: 'cmd-leaves',
    tab: 'leaves',
    title: 'Apply Student Leave',
    category: 'Student Services',
    description: 'Multi-stage leave approval workflow (Faculty → HOD → Principal)',
    icon: Clock,
    keywords: ['leave', 'holiday', 'sick', 'medical', 'application', 'absence']
  },
  {
    id: 'cmd-doubts',
    tab: 'doubts',
    title: 'Academic Doubts & Questions Box',
    category: 'Student Services',
    description: 'Post concept queries to subject teachers with code/formula support',
    icon: HelpCircle,
    keywords: ['doubt', 'question', 'ask', 'teacher', 'concept', 'query']
  },
  {
    id: 'cmd-complaints',
    tab: 'complaints',
    title: 'Student Grievance & Complaint Portal',
    category: 'Student Services',
    description: 'Anti-ragging, academic, maintenance, and hostel grievances',
    icon: AlertCircle,
    keywords: ['complaint', 'grievance', 'issue', 'ragging', 'helpdesk', 'problem']
  },
  {
    id: 'cmd-lostfound',
    tab: 'lost_found',
    title: 'Lost & Found Campus Registry',
    category: 'Student Services',
    description: 'Report or claim misplaced items with challenge-response verification',
    icon: Layers,
    keywords: ['lost', 'found', 'wallet', 'id card', 'bottle', 'calculator', 'bag']
  },

  // Institutional
  {
    id: 'cmd-calendar',
    tab: 'calendar',
    title: 'Institutional Academic Calendar',
    category: 'Institutional',
    description: 'HPTU examination schedules, holidays, and college festival dates',
    icon: Calendar,
    keywords: ['calendar', 'holiday', 'event', 'exam date', 'festival', 'vacation']
  },
  {
    id: 'cmd-notices',
    tab: 'notices',
    title: 'Official Circulars & Notices',
    category: 'Institutional',
    description: 'Administration bulletins, exam circulars, and departmental orders',
    icon: FileText,
    keywords: ['notice', 'circular', 'news', 'bulletin', 'announcement', 'order']
  },
  {
    id: 'cmd-achievements',
    tab: 'achievements',
    title: 'Student Achievements & Honors',
    category: 'Institutional',
    description: 'Institute honor roll, sports trophies, and technical hackathon wins',
    icon: Trophy,
    keywords: ['achievement', 'trophy', 'winner', 'award', 'certificate', 'honor']
  },

  // Preferences & Profile
  {
    id: 'cmd-profile',
    tab: 'profile',
    title: 'My Profile & Institutional ID',
    category: 'Preferences',
    description: 'View registered roll number, branch, semester, and personal details',
    icon: User,
    keywords: ['profile', 'me', 'id card', 'account', 'email', 'phone']
  },
  {
    id: 'cmd-settings',
    tab: 'settings',
    title: 'Account & Security Settings',
    category: 'Preferences',
    description: 'Change password, manage security devices, and notification toggles',
    icon: Settings,
    keywords: ['settings', 'password', 'security', 'preferences', 'notification']
  }
];

export const CommandPaletteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenAiAssistant
}) => {
  const { role, user } = useAuth();
  const student = user?.studentMaster;
  const isHosteler = isStudentHosteler(student);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredCommands = COMMAND_ITEMS.filter(cmd => {
    if (cmd.roles && role && !cmd.roles.includes(role)) return false;
    // Hide hostel outpass command for day scholars
    if (role === 'student' && cmd.tab === 'hostel_outpass' && !isHosteler) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.keywords.some(k => k.includes(q))
    );
  });

  const handleSelect = (cmd: CommandItem) => {
    onNavigateTab(cmd.tab);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1 < filteredCommands.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[75vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a feature, course, gate pass, or timetable..."
            className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-200 text-slate-600 rounded font-mono font-bold">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-slate-100/60 max-h-[50vh]">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-3 cursor-pointer ${
                    isSelected 
                      ? 'bg-[#0f2942] text-white shadow-xs' 
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </h4>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                        isSelected ? 'bg-white/20 text-cyan-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                      {item.description}
                    </p>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-300' : 'text-slate-300'}`} />
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No matching campus features found</p>
              <p className="text-[11px] text-slate-400">Try searching for &quot;attendance&quot;, &quot;marks&quot;, &quot;leaves&quot;, or &quot;gate pass&quot;</p>
              {onOpenAiAssistant && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAiAssistant();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 transition mt-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ask Campus AI Assistant instead</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↓</kbd> to navigate</span>
            <span><kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↵</kbd> to select</span>
          </div>
          <span className="font-semibold text-slate-500">HIET Command Palette</span>
        </div>
      </div>
    </div>
  );
};
