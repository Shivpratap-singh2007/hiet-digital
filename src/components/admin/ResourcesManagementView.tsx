import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Download, 
  Eye, 
  Plus, 
  BookOpen, 
  FileQuestion, 
  Clock, 
  Layers 
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge, StatusVariant } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { dataStore } from '../../lib/mockData';

type ResourceSection = 'pending' | 'published' | 'reported' | 'rejected' | 'all';
type ResourceType = 'All' | 'Notes' | 'PYQ' | 'Syllabus' | 'Lab Manual' | 'Question Bank';

interface AcademicResourceItem {
  id: string;
  title: string;
  subject: string;
  branch: string;
  semester: number;
  type: 'Notes' | 'PYQ' | 'Syllabus' | 'Lab Manual' | 'Question Bank';
  author: string;
  submittedDate: string;
  status: 'Pending' | 'Published' | 'Reported' | 'Rejected';
  fileUrl?: string;
  downloadsCount: number;
}

export const ResourcesManagementView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ResourceSection>('all');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<ResourceType>('All');

  // Seed with real items from mockData / store
  const [resources, setResources] = useState<AcademicResourceItem[]>(() => {
    const syllabi = dataStore.getSyllabus();
    const pyqs = dataStore.getPyqs();
    
    const items: AcademicResourceItem[] = [
      ...syllabi.map((s, idx) => ({
        id: `res-syl-${idx + 1}`,
        title: `${s.title || 'Curriculum Scheme'}`,
        subject: s.subject_name || s.title || 'General Curriculum',
        branch: s.branch || 'All Branches',
        semester: s.semester || 1,
        type: 'Syllabus' as const,
        author: 'HPTU Hamirpur / Academic Cell',
        submittedDate: '2026-02-15',
        status: 'Published' as const,
        fileUrl: s.file_url,
        downloadsCount: 142 + idx * 12
      })),
      ...pyqs.map((p, idx) => ({
        id: `res-pyq-${idx + 1}`,
        title: `${p.subject_name || p.subject_code || 'Question Paper'} (${p.exam_type} ${p.year})`,
        subject: p.subject_name || p.subject_code || 'General',
        branch: p.branch || 'CSE',
        semester: p.semester || 1,
        type: 'PYQ' as const,
        author: 'Examination Controller',
        submittedDate: '2026-02-28',
        status: (idx % 4 === 1 ? 'Pending' : idx % 4 === 2 ? 'Reported' : 'Published') as 'Pending' | 'Reported' | 'Published',
        fileUrl: p.file_url,
        downloadsCount: 88 + idx * 7
      })),
      {
        id: 'res-lab-01',
        title: 'Compiler Design Lab Manual & Test Bench Exercises',
        subject: 'Compiler Design',
        branch: 'CSE',
        semester: 6,
        type: 'Lab Manual',
        author: 'Dr. Rajesh Kumar',
        submittedDate: '2026-03-01',
        status: 'Pending',
        downloadsCount: 0
      },
      {
        id: 'res-rep-01',
        title: 'Outdated 2021 Data Structures Handout with Broken Formatting',
        subject: 'Data Structures',
        branch: 'CSE',
        semester: 3,
        type: 'Notes',
        author: 'Guest Contributor',
        submittedDate: '2026-01-10',
        status: 'Reported',
        downloadsCount: 19
      },
      {
        id: 'res-rej-01',
        title: 'Commercial Promotional Notes with Watermarks',
        subject: 'Operating Systems',
        branch: 'CSE',
        semester: 4,
        type: 'Notes',
        author: 'External Entity',
        submittedDate: '2026-01-05',
        status: 'Rejected',
        downloadsCount: 0
      }
    ];

    return items;
  });

  const subjects = Array.from(new Set(resources.map(r => r.subject)));

  const handleUpdateStatus = (id: string, newStatus: 'Published' | 'Rejected') => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const filteredResources = resources.filter(r => {
    // Section tab filter
    if (activeSection === 'pending' && r.status !== 'Pending') return false;
    if (activeSection === 'published' && r.status !== 'Published') return false;
    if (activeSection === 'reported' && r.status !== 'Reported') return false;
    if (activeSection === 'rejected' && r.status !== 'Rejected') return false;

    // Search query
    if (search) {
      const q = search.toLowerCase();
      const match = r.title.toLowerCase().includes(q) || 
                    r.subject.toLowerCase().includes(q) || 
                    r.author.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Subject filter
    if (subjectFilter !== 'All' && r.subject !== subjectFilter) return false;

    // Type filter
    if (typeFilter !== 'All' && r.type !== typeFilter) return false;

    return true;
  });

  const counts = {
    pending: resources.filter(r => r.status === 'Pending').length,
    published: resources.filter(r => r.status === 'Published').length,
    reported: resources.filter(r => r.status === 'Reported').length,
    rejected: resources.filter(r => r.status === 'Rejected').length,
    all: resources.length
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Academic Governance' },
          { label: 'Resource Management', active: true }
        ]}
        title="Resource Management"
        description="Verify, moderate and publish syllabus documents, previous year question papers, lecture notes, and lab manuals."
        badge="Moderation Desk"
      />

      {/* Moderation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto pb-px" aria-label="Resource Moderation Tabs">
          {[
            { id: 'pending' as ResourceSection, label: 'Pending Review', count: counts.pending },
            { id: 'published' as ResourceSection, label: 'Published', count: counts.published },
            { id: 'reported' as ResourceSection, label: 'Reported', count: counts.reported },
            { id: 'rejected' as ResourceSection, label: 'Rejected', count: counts.rejected },
            { id: 'all' as ResourceSection, label: 'All Resources', count: counts.all }
          ].map(tab => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-[#0f2942] text-[#0f2942]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive 
                    ? 'bg-[#0f2942] text-white' 
                    : tab.id === 'reported' && tab.count > 0 
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search resources by title, subject..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-[#0f2942] outline-hidden transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 outline-hidden"
          >
            <option value="All">All Subjects</option>
            {subjects.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as ResourceType)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 outline-hidden"
          >
            <option value="All">All Resource Types</option>
            <option value="Notes">Notes</option>
            <option value="PYQ">PYQ Papers</option>
            <option value="Syllabus">Syllabus</option>
            <option value="Lab Manual">Lab Manual</option>
            <option value="Question Bank">Question Bank</option>
          </select>
        </div>
      </div>

      {/* Resources Table */}
      {filteredResources.length === 0 ? (
        <EmptyState
          title="No resources found"
          description="There are no academic resources matching the current tab and filter criteria."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Submitted By</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredResources.map(res => (
                  <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs">
                      <div className="truncate font-semibold">{res.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {res.branch} • Semester {res.semester} • {res.downloadsCount} downloads
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {res.subject}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {res.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {res.author}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {res.submittedDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={res.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {res.status !== 'Published' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(res.id, 'Published')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] transition flex items-center gap-1"
                            title="Approve & Publish"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Publish</span>
                          </button>
                        )}
                        {res.status !== 'Rejected' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(res.id, 'Rejected')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition flex items-center gap-1"
                            title="Reject Resource"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
