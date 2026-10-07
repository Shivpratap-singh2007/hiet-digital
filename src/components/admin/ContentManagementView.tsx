import React, { useState } from 'react';
import { 
  Megaphone, 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  Users, 
  CheckCircle2, 
  FileText,
  X 
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Notice } from '../../types';

export const ContentManagementView: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>(() => dataStore.getNotices());
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<Notice['audience']>('All');
  const [priority, setPriority] = useState<Notice['priority']>('Normal');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const newNotice = await apiService.createNotice({
        title,
        content,
        audience,
        priority,
        created_by_name: user?.name || 'Office of the Principal'
      });
      setNotices(prev => [newNotice, ...prev]);
      setShowCreateModal(false);
      setTitle('');
      setContent('');
      setAudience('All');
      setPriority('Normal');
    } catch (e) {
      console.error('Failed to create content:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNotices = notices.filter(n => {
    if (audienceFilter !== 'All' && n.audience !== audienceFilter && n.audience !== 'All') return false;
    if (search) {
      const q = search.toLowerCase();
      const match = n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Institutional Communications' },
          { label: 'Content Management', active: true }
        ]}
        title="Student-Facing Content Management"
        description="Publish, broadcast and schedule official announcements, student circulars, examination updates, and academic notifications."
        badge="Broadcasting System"
        actions={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Content</span>
          </button>
        }
      />

      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search circulars by headline..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-[#0f2942] outline-hidden transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={audienceFilter}
            onChange={e => setAudienceFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 outline-hidden w-full sm:w-auto"
          >
            <option value="All">All Audiences</option>
            <option value="Students">Students Only</option>
            <option value="Teachers">Faculty & Staff</option>
          </select>
        </div>
      </div>

      {/* Content Table */}
      {filteredNotices.length === 0 ? (
        <EmptyState
          title="No content items found"
          description="Try adjusting your search query or audience filter."
          action={{
            label: 'Create New Content',
            onClick: () => setShowCreateModal(true),
            icon: Plus
          }}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Headline & Content</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Published Date</th>
                  <th className="py-3 px-4">Publisher</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredNotices.map(notice => (
                  <tr key={notice.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900 max-w-md">
                      <div className="font-semibold text-slate-900 truncate">{notice.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {notice.content}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {notice.audience}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        notice.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : notice.priority === 'Important'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-50 text-blue-800'
                      }`}>
                        {notice.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {notice.created_at ? new Date(notice.created_at).toISOString().slice(0, 10) : '2026-03-01'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {notice.created_by_name || 'Principal Office'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status="Published" variant="published" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Content Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Create Student-Facing Content</h3>
                <p className="text-xs text-slate-500 mt-0.5">Publish announcement to campus channels</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContent} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Circular Headline
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Schedule of Sessional II Examinations - March 2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0f2942] outline-hidden text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={audience}
                    onChange={e => setAudience(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0f2942] outline-hidden text-xs"
                  >
                    <option value="All">All Students & Faculty</option>
                    <option value="Students">Students Only</option>
                    <option value="Teachers">Faculty Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Broadcast Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0f2942] outline-hidden text-xs"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent Circular</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Announcement Details
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={4}
                  placeholder="Provide comprehensive details, guidelines, or instructions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0f2942] outline-hidden text-xs resize-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
