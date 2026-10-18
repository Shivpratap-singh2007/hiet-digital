import React, { useState } from 'react';
import {
  Briefcase,
  GraduationCap,
  Building,
  Calendar,
  CheckCircle2,
  Users,
  Award,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Send,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { campusLifeStore } from '../../lib/campusLifeData';
import { PlacementDrive, AlumniProfile } from '../../types';

interface Props {
  onNavigate?: (tab: any) => void;
}

export const PlacementsAlumniView: React.FC<Props> = () => {
  const { user } = useAuth();
  const { success, info } = useToast();
  const [activeTab, setActiveTab] = useState<'drives' | 'alumni'>('drives');

  const [drives, setDrives] = useState<PlacementDrive[]>(() =>
    campusLifeStore.getPlacementDrives()
  );
  const [alumni] = useState<AlumniProfile[]>(() =>
    campusLifeStore.getAlumniProfiles()
  );

  const [appliedDriveIds, setAppliedDriveIds] = useState<string[]>([]);
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniProfile | null>(null);
  const [mentorshipNote, setMentorshipNote] = useState('');

  const handleApplyDrive = (drive: PlacementDrive) => {
    if (appliedDriveIds.includes(drive.id)) {
      info('Already Registered', `You have already submitted your candidature for ${drive.company_name}.`);
      return;
    }

    setAppliedDriveIds(prev => [...prev, drive.id]);
    success('Application Submitted', `Your profile & academic credentials sent to ${drive.company_name} T&P pool.`);
  };

  const handleSendMentorshipRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlumni) return;

    success('Mentorship Request Sent', `Your request forwarded to ${selectedAlumni.name} (${selectedAlumni.current_company}).`);
    setSelectedAlumni(null);
    setMentorshipNote('');
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase mb-2 border border-blue-100">
              <Briefcase className="w-3 h-3 text-blue-600" />
              <span>Training & Placement Cell • Corporate Relations</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Campus Placements & Alumni Mentorship
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Register for upcoming campus recruitment drives, view eligibility requirements, and connect with distinguished HIET alumni across Fortune 500 tech companies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('drives')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'drives'
                  ? 'bg-[#0f2942] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Recruitment Drives ({drives.length})
            </button>
            <button
              onClick={() => setActiveTab('alumni')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'alumni'
                  ? 'bg-[#0f2942] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Alumni Network ({alumni.length})</span>
            </button>
          </div>
        </div>

        {/* Corporate Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500">Highest Package</span>
            <div className="text-base font-black text-slate-900 mt-0.5">₹18.5 LPA</div>
            <span className="text-[10px] text-emerald-600 font-semibold">TCS / Amazon pool</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500">Average CTC</span>
            <div className="text-base font-black text-slate-900 mt-0.5">₹5.4 LPA</div>
            <span className="text-[10px] text-slate-400">Class of 2025</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500">Recruiting Partners</span>
            <div className="text-base font-black text-slate-900 mt-0.5">65+ Companies</div>
            <span className="text-[10px] text-slate-400">MOU with Tier-1 MNCs</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500">Placement Ratio</span>
            <div className="text-base font-black text-emerald-700 mt-0.5">92% Eligible</div>
            <span className="text-[10px] text-slate-400">Pre-placement training</span>
          </div>
        </div>
      </div>

      {/* 2. Recruitment Drives View */}
      {activeTab === 'drives' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#0f2942]" />
              <span>Active Campus Recruitment Drives</span>
            </h2>
            <span className="text-xs text-slate-500">Session 2025–26</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drives.map(drive => {
              const isApplied = appliedDriveIds.includes(drive.id);
              return (
                <div
                  key={drive.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:border-slate-300 transition space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                          Corporate Drive
                        </span>
                        <h3 className="font-black text-slate-900 text-base leading-tight">
                          {drive.company_name}
                        </h3>
                        <p className="text-xs font-semibold text-blue-700 mt-0.5">
                          {drive.role}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 inline-block font-mono">
                          {drive.package_lpa}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {drive.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Eligibility</span>
                        <span className="font-semibold text-slate-800">
                          Min {drive.min_cgpa} CGPA • {drive.eligible_branches.join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                        <span className="font-semibold text-slate-800">{drive.job_location}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Drive Date</span>
                        <span className="font-semibold text-slate-800">{drive.drive_date}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Reg. Deadline</span>
                        <span className="font-bold text-rose-700">{drive.registration_deadline}</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Selection Process</span>
                      <div className="flex flex-wrap gap-1.5">
                        {drive.selection_rounds.map((round, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                          >
                            {i + 1}. {round}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {drive.total_applicants || 40} Students Applied
                    </span>

                    <button
                      onClick={() => handleApplyDrive(drive)}
                      disabled={isApplied}
                      className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                        isApplied
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-[#0f2942] hover:bg-[#0a1c2e] text-white shadow-xs'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Registered</span>
                        </>
                      ) : (
                        <>
                          <span>Apply for Drive</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Alumni Mentorship Network View */}
      {activeTab === 'alumni' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#0f2942]" />
              <span>Distinguished Alumni Mentorship Directory</span>
            </h2>
            <span className="text-xs text-slate-500">HIET Alumni Association</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alumni.map(person => (
              <div
                key={person.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:border-slate-300 transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0f2942] text-white font-black text-sm flex items-center justify-center shrink-0">
                      {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{person.name}</h3>
                      <p className="text-[11px] text-slate-500 font-semibold">{person.batch_year}</p>
                      <p className="text-[10px] text-blue-700 font-bold">{person.branch}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <div className="font-bold text-slate-900">{person.designation}</div>
                    <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <Building className="w-3 h-3 text-emerald-600" />
                      <span>{person.current_company}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{person.location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Open to Mentorship</span>
                  </span>

                  <button
                    onClick={() => setSelectedAlumni(person)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0f2942] text-slate-700 hover:text-white font-bold text-xs transition cursor-pointer"
                  >
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mentorship Request Modal */}
      {selectedAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Request Guidance from {selectedAlumni.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedAlumni.designation} at {selectedAlumni.current_company}
            </p>

            <form onSubmit={handleSendMentorshipRequest} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Introduce yourself and what advice you are seeking
                </label>
                <textarea
                  value={mentorshipNote}
                  onChange={(e) => setMentorshipNote(e.target.value)}
                  rows={3}
                  required
                  placeholder="E.g., I am in 6th semester CSE preparing for Cloud & DevOps roles. Would love guidance on your preparation journey..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0f2942]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlumni(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
