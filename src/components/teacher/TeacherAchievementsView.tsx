import React, { useState } from 'react';
import { Trophy, CheckCircle2, XCircle, ExternalLink, Clock } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { Achievement } from '../../types';
import { formatDate } from '../../lib/utils';

export const TeacherAchievementsView: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>(() => dataStore.getAchievements());
  const [selectedAch, setSelectedAch] = useState<Achievement | null>(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDecision = async (status: 'Verified' | 'Rejected') => {
    if (!selectedAch) return;

    setLoading(true);
    await apiService.updateAchievementStatus(
      selectedAch.id,
      status,
      user?.name || 'Faculty Evaluator',
      remarks
    );

    setAchievements(prev => prev.map(a =>
      a.id === selectedAch.id ? { ...a, verification_status: status, remarks, verified_by: user?.name } : a
    ));
    setLoading(false);
    setSelectedAch(null);
    setRemarks('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          Student Achievement Verification Panel
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Authenticate student certificates, hackathon rankings, and sports representations
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Title & Summary</th>
              <th className="px-4 py-3">Certificate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {achievements.map(ach => (
              <tr key={ach.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{ach.student_name}</div>
                  <div className="font-mono text-[11px] text-blue-700 dark:text-blue-400">
                    Roll: {ach.student_roll}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                    {ach.category}
                  </span>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{ach.title}</div>
                  <p className="line-clamp-1 text-slate-500 text-[11px] mt-0.5">{ach.description}</p>
                </td>
                <td className="px-4 py-3">
                  {ach.certificate_url ? (
                    <a
                      href={ach.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Link
                    </a>
                  ) : (
                    <span className="text-slate-400">None</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    ach.verification_status === 'Verified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : ach.verification_status === 'Pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {ach.verification_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => { setSelectedAch(ach); setRemarks(ach.remarks || ''); }}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 text-slate-700 dark:text-slate-200 hover:text-blue-700 rounded-lg text-xs font-semibold transition"
                  >
                    Verify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Verification Modal */}
      {selectedAch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Verify Student Achievement
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Confirm credential legitimacy for college transcript and honors record
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAch.student_name} ({selectedAch.student_roll})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Award Title:</span>
                <span className="font-semibold">{selectedAch.title}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Details:</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedAch.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Verification Remarks / Citation
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="e.g. Verified with organizing committee credential ID; exemplary work."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedAch(null)}
                  className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDecision('Rejected')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDecision('Verified')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Approve & Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
