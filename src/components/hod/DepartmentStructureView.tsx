import React, { useState } from 'react';
import { 
  Building2, 
  GitBranch, 
  Calendar, 
  Users, 
  Search, 
  GraduationCap, 
  Mail, 
  Phone, 
  ShieldCheck,
  ChevronRight,
  Filter
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { StudentMaster } from '../../types';

export const DepartmentStructureView: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<'All' | 'CSE' | 'CSE AI/ML'>('All');
  const [selectedSemester, setSelectedSemester] = useState<number | 'All'>('All');
  const [selectedSection, setSelectedSection] = useState<'All' | 'A' | 'B'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const allStudents = dataStore.getStudentsMaster();

  // Filter students by Department Hierarchy: Dept -> Branch -> Semester -> Section
  const filteredStudents = allStudents.filter(s => {
    const matchesBranch = selectedBranch === 'All' || s.branch === selectedBranch;
    const matchesSem = selectedSemester === 'All' || s.semester === selectedSemester;
    const matchesSection = selectedSection === 'All' || s.section === selectedSection;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.college_email && s.college_email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesBranch && matchesSem && matchesSection && matchesSearch;
  });

  // Alphabetical sorting as specified in Section 31
  const sortedStudents = [...filteredStudents].sort((a, b) => a.name.localeCompare(b.name));

  const cseCount = allStudents.filter(s => s.branch === 'CSE').length;
  const aimlCount = allStudents.filter(s => s.branch === 'CSE AI/ML').length;

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-1.5 border border-purple-100">
          <Building2 className="w-3.5 h-3.5" />
          <span>Department Organization Hierarchy</span>
          <span>•</span>
          <span>HOD Governance</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Department & Branch Architecture
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Hierarchical view: Department → Branch → Semester → Section → Alphabetically Sorted Students.
        </p>
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div 
          onClick={() => setSelectedBranch(selectedBranch === 'CSE' ? 'All' : 'CSE')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            selectedBranch === 'CSE' 
              ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-200' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
              CSE
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Computer Science & Engineering</h3>
              <p className="text-xs text-slate-500">Core Engineering • B.Tech</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800">
            {cseCount} Students
          </span>
        </div>

        <div 
          onClick={() => setSelectedBranch(selectedBranch === 'CSE AI/ML' ? 'All' : 'CSE AI/ML')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            selectedBranch === 'CSE AI/ML' 
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              AI/ML
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">CSE (Artificial Intelligence & ML)</h3>
              <p className="text-xs text-slate-500">Specialization Track • B.Tech</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800">
            {aimlCount} Students
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search student by name, roll no..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Semester Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-bold">Sem:</span>
              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option value="All">All Semesters</option>
                <option value="1">Sem 1</option>
                <option value="2">Sem 2</option>
                <option value="3">Sem 3</option>
                <option value="4">Sem 4</option>
                <option value="5">Sem 5</option>
                <option value="6">Sem 6</option>
                <option value="7">Sem 7</option>
                <option value="8">Sem 8</option>
              </select>
            </div>

            {/* Section Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-bold">Sec:</span>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option value="All">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Alphabetical Student Roster Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Alphabetical Student Roster ({sortedStudents.length} Students)
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Sorted alphabetically by student name
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Parents / Guardian</th>
                <th className="px-4 py-3">College Email</th>
                <th className="px-4 py-3">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-mono font-bold text-blue-700">
                    {s.roll_no}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {s.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.branch === 'CSE AI/ML' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {s.branch}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    Semester {s.semester}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    Section {s.section}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.father_name ? (
                      <div className="text-[11px]">
                        <div><strong className="text-slate-800">F:</strong> {s.father_name}</div>
                        {s.mother_name && <div><strong className="text-slate-800">M:</strong> {s.mother_name}</div>}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not recorded</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {s.college_email}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.phone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
