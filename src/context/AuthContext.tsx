import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, StudentMaster, TeacherMaster, UserRole, WorkspaceOption } from '../types';
import { apiService, isSupabaseConfigured, supabase } from '../lib/supabase';
import { dataStore } from '../lib/mockData';
import { formatAuthError, normalizeAuthEmail } from '../lib/authErrors';

interface AuthContextType {
  user: Profile | null;
  role: UserRole | null;
  activeRoles: string[];
  activeWorkspaceRole: string | null;
  workspaceRoles: { roleKey: string; label: string; departmentName?: string }[];
  isLoading: boolean;
  mustChangePassword: boolean;
  login: (emailOrId: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchWorkspace: (workspaceRole: string) => Promise<void>;
  verifyStudentRollNo: (rollNo: string) => Promise<{ success: boolean; data?: StudentMaster; error?: string }>;
  verifyTeacherFacultyId: (facultyId: string) => Promise<{ success: boolean; data?: TeacherMaster; error?: string }>;
  verifyFaculty: (facultyId: string, fullName: string) => Promise<{ success: boolean; data?: TeacherMaster; error?: string }>;
  registerStudent: (student: StudentMaster, tempPassword?: string, customEmail?: string) => Promise<{ success: boolean; error?: string; emailVerificationRequired?: boolean }>;
  registerTeacher: (teacher: TeacherMaster, tempPassword?: string, customEmail?: string) => Promise<{ success: boolean; error?: string; emailVerificationRequired?: boolean }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  switchDemoRole: (role: UserRole) => void;
  switchDemoUser: (identifier: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getRoleRedirect(role?: string | null): string {
  switch (role?.toLowerCase()) {
    case 'student': return '/app/student';
    case 'teacher':
    case 'faculty': return '/app/faculty';
    case 'hod': return '/app/hod';
    case 'admin':
    case 'principal': return '/app/admin';
    case 'managing_director':
    case 'md': return '/app/md';
    case 'security':
    case 'security_guard': return '/app/security';
    case 'warden': return '/app/warden';
    case 'library_staff': return '/app/library';
    case 'lab_staff': return '/app/lab';
    case 'it_staff': return '/app/it';
    default: return '/app/student';
  }
}

// =============================================================================
// MASTER DEMO PROFILES (5 Faculty + 2 HODs + 1 Class In-Charge + 2 Wardens + 30 Students)
// =============================================================================
import {
  ALL_DEMO_PROFILES,
  ALL_DEMO_FACULTY_PROFILES,
  ALL_DEMO_STUDENT_PROFILES,
  ALL_DEMO_STAFF_PROFILES,
  DEMO_FACULTY_ANUJ,
  DEMO_FACULTY_KAVITA,
  DEMO_FACULTY_ROHIT,
  DEMO_FACULTY_NEHA,
  DEMO_FACULTY_POOJA,
  DEMO_PRINCIPAL_RAJESH,
  DEMO_MD_SHARMA,
  DEMO_SECURITY_RAMESH,
  DEMO_LIBRARY_SUNITA,
  DEMO_LAB_MOHIT,
  DEMO_IT_VIKRAM
} from '../lib/mockDemoUsers';

export const DEMO_STUDENT_ADITYA = ALL_DEMO_STUDENT_PROFILES[0];
export const DEMO_STUDENT_AARAV = ALL_DEMO_STUDENT_PROFILES[1];
export const DEMO_STUDENT_PRIYA = ALL_DEMO_STUDENT_PROFILES[2];
export const DEMO_WARDEN_NEHA = DEMO_FACULTY_NEHA;
export const DEMO_WARDEN_POOJA = DEMO_FACULTY_POOJA;

export {
  DEMO_FACULTY_ANUJ,
  DEMO_FACULTY_KAVITA,
  DEMO_FACULTY_ROHIT,
  DEMO_FACULTY_NEHA,
  DEMO_FACULTY_POOJA,
  DEMO_PRINCIPAL_RAJESH,
  DEMO_MD_SHARMA,
  DEMO_SECURITY_RAMESH,
  DEMO_LIBRARY_SUNITA,
  DEMO_LAB_MOHIT,
  DEMO_IT_VIKRAM,
  ALL_DEMO_FACULTY_PROFILES,
  ALL_DEMO_STUDENT_PROFILES,
  ALL_DEMO_STAFF_PROFILES,
  ALL_DEMO_PROFILES
};

export const MASTER_DEMO_ACCOUNTS = ALL_DEMO_PROFILES;


// Fictional Demo Profiles as explicitly requested in Section 9
export const DEMO_STUDENT_CSE: Profile = {
  id: 'prof-std-cse-001',
  auth_user_id: 'auth-std-cse-001',
  role: 'student',
  student_id: 'std-cse-001',
  name: 'Aarav Sharma',
  email: 'aarav.cse001@hiet.ac.in',
  must_change_password: false,
  studentMaster: {
    id: 'std-cse-001',
    roll_no: 'CSE001',
    name: 'Aarav Sharma',
    father_name: 'Sh. Rajesh Sharma',
    mother_name: 'Smt. Sunita Sharma',
    dob: '2003-08-15',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    section: 'A',
    college_email: 'aarav.cse001@hiet.ac.in',
    phone: '+91 94180 11001',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  }
};

export const DEMO_STUDENT_AIML: Profile = {
  id: 'prof-std-aiml-001',
  auth_user_id: 'auth-std-aiml-001',
  role: 'student',
  student_id: 'std-aiml-001',
  name: 'Ansh Gupta',
  email: 'ansh.aiml001@hiet.ac.in',
  must_change_password: false,
  studentMaster: {
    id: 'std-aiml-001',
    roll_no: 'AIML001',
    name: 'Ansh Gupta',
    father_name: 'Sh. Sanjay Gupta',
    mother_name: 'Smt. Ritu Gupta',
    dob: '2004-02-18',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE AI & ML',
    semester: 4,
    section: 'A',
    college_email: 'ansh.aiml001@hiet.ac.in',
    phone: '+91 94180 22001',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  }
};

export const DEMO_TEACHER: Profile = {
  id: 'prof-tch-01',
  auth_user_id: 'auth-tch-01',
  role: 'teacher',
  teacher_id: 'tch-01',
  name: 'Dr. Rajesh Kumar',
  email: 'rajesh.kumar@hiet.ac.in',
  must_change_password: false,
  teacherMaster: {
    id: 'tch-01',
    faculty_id: 'FAC001',
    full_name: 'Dr. Rajesh Kumar',
    name: 'Dr. Rajesh Kumar',
    department: 'CSE',
    designation: 'Professor',
    college_email: 'rajesh.kumar@hiet.ac.in',
    phone: '+91 98160 11001',
    role: 'teacher',
    is_hod: false,
    is_class_incharge: true,
    class_incharge_details: {
      branch: 'CSE',
      semester: 6,
      section: 'A'
    },
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  }
};

export const DEMO_HOD: Profile = {
  id: 'prof-tch-03',
  auth_user_id: 'auth-tch-03',
  role: 'hod',
  teacher_id: 'tch-03',
  name: 'Dr. Amit Thakur',
  email: 'amit.thakur@hiet.ac.in',
  must_change_password: false,
  teacherMaster: {
    id: 'tch-03',
    faculty_id: 'FAC003',
    full_name: 'Dr. Amit Thakur',
    name: 'Dr. Amit Thakur',
    department: 'CSE',
    designation: 'HOD',
    college_email: 'amit.thakur@hiet.ac.in',
    phone: '+91 98160 11003',
    role: 'hod',
    is_hod: true,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  }
};

export const DEMO_MD: Profile = {
  id: 'prof-md-01',
  auth_user_id: 'auth-md-01',
  role: 'managing_director',
  name: 'Er. D. S. Pathania (Managing Director)',
  email: 'md@hiet.ac.in',
  must_change_password: false
};

export const DEMO_ADMIN: Profile = {
  id: 'prof-admin-01',
  auth_user_id: 'auth-admin-01',
  role: 'admin',
  name: 'HIET Central Administration',
  email: 'admin@hiet.ac.in',
  must_change_password: false
};

export const DEMO_PRINCIPAL: Profile = {
  id: 'prof-principal-01',
  auth_user_id: 'auth-principal-01',
  role: 'principal',
  name: 'Dr. Vinod Kumar (Principal / Director)',
  email: 'principal@hiet.ac.in',
  must_change_password: false
};

export const DEMO_SECURITY: Profile = {
  id: 'prof-security-01',
  auth_user_id: 'auth-security-01',
  role: 'security_guard',
  name: 'Hav. R. S. Katoch (Campus Security)',
  email: 'security@hiet.ac.in',
  must_change_password: false
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Development preview & authenticated session state initialization (Section 62 & Section 6)
  const [user, setUser] = useState<Profile | null>(() => {
    // 1. Development-only dashboard preview via ?previewRole=... (Section 62)
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const previewRole = params.get('previewRole');
        if (previewRole) {
          switch (previewRole.toLowerCase()) {
            case 'student': return DEMO_STUDENT_CSE;
            case 'faculty':
            case 'teacher': return DEMO_TEACHER;
            case 'hod': return DEMO_HOD;
            case 'principal':
            case 'admin': return DEMO_PRINCIPAL;
            case 'security':
            case 'security_guard': return DEMO_SECURITY;
            case 'md':
            case 'managing_director': return DEMO_MD;
          }
        }
      } catch (err) {
        console.warn('Dev preview query parse error:', err);
      }
    }

    // 2. Check persistent user session
    try {
      const saved = localStorage.getItem('hiet_current_user');
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        const savedWorkspace = localStorage.getItem('hiet_active_workspace_role');
        if (savedWorkspace && parsed.activeRoles && (parsed.activeRoles.includes(savedWorkspace) || (savedWorkspace === 'hod' && parsed.activeRoles.includes('hod')))) {
          parsed.role = savedWorkspace;
          parsed.activeWorkspaceRole = savedWorkspace;
        }
        return parsed;
      }
    } catch {
      // Fallback
    }

    // 3. Unauthenticated default: Public Login / Portal screen (Section 6)
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('hiet_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('hiet_current_user');
    }
  }, [user]);

