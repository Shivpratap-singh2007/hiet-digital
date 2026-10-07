import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink, 
  Sparkles, 
  Award, 
  Filter,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { Achievement } from '../../types';
import { formatDate } from '../../lib/utils';

export const AchievementsView: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.student_id || user?.id || 'std-210101';
  const studentRoll = user?.studentMaster?.roll_no;
  const [achievements, setAchievements] = useState<Achievement[]>(() => 
    dataStore.getAchievements().filter(
      a => a.student_id === studentId || a.student_id === user?.id || (studentRoll && a.student_roll === studentRoll)
    )
  );

  useEffect(() => {
    let isMounted = true;
    async function loadAchievements() {
      try {
        const fromApi = await apiService.getAchievements(studentId);
        if (isMounted && fromApi && fromApi.length > 0) {
          setAchievements(fromApi);
        }
      } catch {
        // Keep initial state
      }
    }
    loadAchievements();
    return () => { isMounted = false; };
  }, [studentId]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);

  // New Achievement Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Achievement['category']>('Certificates');
  const [certUrl, setCertUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = ['All', 'Certificates', 'Hackathons', 'Sports', 'Competitions', 'Internships', 'Academic'];

  const filteredAchievements = selectedCategory === 'All'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const handleTriggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    const newAch = await apiService.submitAchievement({
      student_id: studentId,
      student_name: user?.name,
      student_roll: user?.studentMaster?.roll_no,
      student_branch: user?.studentMaster?.branch,
      title,
      description,
      category,
      certificate_url: certUrl || 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80'
    });

    setAchievements(prev => [newAch, ...prev]);
    setSubmitting(false);
    setShowModal(false);
    setTitle('');
    setDescription('');
    setCertUrl('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500 animate-icon-float icon-glow-amber" />
            Student Achievements & Honors
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified co-curricular awards, hackathons, sports championships, and research credentials
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerConfetti}
            className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 transition"
            title="Celebrate Honors"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Submit New Achievement
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition ${
              selectedCategory === cat
                ? 'bg-amber-600 text-white font-semibold shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Achievements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAchievements.map(ach => {
          const isVerified = ach.verification_status === 'Verified';
          const isPending = ach.verification_status === 'Pending';

          return (
            <div
              key={ach.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                      {ach.category || ach.achievement_type || 'Award'}
                    </span>
                    {ach.position && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200">
                        {ach.position}
                      </span>
                    )}
                  </div>

                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isVerified
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : isPending
                      ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                  }`}>
                    {isVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {isPending && <Clock className="w-3.5 h-3.5" />}
                    {!isVerified && !isPending && <XCircle className="w-3.5 h-3.5" />}
                    {isVerified ? 'College Verified' : ach.verification_status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                  {ach.title}
                </h3>
                {ach.event_name && (
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    {ach.event_name}
                  </p>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                  {ach.description}
                </p>

                {ach.added_by && (
                  <div className="mt-2.5 p-2 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Verified by Directorate
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">
                      {ach.added_by_name || 'HOD CSE'}
                    </span>
                  </div>
                )}

                {ach.remarks && !ach.added_by && (
                  <div className="mt-3 p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[11px] text-blue-800 dark:text-blue-300">
                    <span className="font-bold">Faculty Remark: </span>
                    {ach.remarks}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
                <span>{ach.achievement_date || formatDate(ach.created_at)}</span>
                {ach.certificate_url && (
                  <a
                    href={ach.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    View Credential
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Submit Student Achievement
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Your submission will be routed to your department coordinator for verification.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="Certificates">Certificates</option>
                  <option value="Hackathons">Hackathons</option>
                  <option value="Sports">Sports</option>
                  <option value="Competitions">Competitions</option>
                  <option value="Internships">Internships</option>
                  <option value="Academic">Academic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. 1st Place - Inter College Coding Fest"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Briefly describe the competition, organizing institute, and role..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Certificate Link or Drive URL
                </label>
                <input
                  type="url"
                  value={certUrl}
                  onChange={e => setCertUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or credential URL"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium rounded-lg"
                >
                  {submitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
