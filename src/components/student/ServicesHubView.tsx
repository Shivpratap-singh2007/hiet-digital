import React from 'react';
import { 
  Clock, 
  AlertCircle, 
  Trophy, 
  FileSpreadsheet, 
  Bell, 
  Share2, 
  QrCode, 
  HelpCircle, 
  Camera, 
  ArrowRight,
  ShieldCheck,
  Building2,
  CreditCard,
  BellRing,
  BarChart3
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { NavTab } from '../common/Sidebar';

interface Props {
  onNavigate: (tab: NavTab) => void;
}

export const ServicesHubView: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const studentRoll = user?.studentMaster?.roll_no || 'CSE001';
  const studentId = user?.student_id || 'std-cse-001';

  const myLeaves = dataStore.getLeaves().filter(l => l.student_id === studentId || l.student_roll === studentRoll || l.submitted_by_user_id === user?.id);
  const myComplaints = dataStore.getComplaints().filter(c => c.student_id === studentId);
  const myDoubts = dataStore.getDoubts().filter(d => d.student_id === studentId);
  const myAchievements = dataStore.getAchievements().filter(a => a.student_id === studentId);
  const latestNotice = dataStore.getNotices()[0];

  const services = [
    {
      id: 'leaves' as NavTab,
      title: 'Online Leave Application',
      desc: 'Submit medical or personal leave requests with document proof and real-time approval status.',
      badge: `${myLeaves.length} Applied`,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Clock,
      iconColor: 'text-blue-600 bg-blue-50'
    },
    {
      id: 'complaints' as NavTab,
      title: 'Complaint & Grievance Box',
      desc: 'File confidential or anonymous complaints with tracking and MD escalation protection.',
      badge: `${myComplaints.length} Submitted`,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertCircle,
      iconColor: 'text-rose-600 bg-rose-50'
    },
    {
      id: 'achievements' as NavTab,
      title: 'Student Achievements Portal',
      desc: 'Submit hackathon wins, sports, certifications, and research for official faculty verification.',
      badge: `${myAchievements.length} Recorded`,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Trophy,
      iconColor: 'text-amber-600 bg-amber-50'
    },
    {
      id: 'doubts' as NavTab,
      title: 'Faculty Doubt Clearing',
      desc: 'Direct one-on-one academic messaging with course teachers and HODs.',
      badge: `${myDoubts.length} Doubts`,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: HelpCircle,
      iconColor: 'text-purple-600 bg-purple-50'
    },
    {
      id: 'gate_pass' as any,
      title: 'Digital Gate Pass (QR)',
      desc: 'Generate secure digital QR pass for campus entry/exit verification by security guards.',
      badge: 'QR Active',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: QrCode,
      iconColor: 'text-emerald-600 bg-emerald-50'
    },
    {
      id: 'fines' as any,
      title: 'College Fines & Dispute Appeals',
      desc: 'View issued disciplinary or library dues, payment challan references, and submit formal HOD appeals.',
      badge: 'Clearance',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: CreditCard,
      iconColor: 'text-rose-600 bg-rose-50'
    },
    {
      id: 'analytics' as any,
      title: 'Student Academic Analytics',
      desc: 'Subject attendance rates, semester SGPA trends, and verified achievements directory.',
      badge: 'Live Trends',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: BarChart3,
      iconColor: 'text-blue-600 bg-blue-50'
    },
    {
      id: 'push_settings' as any,
      title: 'Push Notifications & Alerts',
      desc: 'Manage browser push tokens, lecture reminders, timetable change alerts, and exam notifications.',
      badge: 'PWA Push',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: BellRing,
      iconColor: 'text-purple-600 bg-purple-50'
    },
    {
      id: 'assignments' as NavTab,
      title: 'Online Assignments',
      desc: 'View subject assignments, submit solutions, track deadlines, and review teacher grades.',
      badge: 'Submissions',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: FileSpreadsheet,
      iconColor: 'text-emerald-600 bg-emerald-50'
    },
    {
      id: 'notices' as NavTab,
      title: 'College Notice Board',
      desc: latestNotice ? `Latest: ${latestNotice.title}` : 'Official notices and exam timetables.',
      badge: 'Official',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Bell,
      iconColor: 'text-indigo-600 bg-indigo-50'
    },
    {
      id: 'social_links' as any,
      title: 'HIET Official Social Media',
      desc: 'Official college website, Instagram, Facebook, and YouTube channels.',
      badge: 'Verified',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Share2,
      iconColor: 'text-slate-600 bg-slate-100'
    },
    {
      id: 'gallery' as NavTab,
      title: 'Campus Life & Gallery',
      desc: 'Explore campus infrastructure, annual festivals, AI labs, and convocation moments.',
      badge: 'HD Photos',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: Camera,
      iconColor: 'text-teal-600 bg-teal-50'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-1.5 border border-blue-100">
          <Building2 className="w-3.5 h-3.5" />
          <span>Student Help-Desk & Campus Services</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Campus Services Hub
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Access all student services, leaves, grievances, campus navigation, and digital gate pass in one place.
        </p>
      </div>

      {/* Grid of Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              onClick={() => onNavigate(s.id)}
              className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-xs hover:shadow-sm transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-xl ${s.iconColor} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${s.badgeColor}`}>
                    {s.badge}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {s.desc}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                <span>Access Service</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
