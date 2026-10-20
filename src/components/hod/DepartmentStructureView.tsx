import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  Search, 
  Filter, 
  ChevronRight, 
  ArrowLeft, 
  Copy, 
  Check, 
  Mail, 
  Phone, 
  UserCheck, 
  AlertCircle, 
  Calendar, 
  Layers, 
  LayoutGrid, 
  List, 
  ShieldCheck,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';
import { StudentMaster, TeacherMaster } from '../../types';

// =============================================================================
// INSTITUTIONAL ACADEMIC STRUCTURE DEFINITION
// =============================================================================
export interface AcademicBranch {
  code: string;
  name: string;
  specialization?: string;
  degree: string;
  duration: string;
  intake: number;
  availableSemesters: number[];
  availableSections: string[];
}

export interface AcademicDepartment {
  code: string;
  name: string;
  established: string;
  intake: number;
  programsManaged: string[];
  branches: AcademicBranch[];
}

export const INSTITUTIONAL_DEPARTMENTS: AcademicDepartment[] = [
  {
    code: 'CSE',
    name: 'Department of Computer Science & Engineering',
    established: '2008',
    intake: 120,
    programsManaged: ['B.Tech Computer Science & Engineering', 'B.Tech CSE (AI & ML)'],
    branches: [
      {
        code: 'CSE',
        name: 'Computer Science & Engineering',
        specialization: 'Core Software & Systems Track',
        degree: 'B.Tech',
        duration: '4 Years',
        intake: 60,
        availableSemesters: [1, 6],
        availableSections: ['A', 'B']
      },
      {
        code: 'CSE AI & ML',
        name: 'CSE (Artificial Intelligence & Machine Learning)',
        specialization: 'Applied AI & Intelligent Computing',
        degree: 'B.Tech',
        duration: '4 Years',
        intake: 60,
        availableSemesters: [4],
        availableSections: ['A', 'B']
      }
    ]
  },
  {
    code: 'ECE',
    name: 'Department of Electronics & Communication Engineering',
    established: '2008',
    intake: 60,
    programsManaged: ['B.Tech Electronics & Communication Engineering'],
    branches: [
      {
        code: 'ECE',
        name: 'Electronics & Communication Engineering',
        specialization: 'VLSI, Embedded Systems & Communication Networks',
        degree: 'B.Tech',
        duration: '4 Years',
        intake: 60,
        availableSemesters: [1],
        availableSections: ['A']
      }
    ]
  },
  {
    code: 'CE',
    name: 'Department of Civil Engineering',
    established: '2008',
    intake: 60,
    programsManaged: ['B.Tech Civil Engineering'],
    branches: [
      {
        code: 'CE',
        name: 'Civil Engineering',
        specialization: 'Structural & Infrastructure Engineering',
        degree: 'B.Tech',
        duration: '4 Years',
        intake: 60,
        availableSemesters: [1, 3, 5, 7],
        availableSections: ['A']
      }
    ]
  },
  {
    code: 'ME',
    name: 'Department of Mechanical Engineering',
    established: '2008',
    intake: 60,
    programsManaged: ['B.Tech Mechanical Engineering'],
    branches: [
      {
        code: 'ME',
        name: 'Mechanical Engineering',
        specialization: 'Thermal, Design & Manufacturing Engineering',
        degree: 'B.Tech',
        duration: '4 Years',
        intake: 60,
        availableSemesters: [1, 3, 5, 7],
        availableSections: ['A']
      }
    ]
  },
  {
    code: 'EE',
    name: 'Department of Electrical Engineering',
    established: '2009',
    intake: 60,
    programsManaged: ['B.Tech Electrical Engineering'],
    branches: [
      {
        code: 'EE',
        name: 'Electrical Engineering',
        specialization: 'Power Systems & Energy Engineering',
        degree: 'B.Tech',
        duration: '4 Years',
        intake: 60,
        availableSemesters: [1, 3, 5, 7],
        availableSections: ['A']
      }
    ]
  },
  {
    code: 'AS&H',
    name: 'Department of Applied Sciences & Humanities',
    established: '2008',
    intake: 0,
    programsManaged: ['First-Year Engineering Sciences Foundation'],
    branches: [
      {
        code: 'AS&H',
        name: 'Applied Sciences & Humanities',
        specialization: 'Engineering Physics, Mathematics & Professional Communication',
        degree: 'Foundation',
        duration: '1 Year',
        intake: 0,
        availableSemesters: [1, 2],
        availableSections: ['A', 'B']
      }
    ]
  },
  {
    code: 'BCA',
    name: 'Department of Computer Applications',
    established: '2018',
    intake: 60,
    programsManaged: ['Bachelor of Computer Applications (BCA)'],
    branches: [
      {
        code: 'BCA',
        name: 'Bachelor of Computer Applications',
        specialization: 'Application Development & IT Services',
        degree: 'BCA',
        duration: '3 Years',
        intake: 60,
        availableSemesters: [1, 2, 3, 4, 5, 6],
        availableSections: ['A']
      }
    ]
  }
];