  // Master Verification for Student by Roll Number (e.g. CSE001)
  const verifyStudentRollNo = async (rollNo: string) => {
    setIsLoading(true);
    try {
      const student = await apiService.verifyStudentRollNo(rollNo);
      if (!student) {
        return {
          success: false,
          error: 'Student record not found. Please contact college administration.'
        };
      }

      // Check if student has already registered
      const regCheck = await apiService.checkStudentAlreadyRegistered(rollNo, student.id);
      if (regCheck.registered) {
        return {
          success: false,
          error: 'This student record is already registered. Please login to your account.'
        };
      }

      return { success: true, data: student };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error verifying roll number' };
    } finally {
      setIsLoading(false);
    }
  };

  // Master Verification for Teacher by Faculty ID (e.g. FAC001)
  const verifyTeacherFacultyId = async (facultyId: string) => {
    setIsLoading(true);
    try {
      const teacher = await apiService.verifyTeacherFacultyId(facultyId);
      if (!teacher) {
        return {
          success: false,
          error: 'Faculty record not found. Please contact college administration.'
        };
      }
      return { success: true, data: teacher };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error verifying faculty ID' };
    } finally {
      setIsLoading(false);
    }
  };

  // Strict Verification for Faculty by BOTH Faculty ID and Full Name
  const verifyFaculty = async (facultyId: string, fullName: string) => {
    setIsLoading(true);
    try {
      const res = await apiService.verifyFacultyRecord(facultyId, fullName);
      if (res.success && res.data) {
        // Check if faculty has already registered
        const regCheck = await apiService.checkFacultyAlreadyRegistered(facultyId, res.data.id);
        if (regCheck.registered) {
          return {
            success: false,
            error: 'This faculty record is already registered. Please login to your account.'
          };
        }
      }
      return res;
    } catch (e: any) {
      return { success: false, error: e.message || 'Error verifying faculty credentials' };
    } finally {
      setIsLoading(false);
    }
  };

