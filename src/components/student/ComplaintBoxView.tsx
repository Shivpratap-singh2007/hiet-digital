import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Plus, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Send, 
  Paperclip,
  Building, 
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowUpRight,
  Search,
  Copy,
  Check,
  X,
  Calendar,
  MapPin,
  FileText,
  AlertTriangle,
  History,
  Info
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { aiCampusService, ComplaintRoutingResult } from '../../lib/aiCampusService';
import { Complaint, GrievanceCategory, GrievanceStatus } from '../../types';
import { formatIndiaDateTime } from '../../lib/utils';

export const ComplaintBoxView: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.student_id || user?.id || 'std-cse-001';

  // Complaint State
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    dataStore.getComplaints().filter(c => c.student_id === studentId || c.student_id === 'anonymous')
  );

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form Fields
  const [isAnonymous, setIsAnonymous] = useState(true); // Default true for student protection
  const [category, setCategory] = useState<GrievanceCategory>('Academic');
  const [priority, setPriority] = useState<Complaint['priority']>('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Field Validation Errors
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  // Success Confirmation State
  const [submissionSuccess, setSubmissionSuccess] = useState<Complaint | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Tracking Search State
  const [trackingId, setTrackingId] = useState('');
  const [trackedComplaint, setTrackedComplaint] = useState<Complaint | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // AI Routing Suggestion State
  const [suggestingRouting, setSuggestingRouting] = useState(false);
  const [routingSuggestion, setRoutingSuggestion] = useState<ComplaintRoutingResult | null>(null);
  const [suggestionConfirmed, setSuggestionConfirmed] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');

  // 9 Required Grievance Categories
  const categories: GrievanceCategory[] = [
    'Academic',
    'Faculty Behaviour',
    'Harassment',
    'Ragging',
    'Infrastructure',
    'Hostel',
    'Safety',
    'Administration',
    'Other'
  ];

  // Refresh complaints on mount
  useEffect(() => {
    let isMounted = true;
    apiService.getComplaints().then(data => {
      if (isMounted && data) {
        setComplaints(data.filter(c => c.student_id === studentId || c.student_id === 'anonymous'));
      }
    }).catch(console.warn);
    return () => { isMounted = false; };
  }, [studentId]);

  const handleSuggestWithAi = async () => {
    if (description.trim().length < 20) {
      setSuggestionError('Please provide at least 20 characters in the description for accurate AI categorization.');
      return;
    }
    setSuggestingRouting(true);
    setSuggestionError('');
    try {
      const res = await aiCampusService.suggestComplaintRouting({
        description: description.trim(),
        title: title.trim() || undefined
      });
      setRoutingSuggestion(res);
    } catch (err: any) {
      setSuggestionError(err.message || 'Could not fetch AI routing suggestion.');
    } finally {
      setSuggestingRouting(false);
    }
  };

  const handleApplySuggestion = () => {
    if (!routingSuggestion) return;
    const catMap: Record<string, GrievanceCategory> = {
      academic: 'Academic',
      faculty: 'Faculty Behaviour',
      harassment: 'Harassment',
      ragging: 'Ragging',
      infrastructure: 'Infrastructure',
      hostel: 'Hostel',
      safety: 'Safety',
      admin: 'Administration',
      administration: 'Administration',
      other: 'Other'
    };
    const mappedCategory = catMap[routingSuggestion.category.toLowerCase()] || 'Other';
    setCategory(mappedCategory);

    const prioMap: Record<string, Complaint['priority']> = {
      low: 'Low',
      normal: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    };
    const mappedPriority = prioMap[routingSuggestion.priority.toLowerCase()] || 'Medium';
    setPriority(mappedPriority);

    setSuggestionConfirmed(true);
  };

  // Form Validation
  const validateForm = () => {
    const newErrors: { title?: string; description?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Please enter a grievance subject or title.';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long.';
    }

    if (!description.trim()) {
      newErrors.description = 'Please provide detailed complaint description.';
    } else if (description.trim().length < 15) {
      newErrors.description = 'Please provide at least 15 characters describing the issue.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Grievance
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const branch = user?.studentMaster?.branch || 'CSE';
      const semester = user?.studentMaster?.semester || 6;
      const section = user?.studentMaster?.section || 'A';

      const created = await apiService.submitComplaint({
        student_id: isAnonymous ? 'anonymous' : studentId,
        student_name: isAnonymous ? 'Anonymous Student' : (user?.name || 'Student'),
        student_roll: isAnonymous ? undefined : user?.studentMaster?.roll_no,
        student_branch: branch,
        student_semester: semester,
        student_section: section,
        is_anonymous: isAnonymous,
        category,
        priority,
        title: title.trim(),
        description: description.trim(),
        incident_date: incidentDate.trim() || undefined,
        incident_location: incidentLocation.trim() || undefined,
        attachment_url: attachmentUrl.trim() || undefined,
        ai_suggested_category: routingSuggestion?.category,
        ai_suggested_assignee_role: routingSuggestion?.assigneeRole,
        ai_suggested_priority: routingSuggestion?.priority,
        ai_confidence: routingSuggestion?.confidence,
        ai_routing_reason: routingSuggestion?.reason,
        ai_suggestion_confirmed: suggestionConfirmed,
        ai_suggestion_reviewed_by: user?.id
      });

      // Update state and display confirmation modal
      setComplaints(prev => [created, ...prev]);
      setSubmissionSuccess(created);
      setShowModal(false);

      // Reset form values ONLY after successful submission
      setTitle('');
      setDescription('');
      setIncidentDate('');
      setIncidentLocation('');
      setAttachmentUrl('');
      setIsAnonymous(true);
      setCategory('Academic');
      setPriority('Medium');
      setRoutingSuggestion(null);
      setSuggestionConfirmed(false);
      setSuggestionError('');
      setErrors({});
    } catch (err: any) {
      console.error('Failed to submit grievance:', err);
      // Preserves entered form values on failure!
      setSubmitError(err?.message || 'Network error occurred while submitting grievance. Your inputs are preserved, please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Track Grievance by Reference ID
  const handleTrackGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackingId.trim();
    if (!query) {
      setTrackingError('Please enter a valid Reference ID.');
      return;
    }

    setTrackingLoading(true);
    setTrackingError('');
    setTrackedComplaint(null);

    try {
      const result = await apiService.getComplaintByReference(query);
      if (result) {
        setTrackedComplaint(result);
      } else {
        setTrackingError(`No grievance record found with Reference ID "${query}". Please check the ID and try again.`);
      }
    } catch (err: any) {
      setTrackingError('Failed to lookup grievance status. Please try again.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const copyReferenceId = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const getPriorityBadge = (p: Complaint['priority']) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getStatusBadge = (s: Complaint['status']) => {
    switch (s) {
      case 'Pending Principal Review':
      case 'Submitted':
        return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'Principal Action Overdue':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800';
      case 'Escalated to MD':
        return 'bg-rose-600 text-white border-rose-700 font-bold shadow-xs animate-pulse';
      case 'Under Review':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
      case 'Resolved':
      case 'Closed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f2942] dark:text-white flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-[#0f2942] dark:text-sky-400 shrink-0" />
              <span>Student Confidential Grievance Box</span>
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0f2942] dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
              <Lock className="w-3 h-3 text-[#0f2942] dark:text-blue-300" />
              100% Confidential
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Institutional Redressal Portal • Escalation Hierarchy: <strong>Student → Principal (48h Action Window) → Managing Director (MD Escalation)</strong>
          </p>
        </div>

        {/* Action Buttons: Pure Navy Blue and White Theme */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setShowModal(true);
              setSubmitError(null);
            }}
            id="btn-lodge-grievance"
            className="w-full sm:w-auto px-4 py-2.5 bg-[#0f2942] hover:bg-[#0c2135] active:bg-[#081726] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition shrink-0"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Submit Grievance</span>
          </button>
        </div>
      </div>

      {/* 2. Institutional Escalation Protocol Card (Clean Navy Blue & White Design replacing gradient banner) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2942] text-white flex items-center justify-center font-bold shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0f2942] dark:text-white flex items-center gap-2">
                HIET Statutory Escalation Hierarchy
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-[#0f2942] dark:text-blue-300 px-2 py-0.5 rounded-full font-bold uppercase">
                  48-Hour SLA Protocol
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Every grievance is assigned to the Principal's queue. If no action is taken within 48 hours, an overdue reminder is dispatched before escalating to the Managing Director (MD).
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-semibold shrink-0 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero Victimization • Whistleblower Protected</span>
          </div>
        </div>

        {/* 3-Stage Hierarchy Pathway */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between font-bold text-[#0f2942] dark:text-sky-300">
              <span>Stage 1: Principal Review</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md font-bold">48 Hours SLA</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Assigned directly to the Principal's grievance queue. Principal reviews, adds remarks, and records actions taken.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-400">
              <span>Stage 2: Principal Reminder</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-bold">Overdue Alert</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              If no action within 48 hours, marked "Principal Action Overdue" and an alert is sent to the Principal without premature forwarding.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between font-bold text-rose-800 dark:text-rose-400">
              <span>Stage 3: MD Escalation</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-100 text-rose-900 rounded-md font-bold">Executive Desk</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              If unresolved after the Principal stage, forwarded directly to the Managing Director (MD) with complete audit history for final resolution.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Track Grievance Option by Reference ID */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-[#0f2942] dark:text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-[#0f2942] dark:text-sky-400" />
              <span>Track Grievance by Reference ID</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Check the real-time status, Principal remarks, and escalation history of any complaint without revealing your identity.
            </p>
          </div>
        </div>

        <form onSubmit={handleTrackGrievance} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={trackingId}
              onChange={e => {
                setTrackingId(e.target.value);
                setTrackingError('');
              }}
              placeholder="e.g. HIET-GRV-2026-100001 or Ticket ID"
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:border-[#0f2942] outline-hidden font-mono uppercase transition"
            />
          </div>
          <button
            type="submit"
            disabled={trackingLoading || !trackingId.trim()}
            className="px-5 py-2.5 bg-[#0f2942] hover:bg-[#0c2135] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
          >
            {trackingLoading ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Track Status</span>
          </button>
        </form>

        {trackingError && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{trackingError}</span>
          </div>
        )}

        {/* Tracked Grievance Card */}
        {trackedComplaint && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-900 text-xs space-y-3.5 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#0f2942] text-white">
                  {trackedComplaint.reference_id}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  {trackedComplaint.category}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityBadge(trackedComplaint.priority)}`}>
                  {trackedComplaint.priority} Priority
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(trackedComplaint.status)}`}>
                {trackedComplaint.status}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {trackedComplaint.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {trackedComplaint.description}
              </p>
            </div>

            {(trackedComplaint.incident_date || trackedComplaint.incident_location) && (
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                {trackedComplaint.incident_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Date: {trackedComplaint.incident_date}
                  </span>
                )}
                {trackedComplaint.incident_location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Location: {trackedComplaint.incident_location}
                  </span>
                )}
              </div>
            )}

            {/* Principal Actions / Remarks */}
            {(trackedComplaint.principal_remarks || trackedComplaint.principal_action_taken) && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300 text-[11px] uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Stage 1: Principal Review Action</span>
                </div>
                {trackedComplaint.principal_action_taken && (
                  <p className="text-blue-900 dark:text-blue-200 font-medium">
                    <strong>Action Taken:</strong> {trackedComplaint.principal_action_taken}
                  </p>
                )}
                {trackedComplaint.principal_remarks && (
                  <p className="text-blue-800 dark:text-blue-300">
                    <strong>Remarks:</strong> {trackedComplaint.principal_remarks}
                  </p>
                )}
              </div>
            )}

            {/* MD Resolution Card */}
            {(trackedComplaint.md_resolution || trackedComplaint.md_remarks || trackedComplaint.md_notes) && (
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-300 text-[11px] uppercase">
                  <Building className="w-3.5 h-3.5 text-purple-600" />
                  <span>Stage 3: Managing Director Resolution</span>
                </div>
                {trackedComplaint.md_resolution && (
                  <p className="text-purple-900 dark:text-purple-200 font-medium">
                    <strong>Final Resolution:</strong> {trackedComplaint.md_resolution}
                  </p>
                )}
                {(trackedComplaint.md_remarks || trackedComplaint.md_notes) && (
                  <p className="text-purple-800 dark:text-purple-300">
                    <strong>MD Remarks:</strong> {trackedComplaint.md_remarks || trackedComplaint.md_notes}
                  </p>
                )}
              </div>
            )}

            {/* Escalation History Audit Trail */}
            {trackedComplaint.escalation_history && trackedComplaint.escalation_history.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px] uppercase mb-2">
                  <History className="w-3.5 h-3.5 text-slate-500" /> Escalation History & Audit Trail
                </span>
                <div className="space-y-2">
                  {trackedComplaint.escalation_history.map((hist, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>{hist.stage}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatIndiaDateTime(hist.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{hist.action}</p>
                      {hist.remarks && (
                        <p className="text-slate-500 dark:text-slate-400 italic text-[10px] mt-0.5">
                          Note: {hist.remarks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Submitted: {formatIndiaDateTime(trackedComplaint.created_at)}</span>
              <button
                type="button"
                onClick={() => setTrackedComplaint(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline"
              >
                Clear Tracking View
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Student Grievance Log Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#0f2942] dark:text-white uppercase tracking-wider">
            My Submitted Grievances ({complaints.length})
          </h2>
          <span className="text-xs text-slate-500">
            Confidential Record
          </span>
        </div>

        {complaints.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Grievances Submitted</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't filed any complaints yet. You can submit grievances anonymously with 48-hour Principal review protection.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-[#0f2942] hover:bg-[#0c2135] text-white text-xs font-bold rounded-xl transition"
            >
              Submit a Grievance
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complaints.map(comp => (
              <div
                key={comp.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-2xs flex flex-col justify-between transition-all ${
                  comp.status === 'Escalated to MD' || comp.escalated_to_md
                    ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                    : comp.status === 'Principal Action Overdue'
                    ? 'border-amber-300 dark:border-amber-900/60 ring-1 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#0f2942] text-white">
                        {comp.reference_id || comp.id.slice(-6).toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {comp.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityBadge(comp.priority)}`}>
                        {comp.priority}
                      </span>
                      {comp.is_anonymous && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Anonymous
                        </span>
                      )}
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getStatusBadge(comp.status)}`}>
                      {comp.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {comp.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {comp.description}
                  </p>

                  {(comp.incident_date || comp.incident_location) && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      {comp.incident_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {comp.incident_date}
                        </span>
                      )}
                      {comp.incident_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {comp.incident_location}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stage 2 Alert Card if Overdue */}
                  {comp.status === 'Principal Action Overdue' && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        <span>STAGE 2: 48-HOUR PRINCIPAL REMINDER SENT</span>
                      </div>
                      <p className="text-amber-800 dark:text-amber-300 text-[11px] mt-1">
                        Principal review deadline expired. Reminder dispatched; complaint remains active in Principal queue for priority action.
                      </p>
                    </div>
                  )}

                  {/* Stage 3 Alert Card if Escalated to MD */}
                  {(comp.status === 'Escalated to MD' || comp.escalated_to_md) && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 text-[11px]">
                          <Building className="w-3.5 h-3.5 text-rose-600" />
                          STAGE 3: ESCALATED TO MANAGING DIRECTOR (MD)
                        </span>
                        <span className="text-[10px] font-mono text-rose-600 font-bold uppercase">Executive Desk</span>
                      </div>
                      <p className="text-rose-700 dark:text-rose-300 text-[11px]">
                        {comp.escalation_reason || 'Grievance exceeded Principal escalation deadline. Forwarded to MD Executive Desk for final decision.'}
                      </p>
                      {(comp.md_remarks || comp.md_resolution) && (
                        <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-rose-200 dark:border-rose-900 text-[11px] text-rose-900 dark:text-rose-200">
                          <strong>MD Resolution:</strong> {comp.md_resolution || comp.md_remarks}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Principal Recorded Action Box */}
                  {comp.principal_action_taken && !comp.escalated_to_md && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Action Recorded by Principal:</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 pl-5">
                        {comp.principal_action_taken}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span>Filed: {formatIndiaDateTime(comp.created_at)}</span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTrackingId(comp.reference_id || comp.id);
                        setTrackedComplaint(comp);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="text-[#0f2942] dark:text-sky-400 font-semibold hover:underline"
                    >
                      View Timeline
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Ref: {comp.reference_id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Complete Submit Grievance Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#0f2942] dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#0f2942] dark:text-sky-400" />
                  <span>Submit Confidential Grievance</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complaints follow the statutory hierarchy: <strong>Principal (48h SLA) → Managing Director (MD)</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Genuine Anonymity Mode Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <label className="flex items-start justify-between cursor-pointer gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isAnonymous 
                        ? 'bg-[#0f2942] text-white' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Anonymous Grievance Mode
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block mt-0.5">
                        {isAnonymous 
                          ? 'Your name, roll number, email, and phone are NOT stored or exposed to Principal or MD. You will track your grievance securely via Reference ID.' 
                          : 'Your verified college student identity (Name & Roll Number) will be attached to this report.'}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-[#0f2942] rounded-md focus:ring-[#0f2942] cursor-pointer mt-1"
                  />
                </label>
              </div>

              {/* Category & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Grievance Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as GrievanceCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-[#0f2942] outline-hidden"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Urgency / Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-[#0f2942] outline-hidden"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent (Immediate attention)</option>
                  </select>
                </div>
              </div>

              {/* Subject / Title */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
                  }}
                  placeholder="e.g. Lab equipment shortage or Hostel water heater malfunction"
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${
                    errors.title ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 dark:border-slate-700'
                  } bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-[#0f2942] outline-hidden`}
                />
                {errors.title && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.title}
                  </p>
                )}
              </div>

              {/* Incident Date & Incident Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Incident Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={e => setIncidentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-[#0f2942] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={incidentLocation}
                    onChange={e => setIncidentLocation(e.target.value)}
                    placeholder="e.g. Room 204, Library 1st Floor, Boys Hostel B"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-[#0f2942] outline-hidden"
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    Detailed Complaint Description *
                  </label>
                  {description.trim().length >= 20 && !routingSuggestion && (
                    <button
                      type="button"
                      onClick={handleSuggestWithAi}
                      disabled={suggestingRouting}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 border border-blue-200 text-[#0f2942] hover:bg-blue-100 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300 transition disabled:opacity-50"
                      title="AI analysis for optimal category suggestion"
                    >
                      <Sparkles className={`w-3 h-3 ${suggestingRouting ? 'animate-spin' : ''}`} />
                      <span>{suggestingRouting ? 'Analyzing...' : 'Suggest with AI'}</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors(prev => ({ ...prev, description: undefined }));
                  }}
                  placeholder="Provide complete details, dates, or specific circumstances..."
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${
                    errors.description ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 dark:border-slate-700'
                  } bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-[#0f2942] outline-hidden`}
                />
                {errors.description && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.description}
                  </p>
                )}
              </div>

              {suggestionError && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>{suggestionError}</span>
                </div>
              )}

              {/* AI Routing Suggestion Card */}
              {routingSuggestion && (
                <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-slate-800 border border-blue-200 dark:border-blue-900 text-xs space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0f2942] dark:text-blue-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      AI Recommended Routing
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#0f2942] border border-blue-200">
                      {routingSuggestion.confidence}% Match
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    <strong>Suggested Category:</strong> {routingSuggestion.category} • <strong>Priority:</strong> {routingSuggestion.priority}
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-blue-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setRoutingSuggestion(null);
                        setSuggestionConfirmed(false);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={handleApplySuggestion}
                      className="px-3 py-1 bg-[#0f2942] text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{suggestionConfirmed ? 'Suggestion Applied' : 'Apply Suggestion'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Optional Attachments with Metadata Warning */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Optional Evidence / Supporting Attachment URL
                </label>
                <div className="relative">
                  <Paperclip className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={attachmentUrl}
                    onChange={e => setAttachmentUrl(e.target.value)}
                    placeholder="https://... (Optional link or document URL)"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-[#0f2942] outline-hidden"
                  />
                </div>
                {/* Privacy Warning on Metadata */}
                <p className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800 mt-1.5 flex items-start gap-1.5 leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>Metadata Notice:</strong> Uploaded photos or PDF documents may contain metadata (e.g., GPS coordinates, camera model, or file author). If submitting anonymously, please ensure identifying metadata is stripped before attaching.
                  </span>
                </p>
              </div>

              {/* Statutory Notice */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#0f2942] dark:text-sky-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Grievances are submitted directly to the Principal's review queue. If unresolved within 48 hours, an automated reminder is logged and subsequently escalated to the College Managing Director (MD).
                </p>
              </div>

              {/* Buttons: Cancel and Submit Grievance */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  id="btn-submit-grievance-form"
                  className="px-5 py-2.5 bg-[#0f2942] hover:bg-[#0c2135] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {submitting ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{submitting ? 'Registering...' : 'Submit Grievance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Submission Confirmation Dialog */}
      {submissionSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-[#0f2942] dark:text-white">
                Grievance Submitted Successfully
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your complaint has been assigned to the Principal's review queue.
              </p>
            </div>

            {/* Reference ID Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Unique Tracking Reference ID
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-base font-extrabold text-[#0f2942] dark:text-sky-300">
                  {submissionSuccess.reference_id}
                </span>
                <button
                  type="button"
                  onClick={() => copyReferenceId(submissionSuccess.reference_id || submissionSuccess.id)}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
                  title="Copy Reference ID"
                >
                  {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500">Initial Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                  {submissionSuccess.status}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Please save this Reference ID. You can check your grievance status, 48-hour SLA countdown, and resolution anytime using the <strong>Track Grievance</strong> option without revealing your identity.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSubmissionSuccess(null)}
                className="w-full py-2.5 bg-[#0f2942] hover:bg-[#0c2135] text-white text-xs font-bold rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
