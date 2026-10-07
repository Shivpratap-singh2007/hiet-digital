import React, { useState } from 'react';
import { Bell, Plus, AlertTriangle, Pin, Search, Filter, Megaphone, FileText } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { Notice } from '../../types';
import { formatDate } from '../../lib/utils';
import { NoticeBoard3D } from '../3d/NoticeBoard3D';

export const NoticesView: React.FC = () => {
  const { role, user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>(() => dataStore.getNotices());
  const [selectedAudience, setSelectedAudience] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<Notice['audience']>('All');
  const [priority, setPriority] = useState<Notice['priority']>('Normal');
  const [submitting, setSubmitting] = useState(false);

  const filteredNotices = notices.filter(n => {
    const matchAudience = selectedAudience === 'All' || n.audience === 'All' || n.audience === selectedAudience;
    const matchSearch = !search || 
      n.title.toLowerCase().includes(search.toLowerCase()) || 
      n.content.toLowerCase().includes(search.toLowerCase());
    return matchAudience && matchSearch;
  });

  const getPriorityStyle = (p: Notice['priority']) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900';
      case 'Important':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      default:
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900';
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    const newNotice = await apiService.createNotice({
      title,
      content,
      audience,
      priority,
      created_by_name: user?.name || 'College Administration'
    });

    setNotices(prev => [newNotice, ...prev]);
    setSubmitting(false);
    setShowModal(false);
    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 3D Holographic Notice Billboard */}
      <NoticeBoard3D />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500 dark:text-amber-400 animate-bell-ring icon-glow-amber" />
            Official HIET Circular & Notice Archive
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Published notifications from the Directorate, Controller of Examinations, and Department HODs
          </p>
        </div>

        {(role === 'admin' || role === 'hod' || role === 'teacher') && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Publish Notice
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['All', 'Students', 'Teachers', 'CSE', 'ECE', 'ME'].map(aud => (
            <button
              key={aud}
              onClick={() => setSelectedAudience(aud)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                selectedAudience === aud
                  ? 'bg-blue-700 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {aud}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search circulars..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        {filteredNotices.map(notice => (
          <div
            key={notice.id}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityStyle(notice.priority)}`}>
                  {notice.priority} Notice
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                  Audience: {notice.audience}
                </span>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                {formatDate(notice.created_at)}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {notice.title}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {notice.content}
            </p>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Issued By: <strong className="text-slate-700 dark:text-slate-200">{notice.created_by_name || 'HIET Administration'}</strong>
              </span>
              <span className="text-[11px] font-mono">Ref: HIET/CIR/{notice.id.slice(-4).toUpperCase()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Publish Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Publish Official Notice
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Circular will immediately reflect on active student and teacher feeds.
            </p>

            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Circular Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Schedule for University End Semester Theory Exams"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Audience Target
                  </label>
                  <select
                    value={audience}
                    onChange={e => setAudience(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="All">All Campus</option>
                    <option value="Students">All Students</option>
                    <option value="Teachers">All Faculty</option>
                    <option value="CSE">CSE Department</option>
                    <option value="ECE">ECE Department</option>
                    <option value="ME">ME Department</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent (Red Alert)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Circular Text / Instructions
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Enter the full official notification text..."
                  required
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
                  {submitting ? 'Publishing...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
