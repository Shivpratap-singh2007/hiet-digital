import React, { useState } from 'react';
import { BookOpen, FileQuestion, Download, ExternalLink, Calendar, Search, Filter } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';

export const SyllabusPyqView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'syllabus' | 'pyq'>('syllabus');
  const [selectedSem, setSelectedSem] = useState<number>(user?.studentMaster?.semester || 6);
  const [selectedBranch, setSelectedBranch] = useState<string>(user?.studentMaster?.branch || 'CSE');
  const [searchQuery, setSearchQuery] = useState('');

  const allSyllabus = dataStore.getSyllabus();
  const allPyqs = dataStore.getPyqs();

  const filteredSyllabus = allSyllabus.filter(s => {
    const matchSem = selectedSem === 0 || s.semester === selectedSem;
    const matchBranch = selectedBranch === 'All' || s.branch === selectedBranch;
    const matchSearch = !searchQuery || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.subject_code?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSem && matchBranch && matchSearch;
  });

  const filteredPyqs = allPyqs.filter(p => {
    const matchSem = selectedSem === 0 || p.semester === selectedSem;
    const matchSearch = !searchQuery || 
      (p.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) || 
      (p.subject_code?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchSem && matchSearch;
  });

  const handleDownload = (filename: string) => {
    alert(`Initiating download for: ${filename}\n(Verified from HIET Academic Resource Server)`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-icon-float-delayed icon-glow-purple" />
            Curriculum & Previous Year Question Bank
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            HPTU prescribed lecture outlines, credit schemes, and 5-year examination question papers
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'syllabus'
                ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Subject Syllabus ({allSyllabus.length})
          </button>
          <button
            onClick={() => setActiveTab('pyq')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'pyq'
                ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Previous Year Papers ({allPyqs.length})
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-wrap items-center gap-3 shadow-xs">
        {/* Branch Filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Branch:</span>
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
          >
            <option value="All">All Branches</option>
            <option value="CSE">Computer Science (CSE)</option>
            <option value="ECE">Electronics (ECE)</option>
            <option value="ME">Mechanical (ME)</option>
            <option value="CE">Civil (CE)</option>
          </select>
        </div>

        {/* Semester Filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Semester:</span>
          <select
            value={selectedSem}
            onChange={e => setSelectedSem(parseInt(e.target.value, 10))}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
          >
            <option value={0}>All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by course title or code..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Content Display */}
      {activeTab === 'syllabus' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSyllabus.map(item => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">
                    {item.subject_code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {item.branch} • Sem {item.semester} • {item.credits} Credits
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Subject: {item.subject_name}
                </p>

                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <p>• Unit I: Theory Foundations & Architecture</p>
                  <p>• Unit II: Design Algorithms & State Minimization</p>
                  <p>• Unit III: Lab Implementations & Case Studies</p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">Official PDF • 2.4 MB</span>
                <button
                  onClick={() => handleDownload(item.title)}
                  className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Syllabus
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Subject Code</th>
                <th className="px-4 py-3">Subject Title</th>
                <th className="px-4 py-3">Exam Session</th>
                <th className="px-4 py-3">Academic Year</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredPyqs.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                  <td className="px-4 py-3 font-mono font-bold text-purple-700 dark:text-purple-400">{p.subject_code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{p.subject_name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                      {p.exam_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{p.year}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDownload(`${p.subject_code}_${p.year}_${p.exam_type}.pdf`)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:text-purple-700 dark:hover:text-purple-300 text-slate-700 dark:text-slate-200 rounded-lg transition font-medium text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PYQ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