  // Register Student after verification against college master database
  const registerStudent = async (student: StudentMaster, tempPassword?: string, customEmail?: string) => {
    setIsLoading(true);
    try {
      const emailToUse = normalizeAuthEmail(customEmail || student.college_email);

      if (import.meta.env.DEV) {
        console.log('[AuthContext registerStudent] Normalized email before signUp:', {
          emailToUse,
          length: emailToUse.length,
          charCodes: [...emailToUse].map(c => c.charCodeAt(0)),
          rawCustomEmail: customEmail,
          rawStudentEmail: student.college_email
        });
      }

      // Duplicate registration prevention
      const regCheck = await apiService.checkStudentAlreadyRegistered(student.roll_no, student.id);
      if (regCheck.registered) {
        return {
          success: false,
          error: 'This student record is already registered. Please login to your account.'
        };
      }

      let authUserId = `auth-${student.id}`;
      let emailVerificationRequired = false;
      if (isSupabaseConfigured && supabase) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailToUse,
          password: tempPassword || 'Hiet@12345'
        });
        if (authError) throw authError;

        if (authData.user) {
          authUserId = authData.user.id;
          emailVerificationRequired = !authData.session;
          await supabase.from('profiles').insert([{
            auth_user_id: authData.user.id,
            role: 'student',
            student_id: student.id,
            name: student.name,
            email: emailToUse,
            must_change_password: false
          }]);
        }
      }

      const newProfile: Profile = {
        id: `prof-${student.id}`,
        auth_user_id: authUserId,
        role: 'student',
        student_id: student.id,
        name: student.name,
        email: emailToUse,
        must_change_password: false,
        studentMaster: {
          ...student,
          college_email: emailToUse
        }
      };

      // Store in local dataStore profiles
      const allProfiles = dataStore.getProfiles();
      dataStore.setProfiles([...allProfiles.filter(p => p.student_id !== student.id), newProfile]);

      if (!emailVerificationRequired) {
        setUser(newProfile);
      }
      return { success: true, emailVerificationRequired };
    } catch (e: any) {
      return { success: false, error: formatAuthError(e) };
    } finally {
      setIsLoading(false);
    }
  };

  // Register Teacher after verification (Role assigned ONLY via verified database record)
  const registerTeacher = async (teacher: TeacherMaster, tempPassword?: string, customEmail?: string) => {
    setIsLoading(true);
    try {
      const emailToUse = normalizeAuthEmail(customEmail || teacher.college_email);

      if (import.meta.env.DEV) {
        console.log('[AuthContext registerTeacher] Normalized email before signUp:', {
          emailToUse,
          length: emailToUse.length,
          charCodes: [...emailToUse].map(c => c.charCodeAt(0)),
          rawCustomEmail: customEmail,
          rawTeacherEmail: teacher.college_email
        });
      }

      // Duplicate registration prevention
      const regCheck = await apiService.checkFacultyAlreadyRegistered(teacher.faculty_id, teacher.id);
      if (regCheck.registered) {
        return {
          success: false,
          error: 'This faculty record is already registered. Please login to your account.'
        };
      }

      // Role is determined strictly and ONLY from verified database record
      const determinedRole: UserRole = (teacher.role === 'hod' || teacher.is_hod) 
        ? 'hod' 
        : 'teacher';

      let authUserId = `auth-${teacher.id}`;
      let emailVerificationRequired = false;
      if (isSupabaseConfigured && supabase) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailToUse,
          password: tempPassword || 'Hiet@12345'
        });
        if (authError) throw authError;

        if (authData.user) {
          authUserId = authData.user.id;
          emailVerificationRequired = !authData.session;
          await supabase.from('profiles').insert([{
            auth_user_id: authData.user.id,
            role: determinedRole,
            teacher_id: teacher.id,
            faculty_id: teacher.id,
            name: teacher.full_name || teacher.name,
            email: emailToUse,
            must_change_password: false
          }]);
        }
      }

      // Update dataStore with newly registered credentials if needed
      const allTeachers = dataStore.getTeachersMaster();
      const idx = allTeachers.findIndex(t => t.faculty_id.toUpperCase() === teacher.faculty_id.toUpperCase());
      if (idx >= 0) {
        allTeachers[idx] = {
          ...allTeachers[idx],
          ...teacher,
          college_email: emailToUse,
          role: determinedRole
        };
        dataStore.setTeachersMaster(allTeachers);
      }

      const newProfile: Profile = {
        id: `prof-${teacher.id}`,
        auth_user_id: authUserId,
        role: determinedRole,
        teacher_id: teacher.id,
        faculty_id: teacher.id,
        name: teacher.full_name || teacher.name,
        email: emailToUse,
        must_change_password: false,
        teacherMaster: {
          ...teacher,
          full_name: teacher.full_name || teacher.name,
          name: teacher.name || teacher.full_name || '',
          role: determinedRole,
          college_email: emailToUse
        }
      };

      const allProfiles = dataStore.getProfiles();
      dataStore.setProfiles([...allProfiles.filter(p => p.teacher_id !== teacher.id), newProfile]);

      if (!emailVerificationRequired) {
        setUser(newProfile);
      }
      return { success: true, emailVerificationRequired };
    } catch (e: any) {
      return { success: false, error: formatAuthError(e) };
    } finally {
      setIsLoading(false);
    }
  };

  // Safe Resend Verification Email with Rate-Limit Handling
  const resendVerificationEmail = async (emailOrId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      let emailToUse = normalizeAuthEmail(emailOrId);
      if (!emailToUse) {
        return { success: false, error: 'Please enter a valid email address or roll number.' };
      }

      if (!emailToUse.includes('@')) {
        const student = await apiService.verifyStudentRollNo(emailToUse);
        if (student?.college_email) {
          emailToUse = normalizeAuthEmail(student.college_email);
        } else {
          const teacher = await apiService.verifyTeacherFacultyId(emailToUse);
          if (teacher?.college_email) {
            emailToUse = normalizeAuthEmail(teacher.college_email);
          }
        }
      }

      if (!emailToUse.includes('@')) {
        return { success: false, error: 'Valid registered email not found. Please enter your email address directly.' };
      }

      if (import.meta.env.DEV) {
        console.log('[AuthContext resendVerificationEmail] Resending to normalized email:', {
          emailToUse,
          length: emailToUse.length,
          charCodes: [...emailToUse].map(c => c.charCodeAt(0))
        });
      }

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: emailToUse
        });
        if (error) {
          return { success: false, error: formatAuthError(error) };
        }
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: formatAuthError(e) };
    } finally {
      setIsLoading(false);
    }
  };

  // Secure Login Handler (Supports Roll Number, Faculty ID, or Email)
  const login = async (emailOrId: string, password?: string) => {
    setIsLoading(true);
    try {
      const input = emailOrId.trim();
      const isDemoAllowed = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' || import.meta.env.DEV || !isSupabaseConfigured;

      // Check Master Demo Accounts (Development & Evaluation)
      if (isDemoAllowed) {
        const matchedDemo = MASTER_DEMO_ACCOUNTS.find(
          acc => acc.email.toLowerCase() === input.toLowerCase() ||
                 acc.identifier.toUpperCase() === input.toUpperCase() ||
                 (acc.email === 'anuj.sharma@hiet.demo' && (input.toLowerCase() === 'faculty.cse01@hiet.demo' || input.toLowerCase() === 'hod.cse@hiet.demo'))
        );
        if (matchedDemo) {
          if (password && password !== 'Hiet@12345') {
            return {
              success: false,
              error: 'Invalid password. Please check your credentials and try again.'
            };
          }
          let finalProfile = { ...matchedDemo };
          if (matchedDemo.activeRoles && matchedDemo.activeRoles.includes('hod')) {
            const savedWorkspace = localStorage.getItem('hiet_active_workspace_role') || 'faculty';
            finalProfile.role = savedWorkspace as UserRole;
            finalProfile.activeWorkspaceRole = savedWorkspace;
          }
          setUser(finalProfile);
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', getRoleRedirect(finalProfile.role));
          }
          return { success: true };
        }

        const inputLower = input.toLowerCase();
        if (inputLower === 'admin@hiet.ac.in' || inputLower === 'admin') {
          setUser(DEMO_ADMIN);
          if (typeof window !== 'undefined') window.history.replaceState(null, '', '/app/admin');
          return { success: true };
        }
        if (inputLower === 'principal@hiet.ac.in' || inputLower === 'principal') {
          setUser(DEMO_PRINCIPAL);
          if (typeof window !== 'undefined') window.history.replaceState(null, '', '/app/admin');
          return { success: true };
        }
        if (inputLower === 'md@hiet.ac.in' || inputLower === 'md' || inputLower === 'managing_director') {
          setUser(DEMO_MD);
          if (typeof window !== 'undefined') window.history.replaceState(null, '', '/app/md');
          return { success: true };
        }
        if (inputLower === 'security@hiet.ac.in' || inputLower === 'security' || inputLower === 'guard') {
          setUser(DEMO_SECURITY);
          if (typeof window !== 'undefined') window.history.replaceState(null, '', '/app/security');
          return { success: true };
        }
      }

      // 1. LIVE SUPABASE AUTHENTICATION
      if (isSupabaseConfigured && supabase) {
        if (!password && !isDemoAllowed) {
          return {
            success: false,
            error: 'Password is required for secure authentication.'
          };
        }

        let authEmail = input;
        let studentRec: StudentMaster | null = null;
        let teacherRec: TeacherMaster | null = null;

        // If not an email, lookup via secure RPC resolve_login_identifier or master tables
        if (!input.includes('@')) {
          try {
            const { data: resolved, error: rpcErr } = await supabase.rpc('resolve_login_identifier', { p_identifier: input });
            if (!rpcErr && resolved && resolved.length > 0 && resolved[0].resolved_email) {
              if (resolved[0].is_active === false) {
                return { success: false, error: 'Your account is inactive. Please contact the college administration.' };
              }
              authEmail = normalizeAuthEmail(resolved[0].resolved_email);
            }
          } catch (rpcErr) {
            console.warn('RPC resolve_login_identifier fallback:', rpcErr);
          }

          if (!authEmail.includes('@')) {
            studentRec = await apiService.verifyStudentRollNo(input);
            if (studentRec?.college_email) {
              authEmail = normalizeAuthEmail(studentRec.college_email);
            } else {
              teacherRec = await apiService.verifyTeacherFacultyId(input);
              if (teacherRec?.college_email) {
                authEmail = normalizeAuthEmail(teacherRec.college_email);
              } else {
                if (isDemoAllowed) {
                  const s = dataStore.getStudentsMaster().find(std => std.roll_no.toUpperCase() === input.toUpperCase());
                  if (s) {
                    const prof: Profile = {
                      id: `prof-${s.id}`,
                      auth_user_id: `auth-${s.id}`,
                      role: 'student',
                      student_id: s.id,
                      name: s.name,
                      email: s.college_email,
                      must_change_password: false,
                      studentMaster: s
                    };
                    setUser(prof);
                    if (typeof window !== 'undefined') window.history.replaceState(null, '', '/app/student');
                    return { success: true };
                  }
                  const t = dataStore.getTeachersMaster().find(tch => tch.faculty_id.toUpperCase() === input.toUpperCase());
                  if (t) {
                    const determinedRole: UserRole = (t.role === 'hod' || t.is_hod || t.faculty_id === 'FAC003') ? 'hod' : 'teacher';
                    const prof: Profile = {
                      id: `prof-${t.id}`,
                      auth_user_id: `auth-${t.id}`,
                      role: determinedRole,
                      teacher_id: t.id,
                      faculty_id: t.faculty_id,
                      name: t.name,
                      email: t.college_email,
                      must_change_password: false,
                      teacherMaster: t
                    };
                    setUser(prof);
                    if (typeof window !== 'undefined') window.history.replaceState(null, '', getRoleRedirect(determinedRole));
                    return { success: true };
                  }
                }
                return {
                  success: false,
                  error: 'Identifier not found in college master database records.'
                };
              }
            }
          }
        } else {
          authEmail = normalizeAuthEmail(authEmail);
        }

        let authError: any = null;
        if (password) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password
          });

          if (!error && data.user) {
            // Check public.users for status and authoritative role
            const { data: dbUser } = await supabase
              .from('users')
              .select('*')
              .eq('supabase_auth_id', data.user.id)
              .maybeSingle();

            if (dbUser && dbUser.is_active === false) {
              await supabase.auth.signOut();
              return { success: false, error: 'Your account is inactive. Please contact the college administration.' };
            }

            const { data: profileData, error: profileErr } = await supabase
              .from('profiles')
              .select('*, student_master:student_id(*), teacher_master:teacher_id(*)')
              .eq('auth_user_id', data.user.id)
              .maybeSingle();

            if (profileData && !profileErr) {
              const activeProfile: Profile = {
                ...profileData,
                role: dbUser?.role || profileData.role,
                studentMaster: profileData.student_master,
                teacherMaster: profileData.teacher_master
              };
              setUser(activeProfile);
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', getRoleRedirect(activeProfile.role));
              }
              return { success: true };
            }
          }
          authError = error;
        }

        // If Supabase Auth failed (e.g. unprovisioned dummy account in demo/dev mode):
        if (isDemoAllowed) {
          if (!studentRec && !teacherRec) {
            studentRec = await apiService.verifyStudentRollNo(input) ||
              dataStore.getStudentsMaster().find(s => s.college_email.toLowerCase() === authEmail.toLowerCase() || s.roll_no.toUpperCase() === input.toUpperCase()) || null;
            if (!studentRec) {
              teacherRec = await apiService.verifyTeacherFacultyId(input) ||
                dataStore.getTeachersMaster().find(t => t.college_email.toLowerCase() === authEmail.toLowerCase() || t.faculty_id.toUpperCase() === input.toUpperCase()) || null;
            }
          }

          if (studentRec) {
            if (password && password !== 'Hiet@12345') {
              return { success: false, error: 'Invalid password. Please check your credentials and try again.' };
            }
            const prof: Profile = {
              id: `prof-${studentRec.id}`,
              auth_user_id: `auth-${studentRec.id}`,
              role: 'student',
              student_id: studentRec.id,
              name: studentRec.name,
              email: studentRec.college_email,
              must_change_password: false,
              studentMaster: studentRec
            };
            setUser(prof);
            if (typeof window !== 'undefined') window.history.replaceState(null, '', '/app/student');
            return { success: true };
          }

          if (teacherRec) {
            if (password && password !== 'Hiet@12345') {
              return { success: false, error: 'Invalid password. Please check your credentials and try again.' };
            }
            const determinedRole: UserRole = (teacherRec.role === 'hod' || teacherRec.is_hod || teacherRec.faculty_id === 'FAC003')
              ? 'hod'
              : 'teacher';
            const prof: Profile = {
              id: `prof-${teacherRec.id}`,
              auth_user_id: `auth-${teacherRec.id}`,
              role: determinedRole,
              teacher_id: teacherRec.id,
              faculty_id: teacherRec.faculty_id,
              name: teacherRec.full_name || teacherRec.name,
              email: teacherRec.college_email,
              must_change_password: false,
              teacherMaster: teacherRec
            };
            setUser(prof);
            if (typeof window !== 'undefined') window.history.replaceState(null, '', getRoleRedirect(determinedRole));
            return { success: true };
          }
        }

        if (authError) {
          return { success: false, error: formatAuthError(authError) };
        }

        return {
          success: false,
          error: 'Authentication failed. Please verify your credentials.'
        };
      }

      // 2. OFFLINE / DEVELOPMENT DEMO FALLBACK
      const studentMatch = dataStore.getStudentsMaster().find(
        s => s.roll_no.toUpperCase() === input.toUpperCase() || s.college_email.toLowerCase() === input.toLowerCase()
      );
      if (studentMatch) {
        if (password && password !== 'Hiet@12345') {
          return { success: false, error: 'Invalid password. Please check your credentials and try again.' };
        }
        const prof: Profile = {
          id: `prof-${studentMatch.id}`,
          auth_user_id: `auth-${studentMatch.id}`,
          role: 'student',
          student_id: studentMatch.id,
          name: studentMatch.name,
          email: studentMatch.college_email,
          must_change_password: false,
          studentMaster: studentMatch
        };
        setUser(prof);
        if (typeof window !== 'undefined') window.history.replaceState(null, '', '/app/student');
        return { success: true };
      }

      const teacherMatch = dataStore.getTeachersMaster().find(
        t => t.faculty_id.toUpperCase() === input.toUpperCase() || t.college_email.toLowerCase() === input.toLowerCase()
      );
      if (teacherMatch) {
        if (password && password !== 'Hiet@12345') {
          return { success: false, error: 'Invalid password. Please check your credentials and try again.' };
        }
        const determinedRole: UserRole = (teacherMatch.is_hod || teacherMatch.role === 'hod' || teacherMatch.faculty_id === 'FAC003')
          ? 'hod'
          : 'teacher';

        const prof: Profile = {
          id: `prof-${teacherMatch.id}`,
          auth_user_id: `auth-${teacherMatch.id}`,
          role: determinedRole,
          teacher_id: teacherMatch.id,
          name: teacherMatch.name,
          email: teacherMatch.college_email,
          must_change_password: false,
          teacherMaster: teacherMatch
        };
        setUser(prof);
        if (typeof window !== 'undefined') window.history.replaceState(null, '', getRoleRedirect(determinedRole));
        return { success: true };
      }

      return {
        success: false,
        error: 'Invalid credentials. Please enter a valid University Roll Number, Faculty ID, or Email.'
      };
    } catch (e: any) {
      return { success: false, error: formatAuthError(e) };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
        supabase.removeAllChannels();
      }
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setUser(null);
    localStorage.removeItem('hiet_current_user');
    localStorage.removeItem('hiet_active_workspace_role');
    sessionStorage.clear();
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/login');
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      if (user) {
        await supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id);
      }
    }

    if (user) {
      setUser({ ...user, must_change_password: false });
    }
    return { success: true };
  };

  // Fast switch for Demo Testing (Active in demo/dev mode)
  const switchDemoRole = (role: UserRole) => {
    const isDemoAllowed = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' || import.meta.env.DEV || !isSupabaseConfigured;
    if (!isDemoAllowed) {
      console.warn('Unauthorized: Demo role switching is strictly disabled in production.');
      return;
    }
    switch (role) {
      case 'student':
        setUser(DEMO_STUDENT_CSE);
        break;
      case 'teacher':
        setUser(DEMO_TEACHER);
        break;
      case 'hod':
        setUser(DEMO_HOD);
        break;
      case 'admin':
        setUser(DEMO_ADMIN);
        break;
      case 'principal':
        setUser(DEMO_PRINCIPAL);
        break;
      case 'security_guard':
        setUser(DEMO_SECURITY);
        break;
    }
  };

  const switchDemoUser = (identifier: string) => {
    const isDemoAllowed = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' || import.meta.env.DEV || !isSupabaseConfigured;
    if (!isDemoAllowed) {
      console.warn('Unauthorized: Demo user switching is strictly disabled in production.');
      return;
    }
    const clean = identifier.trim();
    const cleanUpper = clean.toUpperCase();

    const matchedMaster = MASTER_DEMO_ACCOUNTS.find(
      acc => acc.identifier.toUpperCase() === cleanUpper || acc.email.toLowerCase() === clean.toLowerCase()
    );
    if (matchedMaster) {
      setUser(matchedMaster);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', getRoleRedirect(matchedMaster.role));
      }
      return;
    }

    if (cleanUpper === 'ADMIN') {
      setUser(DEMO_ADMIN);
      return;
    }
    if (cleanUpper === 'PRINCIPAL') {
      setUser(DEMO_PRINCIPAL);
      return;
    }
    if (cleanUpper === 'SECURITY' || cleanUpper === 'GUARD') {
      setUser(DEMO_SECURITY);
      return;
    }
    const student = dataStore.getStudentsMaster().find(s => s.roll_no.toUpperCase() === clean);
    if (student) {
      setUser({
        id: `prof-${student.id}`,
        auth_user_id: `auth-${student.id}`,
        role: 'student',
        student_id: student.id,
        name: student.name,
        email: student.college_email,
        must_change_password: false,
        studentMaster: student
      });
      return;
    }
    const teacher = dataStore.getTeachersMaster().find(t => t.faculty_id.toUpperCase() === clean);
    if (teacher) {
      const determinedRole: UserRole = (teacher.is_hod || teacher.role === 'hod' || teacher.faculty_id === 'FAC003') ? 'hod' : 'teacher';
      setUser({
        id: `prof-${teacher.id}`,
        auth_user_id: `auth-${teacher.id}`,
        role: determinedRole,
        teacher_id: teacher.id,
        name: teacher.name,
        email: teacher.college_email,
        must_change_password: false,
        teacherMaster: teacher
      });
    }
  };

  const activeRoles: string[] = user?.activeRoles || (user?.role ? [user.role] : []);
  const activeWorkspaceRole: string | null = user?.activeWorkspaceRole || user?.role || null;
  const workspaceRoles: WorkspaceOption[] = user?.workspaceRoles || (
    activeRoles.includes('hod') && (activeRoles.includes('faculty') || activeRoles.includes('teacher'))
      ? [
          { roleKey: 'faculty', label: 'Faculty Workspace', departmentName: user?.department || 'CSE' },
          { roleKey: 'hod', label: `HOD — ${user?.department || 'Computer Science & Engineering'}`, departmentName: user?.department || 'Computer Science & Engineering' }
        ]
      : []
  );

  const switchWorkspace = async (workspaceRole: string) => {
    if (!user) return;
    const cleanRole = workspaceRole.toLowerCase() as UserRole;
    const updatedUser: Profile = {
      ...user,
      role: cleanRole,
      activeWorkspaceRole: cleanRole
    };
    setUser(updatedUser);
    localStorage.setItem('hiet_current_user', JSON.stringify(updatedUser));
    localStorage.setItem('hiet_active_workspace_role', cleanRole);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('user_workspace_preferences').upsert({
          user_id: user.id,
          active_workspace_role_key: cleanRole,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Could not save workspace preference to Supabase:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', getRoleRedirect(cleanRole));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        activeRoles,
        activeWorkspaceRole,
        workspaceRoles,
        isLoading,
        mustChangePassword: Boolean(user?.must_change_password),
        login,
        logout,
        switchWorkspace,
        verifyStudentRollNo,
        verifyTeacherFacultyId,
        verifyFaculty,
        registerStudent,
        registerTeacher,
        resendVerificationEmail,
        changePassword,
        switchDemoRole,
        switchDemoUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
