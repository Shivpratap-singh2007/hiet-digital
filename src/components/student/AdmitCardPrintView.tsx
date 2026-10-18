import React, { useState } from 'react';
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
  Clock,
  MapPin,
  Scan,
  User,
  Eye,
  Sparkles
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

  // View mode: 'ticket' (Printable Hall ticket) | 'seating' (Interactive Seating Locator)
  const [viewMode, setViewMode] = useState<'ticket' | 'seating'>('ticket');
  const [invigilatorVerified, setInvigilatorVerified] = useState(false);

  // HPTU End-Term Exam Schedule for this semester
  const examSchedule = [
    { code: 'CS-601', title: 'Compiler Design', date: '2025-11-24', time: '10:00 AM - 01:00 PM', hall: 'Exam Hall 2 (Block A)', desk: 'Desk C-3' },
    { code: 'CS-602', title: 'Computer Networks', date: '2025-11-27', time: '10:00 AM - 01:00 PM', hall: 'Exam Hall 2 (Block A)', desk: 'Desk C-3' },
    { code: 'CS-603', title: 'Artificial Intelligence & Machine Learning', date: '2025-12-01', time: '10:00 AM - 01:00 PM', hall: 'Exam Hall 1 (Block B)', desk: 'Desk B-11' },
    { code: 'CS-604', title: 'Information Security & Cryptography', date: '2025-12-04', time: '10:00 AM - 01:00 PM', hall: 'Exam Hall 1 (Block B)', desk: 'Desk B-11' },
    { code: 'CS-605', title: 'Software Testing & Quality Assurance', date: '2025-12-08', time: '10:00 AM - 01:00 PM', hall: 'Exam Hall 3 (Block A)', desk: 'Desk D-08' }
  ];

  // Verified Public Document verification URL
  const verificationUrl = `${window.location.origin}/verify/hall-ticket/HT-2025-HIET-${studentRoll}`;

  const handlePrint = () => {
    window.print();
  };

  const handleSimulateInvigilatorScan = () => {
    setInvigilatorVerified(true);
    setTimeout(() => setInvigilatorVerified(false), 5000);
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
            Official Examination Admit Card & Seating Locator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Verified university admit card with security QR code, verified attendance status, and 3D exam room desk seating locator.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('ticket')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'ticket' ? 'bg-[#0f2942] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Printable Admit Card
            </button>
            <button
              type="button"
              onClick={() => setViewMode('seating')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'seating' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>Exam Seating Locator</span>
            </button>
          </div>

          {viewMode === 'ticket' && (
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* 1.5. Interactive Seating Locator Mode */}
      {viewMode === 'seating' && (
        <div className="space-y-6 no-print">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0f2942] to-[#1a385c] text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-300 uppercase block mb-1">
                  Examination Hall Layout • Active Center 108
                </span>
                <h3 className="text-xl font-extrabold text-white">Exam Hall 2 (Block A, 2nd Floor)</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Subject: <strong>CS-601: Compiler Design</strong> • Date: <strong>24 Nov 2025</strong> • Timing: <strong>10:00 AM - 01:00 PM</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Center Superintendent</span>
                <div className="font-bold text-white text-sm">Dr. S. K. Pathania</div>
                <div className="text-emerald-300 font-mono text-[11px]">Room Invigilator: Desk #01</div>
              </div>
            </div>

            {/* Quick Invigilator Scanner Simulation */}
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-200">
                Assigned Desk: <strong className="text-amber-300 text-base font-black ml-1">Desk C-3 (Row 3, Col 3)</strong>
              </div>
              <button
                type="button"
                onClick={handleSimulateInvigilatorScan}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Simulate Invigilator Scan Verification</span>
              </button>
            </div>
          </div>

          {/* Invigilator Scan Toast */}
          {invigilatorVerified && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between animate-fade-in shadow-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="block text-sm">✓ CANDIDATE AUTHENTICATED & VERIFIED</strong>
                  <span>Roll No: {studentRoll} • Aarav Sharma • Attendance: 84.6% (&gt; 75% HPTU) • Fee Status: CLEARED</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase">
                ENTRY APPROVED
              </span>
            </div>
          )}

          {/* Visual 5x4 Grid Layout of the Hall */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Interactive Hall Desk Grid (Front Blackboard at Top)</span>
                </h4>
                <p className="text-xs text-slate-400">Green glowing desk represents your verified seat.</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-slate-600 text-[11px]">
                  <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block"></span> Other Candidates
                </span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                  <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span> Your Seat (C-3)
                </span>
              </div>
            </div>

            {/* Blackboard Banner */}
            <div className="w-full py-2 bg-slate-800 text-slate-300 text-center text-xs font-mono font-bold rounded-xl tracking-widest uppercase">
              ▲ INSTRUCTOR & INVIGILATOR DAIS / WHITEBOARD ▲
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pt-2">
              {['A', 'B', 'C', 'D', 'E'].map(col =>
                [1, 2, 3, 4].map(row => {
                  const deskCode = `${col}-${row}`;
                  const isUserSeat = deskCode === 'C-3';
                  return (
                    <div
                      key={deskCode}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                        isUserSeat
                          ? 'border-emerald-600 bg-emerald-500 text-white shadow-md ring-4 ring-emerald-200 scale-105'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`text-[10px] font-bold ${isUserSeat ? 'text-emerald-100' : 'text-slate-400'}`}>
                        Desk
                      </span>
                      <strong className="text-sm font-black">{deskCode}</strong>
                      {isUserSeat ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-white text-emerald-800 mt-1 uppercase">
                          YOU (26CSE001)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Occupied</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Official HPTU Hall Ticket Paper (Printable Layout) */}
      {viewMode === 'ticket' && (
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
      )}
    </div>
  );
};
