import React, { useState } from 'react';
import { Briefcase, Plus, Search, Edit, UserX, CheckCircle2 } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { TeacherMaster } from '../../types';
import { normalizeAuthEmail } from '../../lib/authErrors';

export const TeacherManagementView: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherMaster[]>(() => dataStore.getTeachersMaster());
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherMaster | null>(null);

  // Form
  const [facultyId, setFacultyId] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isHod, setIsHod] = useState(false);

  const filtered = teachers.filter(t => {
    const matchSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.faculty_id.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All' || t.department === deptFilter;
    return matchSearch && matchDept;
  });

  const handleToggleStatus = (id: string) => {
    const updated = teachers.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: (t.status === 'active' ? 'disabled' : 'active') as any
        };
      }
      return t;
    });
    setTeachers(updated);
    dataStore.setTeachersMaster(updated);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyId || !name) return;

    const normalizedEmail = normalizeAuthEmail(email);

    if (editingTeacher) {
      const updated = teachers.map(t =>
        t.id === editingTeacher.id ? { 
          ...t, 
          faculty_id: facultyId, 
          name, 
          full_name: name,
          department, 
          designation, 
          college_email: normalizedEmail || t.college_email, 
          phone, 
          role: (isHod ? 'hod' : 'teacher') as 'teacher' | 'hod',
          is_hod: isHod 
        } : t
      );
      setTeachers(updated);
      dataStore.setTeachersMaster(updated);
    } else {
      const newTch: TeacherMaster = {
        id: `tch-${Date.now()}`,
        faculty_id: facultyId,
        full_name: name,
        name,
        department,
        designation,
        college_email: normalizedEmail || `${facultyId.toLowerCase()}@hiet.ac.in`,
        phone,
        role: isHod ? 'hod' : 'teacher',
        is_hod: isHod,
        status: 'active'
      };
      const updated = [newTch, ...teachers];
      setTeachers(updated);
      dataStore.setTeachersMaster(updated);
    }

    setShowAddModal(false);
    setEditingTeacher(null);
    setFacultyId('');
    setName('');
    setEmail('');
    setPhone('');
    setIsHod(false);
  };

  const startEdit = (t: TeacherMaster) => {
    setEditingTeacher(t);
    setFacultyId(t.faculty_id);
    setName(t.name);
    setDepartment(t.department);
    setDesignation(t.designation);
    setEmail(t.college_email);
    setPhone(t.phone);
    setIsHod(t.is_hod);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            Faculty & Staff Master Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage teacher appointments, department allocations, HOD designations, and authentication records
          </p>
        </div>

        <button
          onClick={() => { setEditingTeacher(null); setShowAddModal(true); }}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Faculty Record
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Department:</span>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-semibold"
          >
            <option value="All">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="ME">ME</option>
            <option value="CE">CE</option>
            <option value="AS&H">AS&H</option>
          </select>
        </div>

        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by faculty name or ID..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs min-w-[580px]">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3">Faculty ID</th>
              <th className="px-4 py-3">Faculty Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Official Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                <td className="px-4 py-3 font-mono font-bold text-amber-700 dark:text-amber-400">{t.faculty_id}</td>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                  {t.name}
                  {t.is_hod && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold text-[10px]">
                      HOD
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.department}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">{t.designation}</td>
                <td className="px-4 py-3 font-mono text-slate-500">{t.college_email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    t.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button
                    onClick={() => startEdit(t)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                    title="Edit Record"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(t.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                    title={t.status === 'active' ? 'Disable Faculty' : 'Activate Faculty'}
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {editingTeacher ? 'Edit Faculty Master Record' : 'Register Faculty in Master DB'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Authorized faculty ID will allow the instructor to activate their digital portal.
            </p>

            <form onSubmit={handleSaveTeacher} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-600 mb-1">Faculty ID</label>
                  <input
                    type="text"
                    value={facultyId}
                    onChange={e => setFacultyId(e.target.value)}
                    placeholder="e.g. FAC-CSE-04"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Dr. Anil Kumar"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-600 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                    <option value="AS&H">AS&H</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold uppercase text-slate-600 mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. Assistant Professor"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-600 mb-1">College Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="faculty@hiet.ac.in"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-slate-600 mb-1">Official Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isHodCheck"
                  checked={isHod}
                  onChange={e => setIsHod(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600"
                />
                <label htmlFor="isHodCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assign as Head of Department (HOD Privileges)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
