import React, { useState } from 'react';
import { 
  HeartPulse, 
  Phone, 
  MessageSquare, 
  ShieldAlert, 
  AlertTriangle, 
  Activity, 
  FileText, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Stethoscope, 
  Plus, 
  X,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { NavTab } from '../common/Sidebar';
import { campusLifeStore, INITIAL_EMERGENCY_CONTACTS } from '../../lib/campusLifeData';
import { DispensaryVisit } from '../../types';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const EmergencyHealthView: React.FC<Props> = ({ onNavigate: _onNavigate }) => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const studentRoll = student?.roll_no || '26CSE001';

  const [emergencyContacts] = useState(campusLifeStore.getEmergencyContacts());
  const [dispensaryVisits, setDispensaryVisits] = useState<DispensaryVisit[]>(
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
          { label: 'Emergency & Health Center', active: true }
        ]}
        title="Campus Emergency SOS & Dispensary Desk"
        description="Immediate 1-tap institutional emergency helpline, campus ambulance dispatch, and student medical OPD records."
        badge="24x7 Rapid Medical & Security Response"
        actions={
          <button
            type="button"
            onClick={() => setShowSosModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center gap-2 shadow-md hover:shadow-lg animate-pulse cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>TRIGGER CAMPUS SOS</span>
          </button>
        }
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={HeartPulse}
          label="Campus Ambulance"
          value="Standby"
          badgeColor="emerald"
          subtext="Driver On-Duty at Gate 1"
        />
        <StatCard
          icon={Activity}
          label="Medical Officer"
          value="Dr. R.K. Sharma"
          badgeColor="blue"
          subtext="OPD 09:00 - 17:00 IST"
        />
        <StatCard
          icon={FileText}
          label="Medical Excuses"
          value={`${dispensaryVisits.filter(v => v.medical_exemption_issued).length} Approved`}
          badgeColor="emerald"
          subtext="Attendance Concession Active"
        />
        <StatCard
          icon={Phone}
          label="Emergency Response"
          value="< 3 Mins"
          badgeColor="amber"
          subtext="Average Campus Response Time"
        />
      </div>

      {/* Emergency SOS Directory */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-rose-600" />
              <span>Campus Rapid Emergency Directory (1-Tap Direct Call)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Dial directly or send WhatsApp alert in case of medical crisis, ragging, or security incident.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            Emergency Toll-Free Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {emergencyContacts.map(c => (
            <div
              key={c.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    c.priority_level === 'Immediate' ? 'bg-rose-100 text-rose-800' :
                    c.priority_level === 'Urgent' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {c.priority_level}
                  </span>
                  {c.is_24x7 && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 24x7 Live
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-black text-slate-900 pt-1 leading-snug">
                  {c.title}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {c.department} • <span className="text-slate-600">{c.location}</span>
                </p>
                {c.description && (
                  <p className="text-[10px] text-slate-400 leading-tight pt-0.5">
                    {c.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <a
                  href={`tel:${c.phone}`}
                  className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Now</span>
                </a>
                {c.whatsapp && (
                  <a
                    href={`https://wa.me/${c.whatsapp.replace('+', '')}?text=CAMPUS%20EMERGENCY:%20Student%20Roll%20${studentRoll}%20requests%20immediate%20assistance.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center"
                    title="Send WhatsApp Alert"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campus Health Center & Dispensary Logs */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span>Dispensary OPD Visits & Medical Attendance Pass</span>
            </h3>
            <p className="text-xs text-slate-500">
              Campus medical officer checkup history, prescribed treatments, and official absence excuses.
            </p>
          </div>
        </div>

        {dispensaryVisits.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No past medical visits recorded for your roll number.
          </div>
        ) : (
          <div className="space-y-3">
            {dispensaryVisits.map(v => (
              <div
                key={v.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{v.diagnosis}</span>
                    {v.medical_exemption_issued && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Attendance Concession Approved
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Visit Date: {v.visit_date}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Reported Symptoms</span>
                    <p className="text-slate-700 mt-0.5">{v.symptoms}</p>
                    {v.rest_advised_hours && (
                      <span className="text-[11px] text-amber-700 font-bold block mt-1">
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-wider">Campus Emergency SOS</h3>
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
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-base font-extrabold text-emerald-900">Emergency Alert Dispatched!</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Campus Security Control Room, Ambulance Team, and Chief Proctor have received your GPS coordinates and student roll ({studentRoll}). Security personnel are dispatched.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
                  <p className="font-extrabold text-rose-800">
                    Are you facing an immediate emergency?
                  </p>
                  <p className="leading-relaxed text-rose-800/90">
                    Triggering this SOS will immediately sound the alarm at the Main Security Control Room, broadcast an urgent WhatsApp notification to the Chief Proctor and Medical Officer, and dispatch emergency response staff to your current location.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleTriggerSos}
                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>CONFIRM & DISPATCH EMERGENCY RESPONSE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSosModal(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
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
