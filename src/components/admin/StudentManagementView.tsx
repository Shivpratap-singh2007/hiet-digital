import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  ShieldCheck, 
  CheckCircle2, 
  UserX, 
  UploadCloud, 
  ArrowUpDown, 
  X 
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { StudentMaster } from '../../types';
import { normalizeAuthEmail } from '../../lib/authErrors';

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export const StudentManagementView: React.FC<Props> = ({ onNavigateTab }) => {
  const [students, setStudents] = useState<StudentMaster[]>([]);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [semFilter, setSemFilter] = useState(0);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentMaster | null>(null);

  // Form State
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [course, setCourse] = useState('B.Tech');
  const [branch, setBranch] = useState('CSE');
  const [semester, setSemester] = useState(6);
  const [section, setSection] = useState('A');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getStudentsPaged({
        search,
        branch: branchFilter !== 'All' ? branchFilter : undefined,
        semester: semFilter > 0 ? semFilter : undefined,
        page,
        pageSize
      });
      setStudents(res.data);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (e) {
      console.warn('Error fetching paged students:', e);
    } finally {
      setLoading(false);
    }
  }, [search, branchFilter, semFilter, page, pageSize]);

  useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  const handleToggleStatus = (id: string) => {
    const updated = students.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: (s.status === 'active' ? 'disabled' : 'active') as any
        };
      }
      return s;
    });
    setStudents(updated);
    dataStore.setStudentsMaster(
      dataStore.getStudentsMaster().map(s => s.id === id ? { ...s, status: (s.status === 'active' ? 'disabled' : 'active') as any } : s)
    );
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo || !name) return;

    const normalizedEmail = normalizeAuthEmail(email);

    if (editingStudent) {
      const updated = students.map(s => 
        s.id === editingStudent.id ? { ...s, roll_no: rollNo, name, course, branch, semester, section, college_email: normalizedEmail || s.college_email, phone } : s
      );
      setStudents(updated);
      dataStore.setStudentsMaster(updated);
    } else {
      const newStd: StudentMaster = {
        id: `std-${Date.now()}`,
        roll_no: rollNo,
        name,
        course,
        branch,
        semester,
        section,
        college_email: normalizedEmail || `${rollNo.toLowerCase()}@hiet.ac.in`,
        phone,
        status: 'active'
      };
      const updated = [newStd, ...students];
      setStudents(updated);
      dataStore.setStudentsMaster(updated);
    }

    setShowAddModal(false);
    setEditingStudent(null);
    setRollNo('');
    setName('');
    setEmail('');
    setPhone('');
  };

  const startEdit = (s: StudentMaster) => {
    setEditingStudent(s);
    setRollNo(s.roll_no);
    setName(s.name);
    setCourse(s.course);
    setBranch(s.branch);
    setSemester(s.semester);
    setSection(s.section);
    setEmail(s.college_email);
    setPhone(s.phone);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Academic Governance' },
          { label: 'Students', active: true }
        ]}
        title="Students"
        description="Manage student accounts, academic information and access status."
        badge={`${totalCount} Total Students`}
        actions={
          <div className="flex items-center gap-2">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('import_data')}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0f2942] text-xs font-bold text-[#0f2942] transition flex items-center gap-1.5 shadow-2xs"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Import Batch</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setEditingStudent(null);
                setRollNo('');
                setName('');
                setEmail('');
                setPhone('');
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        }
      />

      {/* Top Controls: Search students, Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, roll no, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-[#0f2942] outline-hidden transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <select
            value={branchFilter}
            onChange={e => {
              setBranchFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 outline-hidden"
          >
            <option value="All">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="CSE AI & ML">CSE AI & ML</option>
            <option value="CE">Civil</option>
            <option value="ME">Mechanical</option>
            <option value="EE">Electrical</option>
          </select>

          <select
            value={semFilter}
            onChange={e => {
              setSemFilter(Number(e.target.value));
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 outline-hidden"
          >
            <option value={0}>All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Management Table (Desktop) & Cards (Mobile) */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 shadow-2xs">
          <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-[#0f2942] rounded-full animate-spin mb-2" />
          <p>Querying verified student records...</p>
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Try adjusting your search criteria, branch or semester filters."
          action={{
            label: 'Add New Student',
            onClick: () => setShowAddModal(true),
            icon: Plus
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Semester</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-[#0f2942] font-bold flex items-center justify-center text-xs shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div>{s.name}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{s.college_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0f2942]">
                        {s.roll_no}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {s.branch || s.department || 'CSE'}
                      </td>
                      <td className="py-3.5 px-4">
                        Sem {s.semester} (Sec {s.section})
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={s.status} variant={s.status === 'active' ? 'active' : 'disabled'} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(s)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#0f2942] hover:bg-slate-100 transition"
                            title="Edit Student Info"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(s.id)}
                            className={`p-1.5 rounded-lg transition ${
                              s.status === 'active'
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={s.status === 'active' ? 'Disable Student Access' : 'Activate Student'}
                          >
                            {s.status === 'active' ? <UserX className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-2.5">
            {students.map(s => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                    <span className="font-mono text-xs text-[#0f2942] font-semibold">{s.roll_no}</span>
                  </div>
                  <StatusBadge status={s.status} variant={s.status === 'active' ? 'active' : 'disabled'} />
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600">
                  <span>{s.branch} • Sem {s.semester} ({s.section})</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="p-1 rounded text-slate-500 hover:text-[#0f2942]"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(s.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-600"
                    >
                      {s.status === 'active' ? <UserX className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-1">
              <span>Page {page} of {totalPages} ({totalCount} total students)</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 transition"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingStudent ? 'Edit Student Record' : 'Enroll New Student'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Official HIET student master database</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    University Roll Number
                  </label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={e => setRollNo(e.target.value)}
                    placeholder="e.g. 210106 or CSE001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0f2942] outline-hidden text-xs uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Student Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0f2942] outline-hidden text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Branch / Dept
                  </label>
                  <select
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0f2942] outline-hidden text-xs"
                  >
                    <option value="CSE">CSE</option>
                    <option value="CSE AI & ML">CSE AI & ML</option>
                    <option value="CE">Civil</option>
                    <option value="ME">Mechanical</option>
                    <option value="EE">Electrical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={e => setSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0f2942] outline-hidden text-xs"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    placeholder="A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0f2942] outline-hidden text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  College Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. name@hiet.ac.in"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0f2942] outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 94180 XXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0f2942] outline-hidden text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl font-bold shadow-xs transition"
                >
                  {editingStudent ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
