import React, { useState } from 'react';
import { 
  Building, 
  Layers, 
  BookOpen, 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  GraduationCap, 
  Award, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { dataStore } from '../../lib/mockData';
import { Subject, SyllabusItem } from '../../types';

type CatalogTab = 'institutions' | 'courses_branches' | 'semesters_subjects' | 'units_topics';

export const AcademicCatalogView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CatalogTab>('semesters_subjects');
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState<number | 'All'>('All');
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  const subjects: Subject[] = dataStore.getSubjects();
  const syllabi: SyllabusItem[] = dataStore.getSyllabus();

  const branches = [
    { code: 'CSE', name: 'Computer Science & Engineering', degree: 'B.Tech', duration: '4 Years', intake: 120 },
    { code: 'CSE-AIML', name: 'Artificial Intelligence & Machine Learning', degree: 'B.Tech', duration: '4 Years', intake: 60 },
    { code: 'CE', name: 'Civil Engineering', degree: 'B.Tech', duration: '4 Years', intake: 60 },
    { code: 'ME', name: 'Mechanical Engineering', degree: 'B.Tech', duration: '4 Years', intake: 60 },
    { code: 'EE', name: 'Electrical Engineering', degree: 'B.Tech', duration: '4 Years', intake: 60 },
    { code: 'BCA', name: 'Bachelor of Computer Applications', degree: 'BCA', duration: '3 Years', intake: 60 }
  ];

  const filteredSubjects = subjects.filter(s => {
    const matchSearch = !search || 
      s.subject_name.toLowerCase().includes(search.toLowerCase()) || 
      s.subject_code.toLowerCase().includes(search.toLowerCase());
    const matchBranch = selectedBranch === 'All' || s.branch === selectedBranch;
    const matchSem = selectedSemester === 'All' || s.semester === selectedSemester;
    return matchSearch && matchBranch && matchSem;
  });

  const filteredSyllabi = syllabi.filter(s => {
    const matchSearch = !search || 
      s.title.toLowerCase().includes(search.toLowerCase()) || 
      s.branch.toLowerCase().includes(search.toLowerCase());
    const matchBranch = selectedBranch === 'All' || s.branch === selectedBranch;
    return matchSearch && matchBranch;
  });

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Academic Governance' },
          { label: 'Academic Catalog', active: true }
        ]}
        title="Academic Catalog"
        description="Official institutional curriculum directory, academic programs, semester course offerings, and unit syllabi."
        badge="Accredited Curriculum"
      />

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto pb-px" aria-label="Catalog Tabs">
          {[
            { id: 'institutions' as CatalogTab, label: 'Institutions', icon: Building, count: 1 },
            { id: 'courses_branches' as CatalogTab, label: 'Courses & Branches', icon: Layers, count: branches.length },
            { id: 'semesters_subjects' as CatalogTab, label: 'Semesters & Subjects', icon: BookOpen, count: subjects.length },
            { id: 'units_topics' as CatalogTab, label: 'Units & Topics', icon: FileText, count: syllabi.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearch('');
                }}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-[#0f2942] text-[#0f2942]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-[#0f2942] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: Institutions */}
      {activeTab === 'institutions' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                  <img src="/images/hiet_crest.png" alt="HIET Crest" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Himachal Institute of Engineering & Technology (HIET)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vidyanagar, Shahpur, Distt. Kangra, Himachal Pradesh – 176206
                  </p>
                </div>
              </div>
              <StatusBadge status="Active" variant="active" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px] uppercase">Affiliated University</span>
                <span className="font-bold text-slate-900 mt-1 block">HPTU Hamirpur</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px] uppercase">Statutory Approval</span>
                <span className="font-bold text-slate-900 mt-1 block">AICTE, New Delhi</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px] uppercase">Establishment Year</span>
                <span className="font-bold text-slate-900 mt-1 block">2010</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px] uppercase">Campus Type</span>
                <span className="font-bold text-slate-900 mt-1 block">Residential & Day Boarding</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Courses & Branches */}
      {activeTab === 'courses_branches' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map(b => (
              <div key={b.code} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-[#0f2942] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#0f2942] font-bold text-xs border border-blue-200">
                    {b.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {b.degree}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{b.name}</h3>
                <p className="text-xs text-slate-500 mb-4">Duration: {b.duration} • Approved Annual Intake: {b.intake}</p>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-600">
                  <span>Curriculum: 8 Semesters</span>
                  <StatusBadge status="Approved" variant="active" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Semesters & Subjects */}
      {activeTab === 'semesters_subjects' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search subject by name or code..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-[#0f2942] outline-hidden transition"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 outline-hidden"
              >
                <option value="All">All Branches</option>
                <option value="CSE">CSE</option>
                <option value="CSE-AIML">CSE AI & ML</option>
                <option value="CE">Civil</option>
                <option value="ME">Mechanical</option>
                <option value="EE">Electrical</option>
              </select>

              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 outline-hidden"
              >
                <option value="All">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredSubjects.length === 0 ? (
            <EmptyState
              title="No subjects found"
              description="Try adjusting your branch, semester or search query."
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Subject Name</th>
                      <th className="py-3 px-4">Branch</th>
                      <th className="py-3 px-4">Sem</th>
                      <th className="py-3 px-4">Credits</th>
                      <th className="py-3 px-4">Faculty In-Charge</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredSubjects.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#0f2942]">
                          {sub.subject_code}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {sub.subject_name}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">
                          {sub.branch}
                        </td>
                        <td className="py-3 px-4">
                          Sem {sub.semester}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {sub.credits || 4}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {sub.teacher_name || 'Department Faculty'}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={sub.status || 'Active'} variant="active" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Units & Topics */}
      {activeTab === 'units_topics' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search syllabus module or unit..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-[#0f2942] outline-hidden transition"
              />
            </div>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 outline-hidden w-full sm:w-auto"
            >
              <option value="All">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="CE">Civil</option>
              <option value="ME">Mechanical</option>
            </select>
          </div>

          {filteredSyllabi.length === 0 ? (
            <EmptyState
              title="No syllabus units found"
              description="No curriculum units matching your search parameters."
            />
          ) : (
            <div className="space-y-3">
              {filteredSyllabi.map(syllabus => {
                const isExpanded = expandedUnitId === syllabus.id;
                return (
                  <div key={syllabus.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div
                      onClick={() => setExpandedUnitId(isExpanded ? null : syllabus.id)}
                      className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-[#0f2942] flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {syllabus.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Branch: {syllabus.branch} • Semester: {syllabus.semester} • Academic Year: {syllabus.academic_year || '2025-26'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                          {(syllabus.units || []).length} Units Defined
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/40 space-y-3">
                        {syllabus.description && (
                          <p className="text-xs text-slate-600 italic">
                            {syllabus.description}
                          </p>
                        )}
                        <div className="space-y-2 mt-2">
                          {(syllabus.units || []).map((unit, uIdx) => (
                            <div key={uIdx} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#0f2942]">
                                  Unit {unit.unitNumber}: {unit.title}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {(unit.topics || []).map((t, tIdx) => (
                                  <span key={tIdx} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-[11px]">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
