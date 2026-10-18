import React from 'react';
import {
  FileCheck,
  Printer,
  Download,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  Building,
  CheckCircle2,
  Calendar,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DynamicQRCodeCanvas } from '../common/DynamicQRCodeCanvas';

interface Props {
  onNavigate?: (tab: any) => void;
}

export const AdmitCardPrintView: React.FC<Props> = () => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const studentRoll = student?.roll_no || '26CSE001';
  const studentName = student?.name || user?.name || 'Aarav Sharma';
  const branchName = student?.branch || 'Computer Science & Engineering';
  const semester = student?.semester || 6;

  // HPTU End-Term Exam Schedule for this semester
  const examSchedule = [
    { code: 'CS-601', title: 'Compiler Design', date: '2025-11-24', time: '10:00 AM - 01:00 PM', hall: 'Exam Hall 2 (Block A)' },
    { code: 'CS-602', title: 'Computer Networks', date: '2025-11-27', time: '10:00 AM - 01:00 PM', hall: 'Exam Hall 2 (Block A)' },
    { code: 'CS-603', title: 'Artificial Intelligence & Machine Learning', date: '2025-12-01', time: '10:00 AM - 01:00 PM', hall: 'Exam Hall 1 (Block B)' },
    { code: 'CS-604', title: 'Information Security & Cryptography', date: '2025-12-04', time: '10:00 AM - 01:00 PM', hall: 'Exam Hall 1 (Block B)' },
    { code: 'CS-605', title: 'Software Testing & Quality Assurance', date: '2025-12-08', time: '10:00 AM - 01:00 PM', hall: 'Exam Hall 3 (Block A)' }
  ];

  // Verified Public Document verification URL
  const verificationUrl = `${window.location.origin}/verify/hall-ticket/HT-2025-HIET-${studentRoll}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">
      {/* 1. Header Banner (Screen only) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase mb-2 border border-blue-100">
            <FileCheck className="w-3 h-3 text-blue-600" />
            <span>HPTU Examination Portal • Session Nov-Dec 2025</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Official Examination Admit Card (Hall Ticket)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Verified university admit card with security QR code, verified attendance status, and exam schedule table.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Admit Card</span>
          </button>
        </div>
      </div>

      {/* 2. Official HPTU Hall Ticket Paper (Printable Layout) */}
      <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-10 shadow-lg max-w-4xl mx-auto text-slate-900 font-sans print:border-none print:shadow-none print:p-0">
        {/* University & College Seal Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-full bg-[#0f2942] text-white flex items-center justify-center font-black text-lg shadow-sm">
              HIET
            </div>
          </div>
          <h2 className="text-xl font-black tracking-tight text-[#0f2942] uppercase">
            Himachal Pradesh Technical University, Hamirpur
          </h2>
          <h3 className="text-sm font-bold text-slate-800 uppercase mt-0.5">
            Himachal Institute of Engineering & Technology, Shahpur (Kangra)
          </h3>
          <p className="text-[11px] font-semibold text-slate-600">
            Centre of Examination: HIET Shahpur (Centre Code: 108) • Academic Session: 2025–2026
          </p>
          <div className="inline-block mt-2 px-4 py-1 rounded-full bg-slate-100 border border-slate-400 text-xs font-black uppercase tracking-wider text-slate-900">
            Admit Card (Hall Ticket) — End-Term Theory Examinations
          </div>
        </div>

        {/* Candidate Details & QR Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-5 border-b border-slate-300">
          <div className="md:col-span-3 grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Candidate Name</span>
              <span className="font-bold text-slate-900 text-sm">{studentName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase">University Roll No</span>
              <span className="font-mono font-black text-slate-900 text-sm tracking-wide">{studentRoll}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Degree / Discipline</span>
              <span className="font-semibold text-slate-800">B.Tech • {branchName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Semester</span>
              <span className="font-semibold text-slate-800">Semester {semester} (Regular)</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Father's / Guardian's Name</span>
              <span className="font-semibold text-slate-800">{student?.parent_name || 'Sh. Suresh Sharma'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Institutional Clearance</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Attendance &gt; 75% • No Dues Cleared
              </span>
            </div>
          </div>

          {/* Photo & QR Security Stamp */}
          <div className="flex md:flex-col items-center justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
            <div className="w-24 h-28 border-2 border-dashed border-slate-400 rounded-lg flex flex-col items-center justify-center bg-slate-50 text-[10px] text-slate-500 text-center p-1">
              <span className="font-bold">STUDENT PHOTO</span>
              <span className="text-[9px] text-slate-400 mt-1">Verified Digital Profile</span>
            </div>
            <div className="text-center">
              <div className="p-1.5 bg-white border border-slate-300 rounded-lg inline-block">
                <DynamicQRCodeCanvas value={verificationUrl} size={64} />
              </div>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Scan to Verify</p>
            </div>
          </div>
        </div>

        {/* Examination Subject Datesheet Table */}
        <div className="py-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
            Schedule of Theory Examinations
          </h4>
          <table className="w-full text-xs border border-slate-900">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900 text-left">
                <th className="py-2 px-2.5 border-r border-slate-300">Course Code</th>
                <th className="py-2 px-2.5 border-r border-slate-300">Subject Name</th>
                <th className="py-2 px-2.5 border-r border-slate-300">Date</th>
                <th className="py-2 px-2.5 border-r border-slate-300">Time</th>
                <th className="py-2 px-2.5 border-r border-slate-300 text-center">Room/Hall</th>
                <th className="py-2 px-2.5 text-center">Invigilator Initial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {examSchedule.map(slot => (
                <tr key={slot.code}>
                  <td className="py-2.5 px-2.5 font-mono font-bold text-slate-900 border-r border-slate-300">
                    {slot.code}
                  </td>
                  <td className="py-2.5 px-2.5 font-medium text-slate-800 border-r border-slate-300">
                    {slot.title}
                  </td>
                  <td className="py-2.5 px-2.5 font-semibold text-slate-900 border-r border-slate-300 whitespace-nowrap">
                    {slot.date}
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-700 border-r border-slate-300 whitespace-nowrap">
                    {slot.time}
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-700 text-center border-r border-slate-300">
                    {slot.hall}
                  </td>
                  <td className="py-2.5 px-2.5 text-center text-slate-300 font-mono">
                    [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Important Statutory Exam Instructions */}
        <div className="border-t border-slate-300 pt-3 space-y-1 text-[10px] text-slate-600 leading-snug">
          <p className="font-bold text-slate-800 uppercase">Important Instructions for Candidates:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Candidates must occupy their designated seats 15 minutes before the commencement of examination.</li>
            <li>Mobile phones, smartwatches, digital calculators or any unauthorized electronic gadgets are strictly banned inside the examination hall.</li>
            <li>Admission to the examination hall is subject to presentation of this Admit Card along with the official College Identity Card.</li>
            <li>Candidates failing to meet the statutory 75% attendance criteria are liable for debarment as per HPTU academic ordinances.</li>
          </ul>
        </div>

        {/* Signature & University Authority Seals */}
        <div className="pt-8 flex items-end justify-between text-xs">
          <div className="text-center">
            <div className="w-36 border-b border-slate-800 pb-8 text-[11px] font-bold text-slate-900">
              Candidate's Signature
            </div>
            <p className="text-[10px] text-slate-400 mt-1">(To be signed in presence of Invigilator)</p>
          </div>

          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full border-2 border-[#0f2942] text-[#0f2942] font-black text-[10px] uppercase mb-2">
              SEAL OF EXAM SUPERINTENDENT
            </div>
            <div className="w-40 border-b border-slate-800 pb-2 text-[11px] font-bold text-slate-900">
              Controller of Examinations
            </div>
            <p className="text-[10px] text-slate-500">HPTU / HIET Examination Cell</p>
          </div>
        </div>
      </div>
    </div>
  );
};
