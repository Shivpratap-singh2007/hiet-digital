import React, { useState } from 'react';
import { 
  HeartHandshake, 
  ShieldCheck, 
  CalendarCheck, 
  Receipt, 
  Phone, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Award, 
  User, 
  FileText,
  Building,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { NavTab } from '../common/Sidebar';
import { campusLifeStore } from '../../lib/campusLifeData';
import { isStudentHosteler } from '../../lib/utils';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const ParentPortalView: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const isHosteler = isStudentHosteler(student);

  const studentName = student?.name || user?.name || 'Aarav Sharma';
  const studentRoll = student?.roll_no || '26CSE001';
  const studentBranch = student?.branch || 'Computer Science & Engineering';
  const studentSemester = student?.semester || 6;
  const mentorName = 'Er. Rohit Thakur';
  const mentorPhone = '+919816044321';
  const hodName = 'Dr. Rajesh Kumar';
  const hodPhone = '+919816011223';

  // Fee Data from store
  const feeRecords = campusLifeStore.getFeeRecords(studentRoll);
  const latestFee = feeRecords[0];

  // Subject Attendance Sample
  const attendanceSubjects = [
    { code: 'CS-601', name: 'Compiler Design', total: 42, attended: 36, pct: 86 },
    { code: 'CS-602', name: 'Machine Learning', total: 40, attended: 37, pct: 92 },
    { code: 'CS-603', name: 'Cloud Computing', total: 38, attended: 30, pct: 79 },
    { code: 'CS-604', name: 'Web Technologies', total: 45, attended: 42, pct: 94 },
    { code: 'CS-605', name: 'Software Testing', total: 36, attended: 30, pct: 83 }
  ];

  const overallAttPct = Math.round(
    attendanceSubjects.reduce((acc, s) => acc + s.pct, 0) / attendanceSubjects.length
  );

  // Outpass History (if hosteler)
  const [parentConsentConfirmed, setParentConsentConfirmed] = useState(true);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'HIET Digital Campus' },
          { label: 'Parent & Guardian Portal', active: true }
        ]}
        title="Parent / Guardian Suraksha & Progress Desk"
        description="Official institutional transparency portal for real-time attendance, fee clearances, outpasses, and academic performance."
        badge="Direct Parent Transparency"
        actions={
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${mentorPhone.replace('+', '')}?text=Namaste%20Er.%20Rohit%20Thakur,%20I%20am%20calling%20regarding%20my%20ward%20${encodeURIComponent(studentName)}%20(${studentRoll})`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Mentor</span>
            </a>
            <a
              href={`tel:${mentorPhone}`}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Call Mentor</span>
            </a>
          </div>
        }
      />

      {/* Ward Profile Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0f2942] to-[#1e3a5f] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-black text-2xl shrink-0">
            {studentName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">{studentName}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE STUDENT
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Roll No: <strong className="text-white">{studentRoll}</strong> • {studentBranch} • Semester {studentSemester}
            </p>
            <span className="text-[11px] text-slate-300">
              Campus Status: {isHosteler ? 'Hosteler (Boys Hostel Block A)' : 'Day Scholar (HIET Bus Route)'}
            </span>
          </div>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-300 block">Class Mentor / Incharge</span>
          <p className="font-extrabold text-white text-sm">{mentorName}</p>
          <span className="text-emerald-300 font-mono text-xs">{mentorPhone}</span>
        </div>
      </div>

      {/* 4 Core Pillars KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={CalendarCheck}
          label="Attendance Health"
          value={`${overallAttPct}%`}
          badgeColor={overallAttPct >= 75 ? 'emerald' : 'rose'}
          subtext={overallAttPct >= 75 ? '75% HPTU Compliant' : 'Short Attendance Risk'}
        />
        <StatCard
          icon={Receipt}
          label="Semester Fees"
          value={latestFee?.paid_amount ? `₹${latestFee.paid_amount.toLocaleString()}` : '₹52,000'}
          badgeColor="emerald"
          subtext="Dues Fully Cleared"
        />
        <StatCard
          icon={Award}
          label="Current CGPA"
          value="8.42"
          badgeColor="blue"
          subtext="Rank 4 in Department"
        />
        <StatCard
          icon={ShieldCheck}
          label="Discipline Record"
          value="Exemplary"
          badgeColor="amber"
          subtext="Zero Penalties"
        />
      </div>

      {/* Two Column Grid: Attendance & Hostel Outpass */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Subject-Wise Attendance Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  <span>Subject-Wise Attendance Progress</span>
                </h4>
                <p className="text-xs text-slate-500">Live biometric and classroom attendance record</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Overall: {overallAttPct}%
              </span>
            </div>

            <div className="space-y-3">
              {attendanceSubjects.map(sub => (
                <div key={sub.code} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-extrabold text-slate-900 block">{sub.name}</span>
                      <span className="text-[10px] text-slate-500">{sub.code} • Attended {sub.attended} / {sub.total} Lectures</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-black ${
                      sub.pct >= 85 ? 'bg-emerald-100 text-emerald-800' :
                      sub.pct >= 75 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {sub.pct}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sub.pct >= 85 ? 'bg-emerald-600' :
                        sub.pct >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${sub.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs flex items-center justify-between">
              <span>Detailed subject calendar and lecture notes:</span>
              <button
                type="button"
                onClick={() => onNavigate?.('attendance')}
                className="font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <span>View Attendance Desk</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Fee Status & Hostel Outpass Verification (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Fee Verification Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Fee Ledger Status</span>
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                PAID & CLEARED
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Total Semester 6 Fee:</span>
                <span className="font-extrabold text-slate-900">₹52,000</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Amount Paid:</span>
                <span className="font-extrabold text-emerald-700">₹52,000</span>
              </div>
              <div className="flex justify-between text-xs font-bold border-t border-emerald-200/60 pt-1">
                <span className="text-slate-800">Remaining Balance:</span>
                <span className="text-emerald-800">₹0 (Zero Dues)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate?.('fees')}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Official Fee Receipt (PDF)</span>
            </button>
          </div>

          {/* Hostel Outpass Consent Verification */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Hostel Outpass & Safety</span>
              </h4>
              <span className="text-[10px] font-bold text-slate-500">Security Guard Sync</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-slate-900 block">Weekend Outpass • Dharamshala</span>
                  <span className="text-[10px] text-slate-500">Depart: 18 Apr 17:00 • Return: 20 Apr 18:00</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  APPROVED
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-200 text-[11px] text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Parent WhatsApp Consent: <strong>Confirmed by SMS OTP</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-600 font-medium">Automatic SMS Alerts on Gate Exit:</span>
              <span className="font-bold text-emerald-700">Enabled</span>
            </div>
          </div>

          {/* Institutional Contact Directory */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="font-extrabold text-slate-800 block flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-600" />
              <span>HIET Institutional Helpdesk</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Head of Department:</span>
                <span className="font-bold text-slate-800">{hodName}</span>
                <span className="text-slate-600 font-mono block">{hodPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Accounts Office:</span>
                <span className="font-bold text-slate-800">Sh. S. P. Sharma</span>
                <span className="text-slate-600 font-mono block">01892-238125</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