interface Props {
  roleMode?: 'md' | 'principal' | 'hod' | 'admin';
  initialDepartmentCode?: string;
}

export const DepartmentStructureView: React.FC<Props> = ({ roleMode, initialDepartmentCode }) => {
  const { user } = useAuth();
  const effectiveRole = roleMode || (user?.role === 'managing_director' || user?.role === 'md' ? 'md' : user?.role);

  // Drill-down navigation state
  // Levels: 'directory' -> 'department' -> 'branch' -> 'roster'
  const [currentLevel, setCurrentLevel] = useState<'directory' | 'department' | 'branch' | 'roster'>(
    initialDepartmentCode ? 'department' : 'directory'
  );
  const [selectedDeptCode, setSelectedDeptCode] = useState<string>(initialDepartmentCode || 'CSE');
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>('CSE');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedSection, setSelectedSection] = useState<string>('A');

  // Search & Filter state
  const [directorySearch, setDirectorySearch] = useState('');
  const [hodStatusFilter, setHodStatusFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterViewMode, setRosterViewMode] = useState<'table' | 'cards'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Data sources
  const allStudents = dataStore.getStudentsMaster();
  const allTeachers = dataStore.getTeachersMaster();

  // Helper: Copy to clipboard with visual feedback
  const handleCopy = (text: string | undefined, identifier: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(identifier);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper: Find HOD for a department
  const getDepartmentHOD = (deptCode: string): TeacherMaster | undefined => {
    return allTeachers.find(t => {
      const isHodMatch = t.is_hod || t.role === 'hod' || t.designation?.toLowerCase().includes('hod');
      if (!isHodMatch) return false;
      const tDept = (t.department || '').trim().toUpperCase();
      const code = deptCode.trim().toUpperCase();
      return tDept === code || (code === 'CSE' && (tDept === 'CSE' || tDept === 'COMPUTER SCIENCE'));
    });
  };

  // Helper: Find all students for a department
  const getDepartmentStudents = (dept: AcademicDepartment): StudentMaster[] => {
    const branchCodes = dept.branches.map(b => b.code.toUpperCase());
    return allStudents.filter(s => {
      const sBranch = (s.branch || '').trim().toUpperCase();
      const sDept = (s.department || '').trim().toUpperCase();
      const deptCode = dept.code.toUpperCase();
      return branchCodes.includes(sBranch) || sDept === deptCode || sBranch === deptCode;
    });
  };

  // Helper: Find students for a specific branch
  const getBranchStudents = (branchCode: string): StudentMaster[] => {
    const cleanBranch = branchCode.trim().toUpperCase();
    return allStudents.filter(s => {
      const sBranch = (s.branch || '').trim().toUpperCase();
      if (cleanBranch === 'CSE AI & ML' || cleanBranch === 'CSE AI/ML') {
        return sBranch === 'CSE AI & ML' || sBranch === 'CSE AI/ML';
      }
      return sBranch === cleanBranch;
    });
  };

  // Helper: Find students for a specific class (Branch + Sem + Section)
  const getClassStudents = (branchCode: string, sem: number, sec: string): StudentMaster[] => {
    const branchStudents = getBranchStudents(branchCode);
    return branchStudents.filter(s => s.semester === sem && s.section?.toUpperCase() === sec.toUpperCase());
  };

  // Helper: Calculate total sections under a department
  const getDepartmentSectionCount = (dept: AcademicDepartment): number => {
    let count = 0;
    dept.branches.forEach(b => {
      b.availableSemesters.forEach(sem => {
        b.availableSections.forEach(sec => {
          const enrolled = getClassStudents(b.code, sem, sec).length;
          if (enrolled > 0) count++;
        });
      });
    });
    return count;
  };

  // Currently selected objects
  const selectedDept = INSTITUTIONAL_DEPARTMENTS.find(d => d.code === selectedDeptCode) || INSTITUTIONAL_DEPARTMENTS[0];
  const selectedBranch = selectedDept.branches.find(b => b.code === selectedBranchCode) || selectedDept.branches[0] || {
    code: selectedBranchCode,
    name: selectedBranchCode,
    degree: 'B.Tech',
    duration: '4 Years',
    intake: 60,
    availableSemesters: [1],
    availableSections: ['A']
  };

  // Filtered HOD Directory
  const filteredDepartments = useMemo(() => {
    return INSTITUTIONAL_DEPARTMENTS.filter(dept => {
      const hod = getDepartmentHOD(dept.code);
      const matchesSearch = 
        dept.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
        dept.code.toLowerCase().includes(directorySearch.toLowerCase()) ||
        (hod && (
          hod.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
          hod.faculty_id.toLowerCase().includes(directorySearch.toLowerCase())
        ));

      if (!matchesSearch) return false;

      if (hodStatusFilter === 'assigned') return !!hod;
      if (hodStatusFilter === 'unassigned') return !hod;
      return true;
    });
  }, [directorySearch, hodStatusFilter, allTeachers]);

  // Current class roster students (alphabetically sorted by legal name)
  const classStudents = useMemo(() => {
    const raw = getClassStudents(selectedBranch.code, selectedSemester, selectedSection);
    const filtered = raw.filter(s => {
      if (!rosterSearch) return true;
      const q = rosterSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.roll_no.toLowerCase().includes(q) ||
        (s.college_email && s.college_email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.father_name && s.father_name.toLowerCase().includes(q))
      );
    });
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedBranch.code, selectedSemester, selectedSection, rosterSearch, allStudents]);

  // Overall Campus Stats
  const totalCampusStudents = allStudents.length;
  const assignedHodsCount = INSTITUTIONAL_DEPARTMENTS.filter(d => !!getDepartmentHOD(d.code)).length;
  const unassignedHodsCount = INSTITUTIONAL_DEPARTMENTS.length - assignedHodsCount;

  // Navigation handlers
  const handleSelectDepartment = (deptCode: string) => {
    const dept = INSTITUTIONAL_DEPARTMENTS.find(d => d.code === deptCode);
    setSelectedDeptCode(deptCode);
    if (dept && dept.branches.length > 0) {
      setSelectedBranchCode(dept.branches[0].code);
      setSelectedSemester(dept.branches[0].availableSemesters[0] || 1);
      setSelectedSection(dept.branches[0].availableSections[0] || 'A');
    }
    setCurrentLevel('department');
  };

  const handleSelectBranch = (branchCode: string) => {
    const branch = selectedDept.branches.find(b => b.code === branchCode);
    setSelectedBranchCode(branchCode);
    if (branch) {
      setSelectedSemester(branch.availableSemesters[0] || 1);
      setSelectedSection(branch.availableSections[0] || 'A');
    }
    setCurrentLevel('branch');
  };

  const handleSelectClass = (sem: number, sec: string) => {
    setSelectedSemester(sem);
    setSelectedSection(sec);
    setCurrentLevel('roster');
  };

  const renderStudentCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {classStudents.map(student => {
        const isRollCopied = copiedId === `roll-card-${student.id}`;
        const isEmailCopied = copiedId === `email-card-${student.id}`;
        const isPhoneCopied = copiedId === `phone-card-${student.id}`;
        const isParentPhoneCopied = copiedId === `parent-phone-card-${student.id}`;

        return (
          <div
            key={student.id}
            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs space-y-4"
          >
            {/* Student Card Top Bar */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-extrabold flex items-center justify-center font-mono border border-neutral-300 dark:border-neutral-700">
                  {student.name[0] || 'S'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-black dark:text-white">
                    {student.name}
                  </h4>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {student.course} — {student.branch}
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border border-neutral-300 dark:border-neutral-700">
                {student.attendance_percentage ?? 85}% Att.
              </span>
            </div>

            {/* Group 1: Student Information (Section 7) */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Student Information
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Roll Number</span>
                  <div className="font-mono font-bold text-black dark:text-white flex items-center justify-between">
                    <span className="truncate">{student.roll_no}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(student.roll_no, `roll-card-${student.id}`)}
                      className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white transition cursor-pointer"
                    >
                      {isRollCopied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Class Cadre</span>
                  <span className="font-mono font-bold text-black dark:text-white">
                    Sem {student.semester} — Sec {student.section}
                  </span>
                </div>
              </div>
            </div>

            {/* Group 2: Contact & Guardian Information (Section 7) */}
            <div className="space-y-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Contact & Guardian Information
              </span>

              <div className="space-y-2 text-xs">
                {/* College Email */}
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="font-mono text-neutral-700 dark:text-neutral-300 truncate">
                      {student.college_email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(student.college_email, `email-card-${student.id}`)}
                    className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white transition shrink-0 cursor-pointer"
                  >
                    {isEmailCopied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Guardian Details & Phones */}
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Father: <strong className="text-black dark:text-white">{student.father_name || 'Not Recorded'}</strong></span>
                    {student.mother_name && (
                      <span className="text-neutral-500">Mother: <strong className="text-black dark:text-white">{student.mother_name}</strong></span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-800 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-neutral-400" />
                      <span>Student: {student.phone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(student.phone, `phone-card-${student.id}`)}
                      className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white transition cursor-pointer"
                    >
                      {isPhoneCopied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {student.parent_phone && (
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>Parent: {student.parent_phone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(student.parent_phone, `parent-phone-card-${student.id}`)}
                        className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white transition cursor-pointer"
                      >
                        {isParentPhoneCopied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5 font-sans pb-12 animate-fade-in text-black dark:text-white w-full max-w-full overflow-hidden">
      {/* =========================================================================
          BREADCRUMBS & TOP LEVEL HEADER (Strict Monochrome)
      ========================================================================= */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {/* Interactive Breadcrumb Bar */}
            <nav className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setCurrentLevel('directory')}
                className={`font-semibold hover:text-black dark:hover:text-white transition flex items-center gap-1 cursor-pointer ${
                  currentLevel === 'directory' ? 'font-bold text-black dark:text-white' : ''
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>HOD Directory</span>
              </button>

              {currentLevel !== 'directory' && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  <button
                    type="button"
                    onClick={() => setCurrentLevel('department')}
                    className={`hover:text-black dark:hover:text-white transition cursor-pointer ${
                      currentLevel === 'department' ? 'font-bold text-black dark:text-white' : ''
                    }`}
                  >
                    {selectedDept.name}
                  </button>
                </>
              )}

              {(currentLevel === 'branch' || currentLevel === 'roster') && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  <button
                    type="button"
                    onClick={() => setCurrentLevel('branch')}
                    className={`hover:text-black dark:hover:text-white transition cursor-pointer ${
                      currentLevel === 'branch' ? 'font-bold text-black dark:text-white' : ''
                    }`}
                  >
                    {selectedBranch.name}
                  </button>
                </>
              )}

              {currentLevel === 'roster' && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="font-bold text-black dark:text-white">
                    Sem {selectedSemester} — Sec {selectedSection} Roster
                  </span>
                </>
              )}
            </nav>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-black dark:text-white">
              {currentLevel === 'directory' && 'Academic Departments & HOD Directory'}
              {currentLevel === 'department' && selectedDept.name}
              {currentLevel === 'branch' && `${selectedBranch.name} (${selectedBranch.degree})`}
              {currentLevel === 'roster' && `Class Roster — ${selectedBranch.name} Sem ${selectedSemester} (${selectedSection})`}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {currentLevel === 'directory' && 'Institution-wide organizational governance • Managing Director executive overview'}
              {currentLevel === 'department' && `Department Code: ${selectedDept.code} • Established ${selectedDept.established} • Approved Intake: ${selectedDept.intake}`}
              {currentLevel === 'branch' && `Specialization: ${selectedBranch.specialization || 'Core Curriculum'} • Duration: ${selectedBranch.duration}`}
              {currentLevel === 'roster' && `Enrolled students list alphabetically ordered • Single-line institutional identifiers`}
            </p>
          </div>

          {/* Back Action Button (if not on first screen) */}
          {currentLevel !== 'directory' && (
            <button
              type="button"
              onClick={() => {
                if (currentLevel === 'roster') setCurrentLevel('branch');
                else if (currentLevel === 'branch') setCurrentLevel('department');
                else if (currentLevel === 'department') setCurrentLevel('directory');
              }}
              className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {currentLevel === 'roster' ? 'Semesters' : currentLevel === 'branch' ? 'Department' : 'HOD Directory'}</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          LEVEL 1: HOD DIRECTORY (FIRST SCREEN)
      ========================================================================= */}
      {currentLevel === 'directory' && (
        <div className="space-y-5">
          {/* Institutional Macro Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Total Departments
              </span>
              <div className="mt-1 text-2xl font-extrabold font-mono text-black dark:text-white">
                {INSTITUTIONAL_DEPARTMENTS.length}
              </div>
              <p className="text-[10px] text-neutral-500 mt-0.5">Approved academic faculties</p>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Assigned HODs
              </span>
              <div className="mt-1 text-2xl font-extrabold font-mono text-black dark:text-white">
                {assignedHodsCount}
              </div>
              <p className="text-[10px] text-neutral-500 mt-0.5">Active statutory heads</p>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Vacant HOD Posts
              </span>
              <div className="mt-1 text-2xl font-extrabold font-mono text-black dark:text-white">
                {unassignedHodsCount}
              </div>
              <p className="text-[10px] text-neutral-500 mt-0.5">HOD Not Assigned</p>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Total Campus Students
              </span>
              <div className="mt-1 text-2xl font-extrabold font-mono text-black dark:text-white">
                {totalCampusStudents}
              </div>
              <p className="text-[10px] text-neutral-500 mt-0.5">Zero double-counting</p>
            </div>
          </div>

          {/* Directory Search & Filter Controls */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={directorySearch}
                onChange={e => setDirectorySearch(e.target.value)}
                placeholder="Search department, HOD name, ID..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-black dark:text-white focus:outline-hidden focus:border-black dark:focus:border-white transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
              <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="font-bold text-neutral-600 dark:text-neutral-400 shrink-0">HOD Status:</span>
              <select
                value={hodStatusFilter}
                onChange={e => setHodStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs text-black dark:text-white font-semibold focus:outline-hidden"
              >
                <option value="all">All Departments ({INSTITUTIONAL_DEPARTMENTS.length})</option>
                <option value="assigned">HOD Assigned ({assignedHodsCount})</option>
                <option value="unassigned">HOD Not Assigned ({unassignedHodsCount})</option>
              </select>
            </div>
          </div>

          {/* HOD Directory Cards Grid (Section 3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map(dept => {
              const hod = getDepartmentHOD(dept.code);
              const deptStudents = getDepartmentStudents(dept);
              const studentCount = deptStudents.length;
              const sectionCount = getDepartmentSectionCount(dept);
              const isAssigned = !!hod;

              return (
                <div
                  key={dept.code}
                  onClick={() => handleSelectDepartment(dept.code)}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xs hover:border-black dark:hover:border-white transition cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    {/* Header: Dept Code Badge & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-mono font-bold text-xs border border-neutral-300 dark:border-neutral-700">
                          {dept.code}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          Est. {dept.established}
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isAssigned
                          ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black'
                          : 'bg-neutral-100 text-neutral-600 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}>
                        {isAssigned ? 'Active HOD' : 'HOD Not Assigned'}
                      </span>
                    </div>

                    {/* Department Title */}
                    <div>
                      <h3 className="font-bold text-sm text-black dark:text-white group-hover:underline">
                        {dept.name}
                      </h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                        {dept.programsManaged.join(' • ')}
                      </p>
                    </div>

                    {/* HOD Profile Details Block */}
                    <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                          Designation
                        </span>
                        <span className="font-semibold text-[11px] text-black dark:text-white">
                          {isAssigned ? 'Head of Department (HOD)' : 'Vacant Position'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 pt-1">
                        <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {isAssigned ? (hod.name.replace(/^(Dr\.|Er\.|Prof\.|Mr\.|Ms\.)\s*/, '')[0] || 'H') : '?'}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-black dark:text-white text-xs truncate">
                            {isAssigned ? hod.name : 'HOD Not Assigned'}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono truncate">
                            {isAssigned ? `ID: ${hod.faculty_id}` : 'Official appointment pending'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Department Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Students</span>
                        <span className="font-mono font-bold text-sm text-black dark:text-white">
                          {studentCount} {studentCount === 1 ? 'Student' : 'Students'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">Class Sections</span>
                        <span className="font-mono font-bold text-sm text-black dark:text-white">
                          {sectionCount} {sectionCount === 1 ? 'Section' : 'Sections'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Call to Action */}
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-4 flex items-center justify-between text-xs font-bold text-black dark:text-white">
                    <span>View Department Hierarchy</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          LEVEL 2: DEPARTMENT SCREEN (PROGRAMS & BRANCHES)
      ========================================================================= */}
      {currentLevel === 'department' && (
        <div className="space-y-5">
          {/* Department Executive Overview Banner */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center font-bold text-lg font-mono border border-neutral-300 dark:border-neutral-700">
                  {selectedDept.code}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-black dark:text-white">
                    {selectedDept.name}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Established: {selectedDept.established} • Approved Total Intake: {selectedDept.intake} seats
                  </p>
                </div>
              </div>

              {/* HOD Status Pill */}
              <div className="text-xs self-start sm:self-auto">
                {(() => {
                  const hod = getDepartmentHOD(selectedDept.code);
                  return hod ? (
                    <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
                      <UserCheck className="w-4 h-4 text-black dark:text-white" />
                      <div>
                        <div className="font-bold text-black dark:text-white text-xs">{hod.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">Head of Department • {hod.faculty_id}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                      <AlertCircle className="w-4 h-4 text-neutral-500" />
                      <span className="font-bold text-xs">HOD Not Assigned</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Department Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Department Students</span>
                <span className="font-mono font-bold text-lg text-black dark:text-white">
                  {getDepartmentStudents(selectedDept).length} Students
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Academic Branches</span>
                <span className="font-mono font-bold text-lg text-black dark:text-white">
                  {selectedDept.branches.length} Tracks
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Active Class Sections</span>
                <span className="font-mono font-bold text-lg text-black dark:text-white">
                  {getDepartmentSectionCount(selectedDept)} Sections
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Campus Administrative Scope</span>
                <span className="font-bold text-sm text-black dark:text-white">
                  Institution-wide
                </span>
              </div>
            </div>
          </div>

          {/* Academic Programs & Branches Grid (Section 4) */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black dark:text-neutral-200">
              Academic Programs & Branches under {selectedDept.name}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedDept.branches.map(branch => {
                const branchStudents = getBranchStudents(branch.code);
                const count = branchStudents.length;

                return (
                  <div
                    key={branch.code}
                    onClick={() => handleSelectBranch(branch.code)}
                    className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs hover:border-black dark:hover:border-white transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-mono font-bold text-xs border border-neutral-300 dark:border-neutral-700">
                          {branch.code}
                        </span>
                        <span className="text-xs font-semibold text-neutral-500 font-mono">
                          {branch.degree} • {branch.duration}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-black dark:text-white group-hover:underline">
                          {branch.name}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {branch.specialization || 'Undergraduate Engineering Program'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Enrolled Students</span>
                          <span className="font-mono font-bold text-black dark:text-white">
                            {count} {count === 1 ? 'Student' : 'Students'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Semesters / Years</span>
                          <span className="font-mono font-bold text-black dark:text-white">
                            {branch.availableSemesters.length} Semesters
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-4 flex items-center justify-between text-xs font-bold text-black dark:text-white">
                      <span>View Available Semesters & Sections</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LEVEL 3: PROGRAM / BRANCH VIEW (SEMESTERS & SECTIONS)
      ========================================================================= */}
      {currentLevel === 'branch' && (
        <div className="space-y-5">
          {/* Branch Overview Header */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-mono font-bold text-xs border border-neutral-300 dark:border-neutral-700">
                    {selectedBranch.code}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    {selectedBranch.degree} • {selectedBranch.duration}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-black dark:text-white mt-1">
                  {selectedBranch.name}
                </h2>
                <p className="text-xs text-neutral-500">
                  {selectedDept.name} • Approved Annual Intake: {selectedBranch.intake} seats
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-right self-start sm:self-auto">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Active Enrollment</span>
                <span className="font-mono font-bold text-lg text-black dark:text-white">
                  {getBranchStudents(selectedBranch.code).length} Students
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Select a semester and class section below to inspect the verified student roster.
            </p>
          </div>

          {/* Semesters & Class Sections Grid (Section 4) */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black dark:text-neutral-200">
              Available Class Sections
            </h3>

            {selectedBranch.availableSemesters.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 text-xs">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                <p className="font-bold text-black dark:text-white">No Active Classes</p>
                <p className="text-[11px] mt-0.5">No academic semesters or sections are scheduled for this branch.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {selectedBranch.availableSemesters.flatMap(sem =>
                  selectedBranch.availableSections.map(sec => {
                    const studentsInClass = getClassStudents(selectedBranch.code, sem, sec);
                    const count = studentsInClass.length;

                    return (
                      <div
                        key={`${sem}-${sec}`}
                        onClick={() => handleSelectClass(sem, sec)}
                        className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs hover:border-black dark:hover:border-white transition cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm text-black dark:text-white">
                              Semester {sem} — Section {sec}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              count > 0
                                ? 'bg-black text-white border-black dark:bg-white dark:text-black'
                                : 'bg-neutral-100 text-neutral-500 border-neutral-300 dark:bg-neutral-800'
                            }`}>
                              {count > 0 ? `${count} Enrolled` : '0 Students'}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Class Cadre</span>
                            <div className="font-semibold text-black dark:text-white truncate">
                              {selectedBranch.code} Sem {sem} ({sec})
                            </div>
                            <div className="text-[10px] text-neutral-500">
                              {sem === 1 && sec === 'A' && selectedBranch.code === 'CSE'
                                ? 'Class In-Charge: Mr. Rohit Mehta'
                                : 'Class In-Charge: Designated Faculty'}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 mt-3 flex items-center justify-between text-xs font-bold text-black dark:text-white">
                          <span>Open Student Roster</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          LEVEL 4: CLASS STUDENT ROSTER (SECTIONS 5, 6, 7)
      ========================================================================= */}
      {currentLevel === 'roster' && (
        <div className="space-y-4">
          {/* Roster Search & View Mode Selector */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={rosterSearch}
                onChange={e => setRosterSearch(e.target.value)}
                placeholder="Search by student name, roll number, email..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-black dark:text-white focus:outline-hidden focus:border-black dark:focus:border-white transition"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-neutral-500 font-mono">
                Showing {classStudents.length} Students
              </span>

              {/* View Switcher: Table vs Cards */}
              <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setRosterViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    rosterViewMode === 'table'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-neutral-500 hover:text-black dark:hover:text-white'
                  }`}
                  title="Table View (Desktop-optimized)"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRosterViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    rosterViewMode === 'cards'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-neutral-500 hover:text-black dark:hover:text-white'
                  }`}
                  title="Card View (Mobile-optimized)"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {classStudents.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 text-xs space-y-2">
              <Users className="w-8 h-8 mx-auto text-neutral-400" />
              <p className="font-bold text-black dark:text-white text-sm">No Student Records Found</p>
              <p className="text-[11px] max-w-sm mx-auto">
                {rosterSearch
                  ? `No students match search query "${rosterSearch}" in ${selectedBranch.name} Sem ${selectedSemester} (${selectedSection}).`
                  : `0 Students currently enrolled in ${selectedBranch.name} Semester ${selectedSemester} Section ${selectedSection}.`}
              </p>
            </div>
          ) : rosterViewMode === 'table' ? (
            /* ===================================================================
               DESKTOP ROSTER TABLE (SECTIONS 5, 6, 7)
               - Non-wrapping Single-line Roll Numbers
               - Unabbreviated Full Legal Student Names
               - Contained Parents/Guardian & College Email Layouts
               - Copy buttons for roll numbers and emails
            =================================================================== */
            <>
              {/* DESKTOP ROSTER TABLE (hidden md:block) */}
              <div className="hidden md:block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white uppercase tracking-wider font-extrabold border-b border-neutral-200 dark:border-neutral-700 text-[11px]">
                    <tr>
                      <th className="px-4 py-3 min-w-[170px] whitespace-nowrap">Roll No / Institutional ID</th>
                      <th className="px-4 py-3 min-w-[180px] whitespace-nowrap">Student Full Name</th>
                      <th className="px-4 py-3 min-w-[130px] whitespace-nowrap">Program / Branch</th>
                      <th className="px-4 py-3 min-w-[100px] whitespace-nowrap">Class Cadre</th>
                      <th className="px-4 py-3 min-w-[210px] max-w-[280px]">Parents / Guardian</th>
                      <th className="px-4 py-3 min-w-[220px]">College Email</th>
                      <th className="px-4 py-3 min-w-[140px] whitespace-nowrap">Student Phone</th>
                      <th className="px-4 py-3 min-w-[100px] text-right whitespace-nowrap">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {classStudents.map(student => {
                      const isRollCopied = copiedId === `roll-${student.id}`;
                      const isEmailCopied = copiedId === `email-${student.id}`;
                      const isPhoneCopied = copiedId === `phone-${student.id}`;

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition"
                        >
                          {/* 1. Roll Number / Institutional ID (Section 5: Non-wrapping, min-width, readable single-line) */}
                          <td className="px-4 py-3 font-mono font-bold text-black dark:text-white whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <span>{student.roll_no}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(student.roll_no, `roll-${student.id}`)}
                                title="Copy Roll Number"
                                className="p-1 rounded-md text-neutral-400 hover:text-black dark:hover:text-white transition cursor-pointer"
                              >
                                {isRollCopied ? (
                                  <Check className="w-3.5 h-3.5 text-black dark:text-white" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* 2. Full Student Name (Section 6: Unabbreviated, single-line) */}
                          <td className="px-4 py-3 font-bold text-black dark:text-white whitespace-nowrap">
                            {student.name}
                          </td>

                          {/* 3. Program / Branch */}
                          <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap font-medium">
                            {student.course} — {student.branch}
                          </td>

                          {/* 4. Semester & Section */}
                          <td className="px-4 py-3 font-mono text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                            Sem {student.semester} ({student.section})
                          </td>

                          {/* 5. Parents / Guardian Details (Section 7: Well-defined column, contained, not spilling) */}
                          <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                            {student.father_name ? (
                              <div className="space-y-0.5 text-[11px]">
                                <div className="truncate">
                                  <strong className="text-black dark:text-white font-semibold">F:</strong> {student.father_name}
                                </div>
                                {student.mother_name && (
                                  <div className="truncate">
                                    <strong className="text-black dark:text-white font-semibold">M:</strong> {student.mother_name}
                                  </div>
                                )}
                                {student.parent_phone && (
                                  <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                                    <span>Tel: {student.parent_phone}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-neutral-400 italic text-[11px]">Official records pending</span>
                            )}
                          </td>

                          {/* 6. College Email (Section 7: Contained, copy button) */}
                          <td className="px-4 py-3 font-mono text-neutral-700 dark:text-neutral-300">
                            <div className="inline-flex items-center gap-1.5 max-w-[210px]">
                              <span className="truncate">{student.college_email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(student.college_email, `email-${student.id}`)}
                                title="Copy Email"
                                className="p-1 rounded-md text-neutral-400 hover:text-black dark:hover:text-white transition cursor-pointer shrink-0"
                              >
                                {isEmailCopied ? (
                                  <Check className="w-3.5 h-3.5 text-black dark:text-white" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* 7. Student Phone */}
                          <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <span>{student.phone}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(student.phone, `phone-${student.id}`)}
                                title="Copy Phone Number"
                                className="p-1 rounded-md text-neutral-400 hover:text-black dark:hover:text-white transition cursor-pointer"
                              >
                                {isPhoneCopied ? (
                                  <Check className="w-3.5 h-3.5 text-black dark:text-white" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* 8. Attendance Rate */}
                          <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border border-neutral-300 dark:border-neutral-700 text-[10px]">
                              {student.attendance_percentage ?? 85}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View: Compact vertically structured student detail cards (md:hidden) */}
            <div className="md:hidden">
              {renderStudentCards()}
            </div>
          </>
          ) : (
            renderStudentCards()
          )}
        </div>
      )}
    </div>
  );
};