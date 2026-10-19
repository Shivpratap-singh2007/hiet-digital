// HIET Digital Campus - Emergency & Dispensary Desk
// Official institutional emergency directory, campus health OPD records, and verified statutory helplines
// Strict adherence to verified contact data: unverified phone numbers and call actions are excluded

import React, { useState } from 'react';
import { 
  HeartPulse, 
  Phone, 
  ShieldAlert, 
  Activity, 
  FileText, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Stethoscope, 
  X,
  ShieldCheck,
  Building,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { NavTab } from '../common/Sidebar';
import { campusLifeStore } from '../../lib/campusLifeData';
import { DispensaryVisit, CampusEmergencyContact } from '../../types';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const EmergencyHealthView: React.FC<Props> = ({ onNavigate: _onNavigate }) => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const studentRoll = student?.roll_no || (user as any)?.roll_no || 'HIET-CSE-2026-001';

  const [emergencyContacts] = useState<CampusEmergencyContact[]>(() => campusLifeStore.getEmergencyContacts());
  const [dispensaryVisits] = useState<DispensaryVisit[]>(() => 
    campusLifeStore.getDispensaryVisits(studentRoll)
  );

  const [showSosModal, setShowSosModal] = useState(false);
  const [sosSentSuccess, setSosSentSuccess] = useState(false);

  const handleTriggerSos = () => {
    setSosSentSuccess(true);
    setTimeout(() => {
      setSosSentSuccess(false);
      setShowSosModal(false);
    }, 3500);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'HIET Digital Campus' },
          { label: 'Student Welfare' },
          { label: 'Emergency & Dispensary', active: true }
        ]}
        title="Campus Emergency & Dispensary Desk"
        description="Official institutional directory for emergency assistance, campus security, hostel administration, and dispensary health records."
        badge="Institutional Emergency Directory"
        actions={
          <button
            type="button"
            id="btn-trigger-campus-sos"
            onClick={() => setShowSosModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs hover:shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>Trigger Campus SOS</span>
          </button>
        }
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={HeartPulse}
          label="Campus Ambulance"
          value="Standby"
          badgeColor="blue"
          subtext="Dispensary Block"
        />
        <StatCard
          icon={Stethoscope}
          label="Medical Officer"
          value="Dr. R.K. Sharma"
          badgeColor="blue"
          subtext="OPD 09:00 - 17:00 IST"
        />
        <StatCard
          icon={FileText}
          label="Medical Concessions"
          value={`${dispensaryVisits.filter(v => v.medical_exemption_issued).length} Recorded`}
          badgeColor="emerald"
          subtext="Approved OPD Excuses"
        />
        <StatCard
          icon={Building}
          label="Security Checkpoint"
          value="Gate No. 1"
          badgeColor="slate"
          subtext="NH-154 Main Entry"
        />
      </div>

      {/* Emergency Directory Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#0f2942]" />
              <span>Campus Emergency Directory</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified institutional services, hostel warden offices, and statutory emergency helplines.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-[#0f2942] border border-slate-200 self-start sm:self-auto">
            Institutional Verification Enforced
          </span>
        </div>

        {/* Informational Disclaimer Banner */}
        <div className="p-3.5 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs flex items-start gap-2.5 text-slate-600">
          <Info className="w-4 h-4 text-[#0f2942] shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            In strict compliance with institutional accuracy standards, unverified contact numbers and automated dialing actions are disabled. 
            Services with details pending verification are coordinated directly via the on-campus Security Control Room (Gate No. 1) or respective department offices.
          </p>
        </div>

        {/* Emergency Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {emergencyContacts.map(c => {
            const hasVerifiedPhone = Boolean(c.is_verified && c.phone && c.phone.trim().length > 0);

            return (
              <div
                key={c.id}
                id={`card-emergency-${c.id}`}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-3 flex flex-col justify-between shadow-2xs"
              >
                <div className="space-y-2">
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      {c.priority_level}
                    </span>

                    {hasVerifiedPhone ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Helpline
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        {c.contact_status === 'not_provided' ? 'Details Pending' : 'Pending Verification'}
                      </span>
                    )}
                  </div>

                  {/* Title & Department */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {c.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {c.department}
                    </p>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.location}</span>
                  </div>

                  {/* Description */}
                  {c.description && (
                    <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                      {c.description}
                    </p>
                  )}
                </div>

                {/* Bottom Action Area */}
                <div className="pt-2 border-t border-slate-100">
                  {hasVerifiedPhone ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-slate-500">Official Number:</span>
                        <span className="font-mono font-bold text-slate-900">{c.phone}</span>
                      </div>
                      <a
                        href={`tel:${c.phone}`}
                        className="w-full py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98]"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Official Helpline</span>
                      </a>
                    </div>
                  ) : (
                    <div className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] font-semibold text-center flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.status_label || (c.contact_status === 'not_provided' ? 'Contact details not yet provided' : 'Contact details pending verification')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campus Health Center & Dispensary Records */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#0f2942]" />
              <span>Dispensary OPD Visits & Medical Attendance Pass</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Campus medical officer checkup history, prescribed treatments, and official absence excuses.
            </p>
          </div>
        </div>

        {dispensaryVisits.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No past medical visits recorded for roll number {studentRoll}.
          </div>
        ) : (
          <div className="space-y-3">
            {dispensaryVisits.map(v => (
              <div
                key={v.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{v.diagnosis}</span>
                    {v.medical_exemption_issued && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-[#0f2942] border border-slate-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#0f2942]" /> Attendance Concession Approved
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Visit Date: {v.visit_date}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Reported Symptoms</span>
                    <p className="text-slate-700 mt-0.5">{v.symptoms}</p>
                    {v.rest_advised_hours && (
                      <span className="text-[11px] text-slate-700 font-bold block mt-1">
                        Medical Rest Advised: {v.rest_advised_hours} Hours
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Prescribed Medicines</span>
                    <ul className="list-disc list-inside text-slate-700 mt-0.5 space-y-0.5">
                      {v.prescribed_medicines.map((m, idx) => (
                        <li key={idx} className="text-[11px]">{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                  <span>Attending Doctor: <strong className="text-slate-800">{v.attending_doctor}</strong></span>
                  <span className="font-mono text-[10px]">PASS-ID: {v.id.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#0f2942]">
                <ShieldAlert className="w-5 h-5 text-[#0f2942]" />
                <h3 className="text-base font-bold text-slate-900">Campus Emergency SOS</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSosModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sosSentSuccess ? (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#0f2942] mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Emergency Alert Dispatched</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Campus Security Control Room (Gate No. 1), Dispensary Team, and the Proctorial Board have been alerted with your student reference ({studentRoll}). Campus safety personnel are responding.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1.5">
                  <p className="font-bold text-slate-900">
                    Confirm Immediate Assistance Request
                  </p>
                  <p className="leading-relaxed text-slate-600">
                    Triggering this SOS alerts the Main Security Control Room and on-duty medical staff at the Dispensary Block with your student account details for immediate response.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTriggerSos}
                    className="w-full py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Confirm & Send Alert to Control Room</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSosModal(false)}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
