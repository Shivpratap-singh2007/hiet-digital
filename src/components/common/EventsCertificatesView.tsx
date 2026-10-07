import React, { useState } from 'react';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  Award, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from './PageHeader';
import { StatCard } from './StatCard';
import { EventItem, EventRegistration, EventCertificate } from '../../types';

export const EventsCertificatesView: React.FC = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin' || role === 'principal' || role === 'hod';
  const student = user?.studentMaster;
  const currentRoll = student?.roll_no || 'CSE001';

  // State
  const [activeTab, setActiveTab] = useState<'events' | 'certificates'>('events');
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 'evt-001',
      title: 'HIET National Smart Campus Hackathon 2026',
      category: 'Hackathon',
      organizer: 'Department of Computer Science & Engineering',
      venue: 'Main Auditorium & Computing Labs',
      event_date: '2026-04-18',
      start_time: '09:00',
      end_time: '18:00',
      max_participants: 120,
      registration_deadline: '2026-04-15',
      description: '24-Hour continuous coding marathon on campus automation, AI agents, and green institutional infrastructure.',
      certificates_enabled: true,
      status: 'Upcoming',
      created_at: '2026-03-20T10:00:00Z'
    },
    {
      id: 'evt-002',
      title: 'Workshop on Cloud Native Architectures & Microservices',
      category: 'Workshop',
      organizer: 'HIET Technical Committee',
      venue: 'Seminar Hall B, Block 1',
      event_date: '2026-04-28',
      start_time: '10:00',
      end_time: '14:00',
      max_participants: 80,
      registration_deadline: '2026-04-25',
      description: 'Hands-on laboratory workshop covering Docker containers, Kubernetes deployment, and PostgreSQL scaling.',
      certificates_enabled: true,
      status: 'Upcoming',
      created_at: '2026-03-25T10:00:00Z'
    }
  ]);

  const [certificates, setCertificates] = useState<EventCertificate[]>([
    {
      id: 'cert-001',
      event_id: 'evt-001',
      event_title: 'HIET National Smart Campus Hackathon 2026',
      recipient_id: user?.student_id || 'std-cse-001',
      recipient_name: student?.name || user?.name || 'Aarav Sharma',
      recipient_roll: currentRoll,
      role: 'Winner',
      verification_token: 'TEST-CERT-2026-001',
      issue_date: '2026-04-19',
      issuer_authority: 'Office of the Principal, HIET',
      created_at: '2026-04-19T14:30:00Z'
    }
  ]);

  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>(['evt-001']);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPassEvent, setSelectedPassEvent] = useState<EventItem | null>(null);

  // Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: 'Workshop' as const,
    organizer: 'Department of CSE',
    venue: '',
    event_date: '',
    start_time: '10:00',
    end_time: '13:00',
    description: '',
    max_participants: 100,
    registration_deadline: ''
  });

  const handleRegister = (eventId: string) => {
    if (!registeredEventIds.includes(eventId)) {
      setRegisteredEventIds(prev => [...prev, eventId]);
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const created: EventItem = {
      id: `evt-${Date.now()}`,
      title: newEvent.title,
      category: newEvent.category,
      organizer: newEvent.organizer,
      venue: newEvent.venue,
      event_date: newEvent.event_date,
      start_time: newEvent.start_time,
      end_time: newEvent.end_time,
      max_participants: newEvent.max_participants,
      registration_deadline: newEvent.registration_deadline,
      description: newEvent.description,
      certificates_enabled: true,
      status: 'Upcoming',
      created_at: new Date().toISOString()
    };
    setEvents(prev => [created, ...prev]);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Campus Life' },
          { label: 'Events & Digital Certificates', active: true }
        ]}
        title="Events & Verifiable Certificates"
        description="Official institutional hackathons, workshops, conferences & public cryptographic credential verification"
        badge="Autonomous College Cell"
        actions={
          isAdmin ? (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campus Event</span>
            </button>
          ) : undefined
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Upcoming Events"
          value={events.length}
          icon={Calendar}
          badgeColor="blue"
          subtext="Institutional calendar"
        />
        <StatCard
          label="My Registrations"
          value={registeredEventIds.length}
          icon={Users}
          badgeColor="emerald"
          subtext="Confirmed participant passes"
        />
        <StatCard
          label="Earned Certificates"
          value={certificates.length}
          icon={Award}
          badgeColor="slate"
          subtext="Verifiable digital credentials"
        />
        <StatCard
          label="Public Verification"
          value="Online"
          icon={ShieldCheck}
          badgeColor="amber"
          subtext="SHA-256 tamper checks"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'events'
              ? 'border-[#0f2942] text-[#0f2942]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Campus Events ({events.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('certificates')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'certificates'
              ? 'border-[#0f2942] text-[#0f2942]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>My Verified Certificates ({certificates.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'events' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(event => {
            const isRegistered = registeredEventIds.includes(event.id);
            return (
              <div key={event.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 hover:border-slate-300 transition flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      {event.category}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {event.start_time} - {event.end_time}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{event.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{event.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Date: <span className="font-bold text-slate-800">{event.event_date}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">Venue: <span className="font-bold text-slate-800">{event.venue}</span></span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {isRegistered ? (
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Registered
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedPassEvent(event)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <QrCode className="w-3.5 h-3.5" /> QR Pass
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRegister(event.id)}
                        className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-bold transition shadow-xs"
                      >
                        Register for Event
                      </button>
                    )}
                    <span className="text-[11px] text-slate-400">Max: {event.max_participants}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-slate-400">
              <Award className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No digital certificates issued yet.</p>
              <p className="text-xs">Certificates appear automatically upon event conclusion and attendance verification.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map(cert => (
                <div key={cert.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-100/60 to-transparent rounded-bl-full pointer-events-none" />
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {cert.role}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs mt-1">{cert.event_title}</h4>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Awarded To:</span>
                      <span className="font-bold text-slate-900">{cert.recipient_name} ({cert.recipient_roll})</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Issue Date:</span>
                      <span className="font-semibold text-slate-800">{cert.issue_date}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Verification Token:</span>
                      <span className="font-mono text-emerald-700 font-bold">{cert.verification_token}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={`/verify/certificate/${cert.verification_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#0f2942] hover:underline flex items-center gap-1"
                    >
                      <span>Public Verification Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => window.open(`/verify/certificate/${cert.verification_token}`, '_blank')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verify Certificate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QR Pass Modal */}
      {selectedPassEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPassEvent(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
              <Trophy className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">Event Entry Pass</h3>
              <p className="text-xs text-slate-500 truncate">{selectedPassEvent.title}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center gap-2">
              <div className="w-36 h-36 bg-white border border-slate-300 rounded-lg flex items-center justify-center p-2 shadow-inner">
                <QrCode className="w-28 h-28 text-slate-800" />
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                PASS-{selectedPassEvent.id.toUpperCase()}-{currentRoll}
              </span>
            </div>

            <div className="text-xs text-left bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Venue:</span>
                <span className="font-bold text-slate-900">{selectedPassEvent.venue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-900">{selectedPassEvent.event_date}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPassEvent(null)}
              className="w-full py-2 rounded-xl bg-[#0f2942] text-white text-xs font-bold hover:bg-[#0a1c2e] transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Publish Institutional Event</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Technical Symposium 2026"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent(p => ({ ...p, category: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Cultural Fest">Cultural Fest</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Auditorium"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent(p => ({ ...p, venue: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent(p => ({ ...p, event_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent(p => ({ ...p, start_time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newEvent.end_time}
                    onChange={(e) => setNewEvent(p => ({ ...p, end_time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Description</label>
                <textarea
                  required
                  rows={2}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold transition shadow-xs"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
