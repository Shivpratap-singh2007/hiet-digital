// HIET Digital Help Desk - Supabase Client & Data Gateway
// Bridges Supabase PostgreSQL and persistent local data storage

import { createClient } from '@supabase/supabase-js';
import { dataStore } from './mockData';
import { 
  StudentMaster, 
  TeacherMaster, 
  Profile, 
  AttendanceRecord, 
  LeaveRequest, 
  LeaveStatus,
  LeaveStage,
  LeaveRequestHistory,
  LeaveWorkflowConfig,
  Complaint, 
  Doubt, 
  DoubtMessage, 
  Achievement, 
  Notice, 
  CalendarEvent,
  Subject,
  SessionalResult,
  GatePass,
  GateEntry,
  NotificationItem,
  GatePassRequest,
  GateScanLog,
  StudentFine,
  FineAppeal,
  Grade,
  TimetableSlot,
  GalleryItem,
  Assignment,
  AssignmentSubmission,
  SyllabusItem,
  PYQItem,
  ImportJob,
  ImportError,
  ImportEntityType,
  SmartBoardLesson,
  CampusZone,
  CampusPresenceRecord
} from '../types';
import { ValidationMasterContext, ValidatedRow, parseTimeToMinutes } from './importValidation';
import { normalizeFacultyId, normalizeName } from './utils';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_URL : undefined;
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper: Calculate inclusive leave days (to_date - from_date + 1)
export function calculateLeaveDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
  return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
}

// Helper: Resolve approver for student section & department
export function resolveLeaveApprover(studentBranch?: string, studentSemester?: number, studentSection?: string) {
  const teachers = dataStore.getTeachersMaster();
  // 1. Look for Class In-Charge matching section
  const incharge = teachers.find(t => 
    t.is_class_incharge && 
    t.class_incharge_details?.branch === (studentBranch || 'CSE') &&
    (!studentSemester || t.class_incharge_details?.semester === studentSemester) &&
    (!studentSection || t.class_incharge_details?.section === studentSection)
  ) || teachers.find(t => t.is_class_incharge && t.class_incharge_details?.branch === (studentBranch || 'CSE'));

  if (incharge) {
    return {
      userId: incharge.faculty_id === 'HIET-FAC-CSE-003' ? 'prof-tch-fac-cse-003' : (incharge.id || 'prof-tch-fac-cse-003'),
      roleKey: 'class_incharge',
      name: `${incharge.full_name || incharge.name} (Class In-Charge)`
    };
  }

  // 2. Fallback to active HOD for student department
  const hod = teachers.find(t => 
    (t.is_hod || t.role === 'hod' || t.designation?.toLowerCase().includes('head') || t.designation?.toLowerCase().includes('hod')) &&
    (t.department === (studentBranch || 'CSE') || studentBranch === 'CSE')
  );

  if (hod) {
    return {
      userId: hod.faculty_id === 'HIET-FAC-CSE-001' ? 'prof-tch-fac-cse-001' : (hod.id || 'prof-tch-fac-cse-001'),
      roleKey: 'hod',
      name: `${hod.full_name || hod.name} (HOD CSE)`
    };
  }

  return {
    userId: 'prof-tch-fac-cse-003',
    roleKey: 'class_incharge',
    name: 'Mr. Rohit Mehta (Class In-Charge)'
  };
}

// =============================================================================
// UNIFIED DATA SERVICE (Supabase + Smart Fallback Layer)
// =============================================================================

export const apiService = {
  // 1. Verify Student Master by Roll Number
  async verifyStudentRollNo(rollNo: string): Promise<StudentMaster | null> {
    const cleanRoll = rollNo.trim().toUpperCase();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('students_master')
        .select('*')
        .ilike('roll_no', cleanRoll)
        .eq('status', 'active')
        .maybeSingle();
      if (error) {
        console.warn('Supabase student lookup error, falling back:', error.message);
      } else if (data) {
        return data as StudentMaster;
      }
    }
    // Local dataStore verification
    const match = dataStore.getStudentsMaster().find(
      s => s.roll_no.toUpperCase() === cleanRoll && s.status === 'active'
    );
    return match || null;
  },

  // 1b. Paged & Filtered Student Master Query (Supports 5,000+ Students with Server-side Pagination)
  async getStudentsPaged(params: {
    search?: string;
    branch?: string;
    department?: string;
    semester?: number;
    section?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    data: StudentMaster[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(10, params.pageSize || 25));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('students_master')
          .select('*', { count: 'exact' });

        if (params.search) {
          const s = params.search.trim();
          query = query.or(`name.ilike.%${s}%,roll_no.ilike.%${s}%,college_email.ilike.%${s}%`);
        }
        if (params.branch && params.branch !== 'All') {
          query = query.eq('branch', params.branch);
        }
        if (params.department && params.department !== 'All') {
          query = query.eq('department', params.department);
        }
        if (params.semester && params.semester > 0) {
          query = query.eq('semester', params.semester);
        }
        if (params.section && params.section !== 'All') {
          query = query.eq('section', params.section);
        }

        const { data, count, error } = await query
          .order('roll_no', { ascending: true })
          .range(from, to);

        if (!error && data) {
          const totalCount = count ?? data.length;
          return {
            data: data as StudentMaster[],
            totalCount,
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize) || 1
          };
        }
      } catch (err) {
        console.warn('Supabase getStudentsPaged error, falling back to local master store:', err);
      }
    }

    // Local dataStore fallback with paged slicing
    const all = dataStore.getStudentsMaster();
    const searchLower = (params.search || '').trim().toLowerCase();

    const filtered = all.filter(s => {
      const matchSearch = !searchLower ||
        s.name.toLowerCase().includes(searchLower) ||
        s.roll_no.toLowerCase().includes(searchLower) ||
        (s.college_email && s.college_email.toLowerCase().includes(searchLower));
      const matchBranch = !params.branch || params.branch === 'All' || s.branch === params.branch;
      const matchDept = !params.department || params.department === 'All' || s.department === params.department;
      const matchSem = !params.semester || params.semester === 0 || s.semester === params.semester;
      const matchSec = !params.section || params.section === 'All' || s.section === params.section;
      return matchSearch && matchBranch && matchDept && matchSem && matchSec;
    });

    const totalCount = filtered.length;
    const pagedData = filtered.slice(from, from + pageSize);

    return {
      data: pagedData,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize) || 1
    };
  },

  // 2. Verify Teacher Master by Faculty ID
  async verifyTeacherFacultyId(facultyId: string): Promise<TeacherMaster | null> {
    const cleanId = normalizeFacultyId(facultyId);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('teachers_master')
        .select('*')
        .ilike('faculty_id', cleanId)
        .eq('status', 'active')
        .maybeSingle();
      if (error) {
        console.warn('Supabase teacher lookup error, falling back:', error.message);
      } else if (data) {
        return {
          ...data,
          full_name: data.full_name || data.name,
          name: data.name || data.full_name || '',
          role: data.role || (data.is_hod ? 'hod' : 'teacher')
        } as TeacherMaster;
      }
    }
    // Local dataStore verification
    const match = dataStore.getTeachersMaster().find(
      t => normalizeFacultyId(t.faculty_id) === cleanId && t.status === 'active'
    );
    return match || null;
  },

  // 2b. Strict Verification of Faculty by BOTH Faculty ID and Full Name
  async verifyFacultyRecord(facultyId: string, fullName: string): Promise<{
    success: boolean;
    data?: TeacherMaster;
    error?: string;
  }> {
    const cleanId = normalizeFacultyId(facultyId);
    const cleanName = normalizeName(fullName);

    if (!cleanId || !cleanName) {
      return {
        success: false,
        error: 'Please enter both your Full Name and Faculty ID.'
      };
    }

    // Try live Supabase instance if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('teachers_master')
          .select('*')
          .ilike('faculty_id', cleanId)
          .maybeSingle();

        if (!error && data) {
          const dbNormalized = normalizeName(data.full_name || data.name || '');
          if (dbNormalized !== cleanName) {
            return {
              success: false,
              error: 'Faculty ID and name do not match our college records.'
            };
          }
          if (data.status === 'inactive') {
            return {
              success: false,
              error: 'Your faculty record is currently inactive. Please contact college administration.'
            };
          }
          if (data.status !== 'active') {
            return {
              success: false,
              error: 'Your faculty record is currently inactive. Please contact college administration.'
            };
          }
          return {
            success: true,
            data: {
              ...data,
              full_name: data.full_name || data.name,
              name: data.name || data.full_name || '',
              role: data.role || (data.is_hod ? 'hod' : 'teacher')
            } as TeacherMaster
          };
        } else if (!error && !data) {
          return {
            success: false,
            error: 'Faculty record not found. Please check your Faculty ID.'
          };
        }
      } catch (err) {
        console.warn('Supabase faculty query error, falling back to local master records:', err);
      }
    }

    // Local / Master Data Store Verification
    const masterList = dataStore.getTeachersMaster();
    const record = masterList.find(t => normalizeFacultyId(t.faculty_id) === cleanId);

    if (!record) {
      return {
        success: false,
        error: 'Faculty record not found. Please check your Faculty ID.'
      };
    }

    const dbNormalized = normalizeName(record.full_name || record.name);
    if (dbNormalized !== cleanName) {
      return {
        success: false,
        error: 'Faculty ID and name do not match our college records.'
      };
    }

    if (record.status === 'inactive') {
      return {
        success: false,
        error: 'Your faculty record is currently inactive. Please contact college administration.'
      };
    }

    if (record.status !== 'active') {
      return {
        success: false,
        error: 'Your faculty record is currently inactive. Please contact college administration.'
      };
    }

    return {
      success: true,
      data: {
        ...record,
        full_name: record.full_name || record.name,
        name: record.name || record.full_name || '',
        role: record.role || (record.is_hod ? 'hod' : 'teacher')
      }
    };
  },

  // Check if Student is already registered in profiles
  async checkStudentAlreadyRegistered(rollNo: string, studentId?: string): Promise<{ registered: boolean; email?: string }> {
    const cleanRoll = rollNo.trim().toUpperCase();
    if (isSupabaseConfigured && supabase) {
      try {
        let targetStudentId = studentId;
        if (!targetStudentId) {
          const rec = await this.verifyStudentRollNo(cleanRoll);
          if (rec?.id) targetStudentId = rec.id;
        }

        if (targetStudentId) {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, email, student_id')
            .eq('student_id', targetStudentId)
            .maybeSingle();
          if (!error && data) {
            return { registered: true, email: data.email };
          }
        }
      } catch (e) {
        console.warn('Supabase profile check error:', e);
      }
    }
    // Local dataStore check
    const profiles = dataStore.getProfiles();
    const existing = profiles.find(p => 
      (studentId && p.student_id === studentId) ||
      (p.studentMaster && p.studentMaster.roll_no.toUpperCase() === cleanRoll)
    );
    if (existing) {
      return { registered: true, email: existing.email };
    }
    return { registered: false };
  },

  // Check if Faculty is already registered in profiles
  async checkFacultyAlreadyRegistered(facultyId: string, teacherId?: string): Promise<{ registered: boolean; email?: string }> {
    const cleanId = normalizeFacultyId(facultyId);
    if (isSupabaseConfigured && supabase) {
      try {
        let targetTeacherId = teacherId;
        if (!targetTeacherId) {
          const rec = await this.verifyTeacherFacultyId(cleanId);
          if (rec?.id) targetTeacherId = rec.id;
        }

        if (targetTeacherId) {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, email, teacher_id, faculty_id')
            .or(`teacher_id.eq.${targetTeacherId},faculty_id.eq.${cleanId}`)
            .maybeSingle();
          if (!error && data) {
            return { registered: true, email: data.email };
          }
        }
      } catch (e) {
        console.warn('Supabase teacher profile check error:', e);
      }
    }
    // Local dataStore check
    const profiles = dataStore.getProfiles();
    const existing = profiles.find(p => 
      (teacherId && (p.teacher_id === teacherId || p.faculty_id === teacherId)) ||
      (p.teacherMaster && normalizeFacultyId(p.teacherMaster.faculty_id) === cleanId)
    );
    if (existing) {
      return { registered: true, email: existing.email };
    }
    return { registered: false };
  },

  // 3. Mark or Update Attendance
  async saveAttendance(records: Partial<AttendanceRecord>[]): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'student_id,subject_id,date' });
      if (!error) return true;
      console.warn('Supabase attendance save failed, falling back:', error.message);
    }
    const current = dataStore.getAttendance();
    const updated = [...current];
    for (const rec of records) {
      const idx = updated.findIndex(
        r => r.student_id === rec.student_id && r.subject_id === rec.subject_id && r.date === rec.date
      );
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], ...rec } as AttendanceRecord;
      } else {
        updated.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          student_id: rec.student_id!,
          subject_id: rec.subject_id!,
          date: rec.date!,
          status: rec.status || 'Present',
          marked_by: rec.marked_by
        });
      }
    }
    dataStore.setAttendance(updated);
    return true;
  },

  calculateLeaveDays,
  resolveLeaveApprover,

  // 4. Create Leave Request (Multi-Stage Workflow: Faculty -> HOD -> Principal)
  async submitLeaveRequest(req: {
    student_id: string;
    student_name?: string;
    student_roll?: string;
    student_branch?: string;
    student_semester?: number;
    student_section?: string;
    start_date: string;
    end_date: string;
    reason: string;
    document_url?: string;
    submitted_by_user_id?: string;
  }): Promise<LeaveRequest> {
    const totalDays = calculateLeaveDays(req.start_date, req.end_date);
    const approver = resolveLeaveApprover(req.student_branch, req.student_semester, req.student_section);
    const studentUserId = req.submitted_by_user_id || (req.student_id.startsWith('prof-') ? req.student_id : `prof-${req.student_id}`);
    const leaveId = `leave-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newLeave: LeaveRequest = {
      id: leaveId,
      leave_id: leaveId,
      student_id: req.student_id,
      department_id: req.student_branch || 'CSE',
      student_name: req.student_name,
      student_roll: req.student_roll,
      student_branch: req.student_branch,
      student_semester: req.student_semester,
      student_section: req.student_section || 'A',
      start_date: req.start_date,
      end_date: req.end_date,
      from_date: req.start_date,
      to_date: req.end_date,
      total_days: totalDays,
      reason: req.reason,
      document_url: req.document_url,
      document_path: req.document_url,
      status: 'pending_faculty',
      current_stage: 'faculty',
      current_assignee_user_id: approver.userId,
      current_assignee_role_key: approver.roleKey,
      current_assignee_name: approver.name,
      submitted_by_user_id: studentUserId,
      created_at: nowIso,
      updated_at: nowIso
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('leave_requests')
          .insert([newLeave])
          .select()
          .single();
        if (!error && data) {
          // Log initial history in Supabase
          await supabase.from('leave_request_history').insert([
            {
              leave_id: data.id,
              action_key: 'created',
              from_status: 'draft',
              to_status: 'pending_faculty',
              stage_role_key: 'student',
              performed_by_user_id: studentUserId,
              remarks: 'Leave request created by student'
            },
            {
              leave_id: data.id,
              action_key: 'submitted',
              from_status: 'draft',
              to_status: 'pending_faculty',
              stage_role_key: 'student',
              performed_by_user_id: studentUserId,
              remarks: 'Leave application submitted for review'
            },
            {
              leave_id: data.id,
              action_key: 'forwarded_to_faculty',
              from_status: 'draft',
              to_status: 'pending_faculty',
              stage_role_key: approver.roleKey,
              performed_by_user_id: approver.userId,
              remarks: `Routed to ${approver.name}`
            }
          ]);

          // Notify Assignee
          this.createNotification({
            recipient_user_id: approver.userId,
            title: 'New Student Leave Request',
            message: `${req.student_name || 'Student'} (${req.student_roll || ''}) submitted leave for ${totalDays} days (${req.start_date} to ${req.end_date}).`,
            type: 'leave',
            related_record_id: data.id,
            link_url: '/app/leave',
            is_read: false
          });

          // Confirm to Student
          this.createNotification({
            recipient_user_id: studentUserId,
            title: 'Leave Request Submitted',
            message: `Leave request submitted successfully. Your application is currently pending with ${approver.name}.`,
            type: 'leave',
            related_record_id: data.id,
            link_url: '/app/leave',
            is_read: false
          });

          return data as LeaveRequest;
        }
      } catch (e) {
        console.warn('Supabase submitLeaveRequest fallback:', e);
      }
    }

    // Local / in-memory store
    const current = dataStore.getLeaves();
    dataStore.setLeaves([newLeave, ...current]);

    // Add History Records
    dataStore.addLeaveHistory({
      history_id: `lvh-${Date.now()}-1`,
      leave_id: leaveId,
      action_key: 'created',
      from_status: 'draft',
      to_status: 'pending_faculty',
      stage_role_key: 'student',
      performed_by_user_id: studentUserId,
      performed_by_name: req.student_name || 'Student',
      remarks: 'Leave request created by student',
      created_at: nowIso
    });
    dataStore.addLeaveHistory({
      history_id: `lvh-${Date.now()}-2`,
      leave_id: leaveId,
      action_key: 'submitted',
      from_status: 'draft',
      to_status: 'pending_faculty',
      stage_role_key: 'student',
      performed_by_user_id: studentUserId,
      performed_by_name: req.student_name || 'Student',
      remarks: 'Leave application submitted for review',
      created_at: nowIso
    });
    dataStore.addLeaveHistory({
      history_id: `lvh-${Date.now()}-3`,
      leave_id: leaveId,
      action_key: 'forwarded_to_faculty',
      from_status: 'draft',
      to_status: 'pending_faculty',
      stage_role_key: approver.roleKey,
      performed_by_user_id: approver.userId,
      performed_by_name: approver.name,
      remarks: `Routed to ${approver.name}`,
      created_at: nowIso
    });

    // Notify Assignee
    this.createNotification({
      recipient_user_id: approver.userId,
      title: 'New Student Leave Request',
      message: `${req.student_name || 'Student'} (${req.student_roll || ''}) submitted leave for ${totalDays} days (${req.start_date} to ${req.end_date}).`,
      type: 'leave',
      related_record_id: leaveId,
      link_url: '/app/leave',
      is_read: false
    });

    // Confirm to Student
    this.createNotification({
      recipient_user_id: studentUserId,
      title: 'Leave Request Submitted',
      message: `Leave request submitted successfully. Your application is currently pending with ${approver.name}.`,
      type: 'leave',
      related_record_id: leaveId,
      link_url: '/app/leave',
      is_read: false
    });

    return newLeave;
  },

  // 5. Process Leave Action (Multi-Stage Approval: Faculty -> HOD -> Principal with Multi-Role Safeguard)
  async processLeaveAction(params: {
    leaveId: string;
    action: 'approve' | 'reject';
    reviewerId?: string;
    reviewerName: string;
    reviewerRole?: string;
    remarks?: string;
  }): Promise<{ success: boolean; status: LeaveStatus; stage: LeaveStage; message?: string }> {
    const { leaveId, action, reviewerId, reviewerName, reviewerRole, remarks } = params;
    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('process_leave_action_rpc', {
          p_leave_id: leaveId,
          p_action: action,
          p_remarks: remarks || null
        });
        if (!error && data) {
          return {
            success: true,
            status: data.status,
            stage: data.stage,
            message: `Leave request successfully ${action === 'approve' ? 'approved' : 'rejected'}.`
          };
        }
      } catch (e) {
        console.warn('Supabase process_leave_action_rpc fallback:', e);
      }
    }

    // In-memory fallback
    const leaves = dataStore.getLeaves();
    const target = leaves.find(l => l.id === leaveId || l.leave_id === leaveId);
    if (!target) {
      return { success: false, status: 'rejected', stage: 'completed', message: 'Leave request not found' };
    }

    const config = dataStore.getLeaveConfig(target.department_id);
    const studentTargetId = target.submitted_by_user_id || 
      (target.student_id.startsWith('prof-') ? target.student_id : `prof-${target.student_id}`);
    
    const hodUser = {
      userId: 'prof-tch-fac-cse-001',
      roleKey: 'hod',
      name: 'Dr. Anuj Sharma (HOD CSE)'
    };
    const principalUser = {
      userId: 'prof-principal-01',
      roleKey: 'principal',
      name: 'Dr. Rajesh Kumar (Principal)'
    };

    let nextStatus: LeaveStatus = 'approved';
    let nextStage: LeaveStage = 'completed';
    let nextAssigneeId: string | null = null;
    let nextAssigneeRoleKey: string | null = null;
    let nextAssigneeName: string | null = null;
    let historyAction: any = 'approved';
    let auditRemarks = remarks || '';

    if (action === 'reject') {
      nextStatus = 'rejected';
      nextStage = 'completed';
      historyAction = 'rejected';

      // Notify Student
      this.createNotification({
        recipient_user_id: studentTargetId,
        title: 'Leave Application Rejected',
        message: `Your leave application from ${target.start_date} to ${target.end_date} was rejected by ${reviewerName}.${remarks ? ' Remarks: ' + remarks : ''}`,
        type: 'leave',
        related_record_id: leaveId,
        link_url: '/app/leave',
        is_read: false
      });
    } else {
      // APPROVE ACTION
      if (target.current_stage === 'faculty') {
        if (target.total_days <= config.short_leave_max_days) {
          // Short leave (1-2 days) finalized at Faculty stage
          nextStatus = 'approved';
          nextStage = 'completed';
          historyAction = 'approved';

          this.createNotification({
            recipient_user_id: studentTargetId,
            title: 'Leave Application Approved',
            message: `Your leave application from ${target.start_date} to ${target.end_date} has been approved by ${reviewerName}.`,
            type: 'leave',
            related_record_id: leaveId,
            link_url: '/app/leave',
            is_read: false
          });
        } else {
          // Requires HOD stage (3+ days)
          // Multi-Role Safeguard (Option A): If Faculty is also HOD, skip duplicate review!
          const isSameUserAsHod = reviewerId === hodUser.userId || 
                                  reviewerRole === 'hod' || 
                                  reviewerName.includes('Anuj');
          
          if (isSameUserAsHod) {
            nextStatus = 'approved';
            nextStage = 'completed';
            historyAction = 'approved';
            auditRemarks = (remarks ? `${remarks} ` : '') + '(Faculty and HOD role held by same user; duplicate HOD approval skipped.)';

            this.createNotification({
              recipient_user_id: studentTargetId,
              title: 'Leave Application Approved',
              message: `Your leave application from ${target.start_date} to ${target.end_date} has been approved by ${reviewerName} (Faculty & HOD dual sanction).`,
              type: 'leave',
              related_record_id: leaveId,
              link_url: '/app/leave',
              is_read: false
            });
          } else {
            // Forward to HOD
            nextStatus = 'pending_hod';
            nextStage = 'hod';
            nextAssigneeId = hodUser.userId;
            nextAssigneeRoleKey = hodUser.roleKey;
            nextAssigneeName = hodUser.name;
            historyAction = 'forwarded_to_hod';

            // Notify HOD
            this.createNotification({
              recipient_user_id: hodUser.userId,
              title: 'New Leave Application Requires HOD Approval',
              message: `${target.student_name || 'Student'} has a leave request requiring your department approval. Duration: ${target.total_days} days (${target.start_date} to ${target.end_date}).`,
              type: 'leave',
              related_record_id: leaveId,
              link_url: '/app/approvals',
              is_read: false
            });

            // Notify Student of forwarded state
            this.createNotification({
              recipient_user_id: studentTargetId,
              title: 'Leave Application Forwarded to HOD',
              message: 'Your leave application has been recommended by faculty and forwarded to the HOD for final review.',
              type: 'leave',
              related_record_id: leaveId,
              link_url: '/app/leave',
              is_read: false
            });
          }
        }
      } else if (target.current_stage === 'hod') {
        if (target.total_days >= config.principal_required_after_days) {
          // Long leave (7+ days): Forward to Principal
          nextStatus = 'pending_principal';
          nextStage = 'principal';
          nextAssigneeId = principalUser.userId;
          nextAssigneeRoleKey = principalUser.roleKey;
          nextAssigneeName = principalUser.name;
          historyAction = 'forwarded_to_principal';

          // Notify Principal
          this.createNotification({
            recipient_user_id: principalUser.userId,
            title: 'Long Leave Request Requires Principal Approval',
            message: `${target.student_name || 'Student'} has a leave request exceeding 7 days (${target.total_days} days) requiring institutional approval.`,
            type: 'leave',
            related_record_id: leaveId,
            link_url: '/app/leave',
            is_read: false
          });

          // Notify Student
          this.createNotification({
            recipient_user_id: studentTargetId,
            title: 'Leave Application Forwarded to Principal',
            message: 'Your leave application has been forwarded to the Principal for institutional approval.',
            type: 'leave',
            related_record_id: leaveId,
            link_url: '/app/leave',
            is_read: false
          });
        } else {
          // HOD Final decision (3-6 days)
          nextStatus = 'approved';
          nextStage = 'completed';
          historyAction = 'approved';

          this.createNotification({
            recipient_user_id: studentTargetId,
            title: 'Leave Application Approved',
            message: `Your leave application from ${target.start_date} to ${target.end_date} has been approved by the HOD (${reviewerName}).`,
            type: 'leave',
            related_record_id: leaveId,
            link_url: '/app/leave',
            is_read: false
          });
        }
      } else if (target.current_stage === 'principal') {
        nextStatus = 'approved';
        nextStage = 'completed';
        historyAction = 'approved';

        this.createNotification({
          recipient_user_id: studentTargetId,
          title: 'Leave Application Approved',
          message: `Your leave application from ${target.start_date} to ${target.end_date} has been approved by the Principal (${reviewerName}).`,
          type: 'leave',
          related_record_id: leaveId,
          link_url: '/app/leave',
          is_read: false
        });
      }
    }

    // Update in dataStore
    const updatedLeaves = leaves.map(l => {
      if (l.id === leaveId || l.leave_id === leaveId) {
        return {
          ...l,
          status: nextStatus,
          current_stage: nextStage,
          current_assignee_user_id: nextAssigneeId,
          current_assignee_role_key: nextAssigneeRoleKey,
          current_assignee_name: nextAssigneeName || undefined,
          final_decision_by_user_id: nextStage === 'completed' ? (reviewerId || null) : null,
          final_decision_at: nextStage === 'completed' ? nowIso : null,
          approval_remarks: auditRemarks || l.approval_remarks,
          remarks: auditRemarks || l.remarks,
          reviewed_by: reviewerId || l.reviewed_by,
          reviewed_by_name: reviewerName,
          updated_at: nowIso
        };
      }
      return l;
    });
    dataStore.setLeaves(updatedLeaves);

    // Record History
    dataStore.addLeaveHistory({
      history_id: `lvh-${Date.now()}`,
      leave_id: leaveId,
      action_key: historyAction,
      from_status: target.status,
      to_status: nextStatus,
      stage_role_key: target.current_stage,
      performed_by_user_id: reviewerId,
      performed_by_name: reviewerName,
      remarks: auditRemarks,
      created_at: nowIso
    });

    return {
      success: true,
      status: nextStatus,
      stage: nextStage,
      message: `Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`
    };
  },

  // Backward compatibility wrapper
  async updateLeaveStatus(leaveId: string, status: 'Approved' | 'Rejected', reviewerName: string, remarks?: string): Promise<boolean> {
    const action = status.toLowerCase() === 'approved' ? 'approve' : 'reject';
    const res = await this.processLeaveAction({
      leaveId,
      action,
      reviewerName,
      remarks
    });
    return res.success;
  },

  // Fetch Leave History
  async getLeaveHistory(leaveId: string): Promise<LeaveRequestHistory[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('leave_request_history')
          .select('*')
          .eq('leave_id', leaveId)
          .order('created_at', { ascending: true });
        if (!error && data) return data as LeaveRequestHistory[];
      } catch (e) {
        console.warn('Supabase getLeaveHistory error:', e);
      }
    }
    return dataStore.getLeaveHistory(leaveId);
  },

  // Fetch Leave Workflow Config
  async getLeaveConfig(departmentId?: string): Promise<LeaveWorkflowConfig> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('leave_workflow_config')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .single();
        if (!error && data) return data as LeaveWorkflowConfig;
      } catch (e) {
        console.warn('Supabase getLeaveConfig error:', e);
      }
    }
    return dataStore.getLeaveConfig(departmentId);
  },

  // 6. Submit Complaint (Grievance Box)
  async submitComplaint(complaint: Omit<Complaint, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Complaint> {
    const id = `comp-${Date.now()}`;
    const newComplaint: Complaint = {
      ...complaint,
      id,
      status: 'Submitted',
      is_anonymous: complaint.is_anonymous ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('complaints')
        .insert([{
          id,
          student_id: complaint.student_id,
          category: complaint.category,
          title: complaint.title,
          description: complaint.description,
          priority: complaint.priority,
          status: 'Submitted',
          attachment_url: complaint.attachment_url,
          is_anonymous: complaint.is_anonymous ?? true,
          ai_suggested_category: complaint.ai_suggested_category,
          ai_suggested_assignee_role: complaint.ai_suggested_assignee_role,
          ai_suggested_priority: complaint.ai_suggested_priority,
          ai_confidence: complaint.ai_confidence,
          ai_routing_reason: complaint.ai_routing_reason,
          ai_suggestion_confirmed: complaint.ai_suggestion_confirmed ?? false,
          ai_suggestion_reviewed_by: complaint.ai_suggestion_reviewed_by
        }])
        .select()
        .single();
      if (!error && data) {
        // Notify HOD
        this.createNotification({
          recipient_user_id: 'prof-tch-03',
          title: 'New Confidential Complaint',
          message: `Confidential grievance submitted under [${complaint.category}]: ${complaint.title}`,
          type: 'complaint',
          related_record_id: data.id,
          is_read: false
        });
        return data as Complaint;
      }
    }

    const current = dataStore.getComplaints();
    dataStore.setComplaints([newComplaint, ...current]);

    // Local notification for HOD
    this.createNotification({
      recipient_user_id: 'prof-tch-03',
      title: 'New Confidential Complaint',
      message: `Confidential grievance submitted under [${complaint.category}]: ${complaint.title}`,
      type: 'complaint',
      related_record_id: newComplaint.id,
      is_read: false
    });

    return newComplaint;
  },

  // 7. Update Complaint Status / Response (Admin & MD Escalation)
  async updateComplaint(complaintId: string, update: Partial<Complaint>): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('complaints')
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq('id', complaintId);
      if (!error) return true;
    }

    const list = dataStore.getComplaints().map(c => {
      if (c.id === complaintId) {
        return { ...c, ...update, updated_at: new Date().toISOString() };
      }
      return c;
    });
    dataStore.setComplaints(list);
    return true;
  },

  // Auto-escalate unaddressed complaints to MD
  async escalateComplaintToMD(complaintId: string, reason: string): Promise<boolean> {
    return this.updateComplaint(complaintId, {
      status: 'Escalated to MD',
      escalated_to_md: true,
      escalation_reason: reason,
      escalated_at: new Date().toISOString()
    });
  },

  // 8. Create Doubt (Student to Teacher Academic Query with Identity Shield)
  async createDoubt(doubt: Omit<Doubt, 'id' | 'created_at' | 'status' | 'messages'>): Promise<Doubt> {
    const id = `dbt-${Date.now()}`;
    // Student identity shielded: Teacher only sees academic tag
    const studentShieldedTag = `Student (${doubt.student_branch} • Sem ${doubt.student_semester} • Sec ${doubt.student_section})`;
    const initialMessage: DoubtMessage = {
      id: `msg-${Date.now()}`,
      doubt_id: id,
      sender_id: doubt.student_id,
      sender_name: studentShieldedTag,
      sender_role: 'student',
      message: doubt.question,
      attachment_url: doubt.attachment_url,
      created_at: new Date().toISOString()
    };

    const newDoubt: Doubt = {
      ...doubt,
      id,
      is_anonymous_to_teacher: true,
      status: 'Open',
      created_at: new Date().toISOString(),
      messages: [initialMessage]
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('doubts')
        .insert([{
          id,
          student_id: doubt.student_id,
          teacher_id: doubt.teacher_id,
          subject_id: doubt.subject_id,
          question: doubt.question,
          attachment_url: doubt.attachment_url,
          status: 'Open',
          student_branch: doubt.student_branch,
          student_semester: doubt.student_semester,
          student_section: doubt.student_section,
          is_anonymous_to_teacher: true
        }])
        .select()
        .single();
      if (!error && data) {
        // Also insert message
        await supabase.from('doubt_messages').insert([initialMessage]);
        return { ...data, messages: [initialMessage] } as Doubt;
      }
    }

    const list = dataStore.getDoubts();
    dataStore.setDoubts([newDoubt, ...list]);
    return newDoubt;
  },

  // 9. Send Doubt Reply
  async sendDoubtReply(doubtId: string, senderId: string, senderName: string, role: Profile['role'], message: string, attachmentUrl?: string): Promise<DoubtMessage> {
    const newMsg: DoubtMessage = {
      id: `msg-${Date.now()}`,
      doubt_id: doubtId,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: role,
      message,
      attachment_url: attachmentUrl,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('doubt_messages').insert([newMsg]);
      if (role === 'teacher' || role === 'hod') {
        await supabase.from('doubts').update({ status: 'Answered' }).eq('id', doubtId);
      }
    }

    const doubts = dataStore.getDoubts().map(d => {
      if (d.id === doubtId) {
        return {
          ...d,
          status: (role === 'teacher' || role === 'hod') ? 'Answered' as const : d.status,
          messages: [...(d.messages || []), newMsg]
        };
      }
      return d;
    });
    dataStore.setDoubts(doubts);
    return newMsg;
  },

  // 10. Mark Doubt Resolved
  async resolveDoubt(doubtId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('doubts').update({ status: 'Resolved' }).eq('id', doubtId);
    }
    const doubts = dataStore.getDoubts().map(d => 
      d.id === doubtId ? { ...d, status: 'Resolved' as const } : d
    );
    dataStore.setDoubts(doubts);
    return true;
  },

  // 11. Add Achievement
  async submitAchievement(ach: Omit<Achievement, 'id' | 'created_at' | 'verification_status'>): Promise<Achievement> {
    const newAch: Achievement = {
      ...ach,
      id: `ach-${Date.now()}`,
      verification_status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('achievements').insert([newAch]).select().single();
      if (!error && data) return data as Achievement;
    }

    const list = dataStore.getAchievements();
    dataStore.setAchievements([newAch, ...list]);
    return newAch;
  },

  // 11b. Add Achievement by HOD / Authorized Faculty
  async addAchievementByHOD(ach: {
    student_id: string;
    student_name?: string;
    student_roll?: string;
    student_branch?: string;
    title: string;
    event_name?: string;
    achievement_type?: string;
    position?: string;
    description: string;
    achievement_date?: string;
    certificate_url?: string;
    added_by: string;
    added_by_name?: string;
  }): Promise<Achievement> {
    const nowIso = new Date().toISOString();
    const newAch: Achievement = {
      ...ach,
      id: `ach-${Date.now()}`,
      category: ach.achievement_type || 'Competitions',
      verification_status: 'Verified',
      verified_by: ach.added_by_name || 'HOD / College Administration',
      remarks: 'Verified & added by Department HOD',
      created_at: nowIso,
      updated_at: nowIso
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('achievements').insert([newAch]).select().single();
        if (!error && data) {
          // Send notification to student
          this.createNotification({
            recipient_user_id: ach.student_id,
            title: 'New Achievement Added by HOD',
            message: `Congratulations! HOD added verified achievement: "${ach.title}" (${ach.event_name || 'Award'}).`,
            type: 'achievement',
            related_record_id: data.id,
            is_read: false
          });
          return data as Achievement;
        }
      } catch (e) {
        console.warn('Supabase addAchievementByHOD error:', e);
      }
    }

    const list = dataStore.getAchievements();
    dataStore.setAchievements([newAch, ...list]);

    // Local notification for student
    this.createNotification({
      recipient_user_id: ach.student_id,
      title: 'New Achievement Added by HOD',
      message: `Congratulations! HOD added verified achievement: "${ach.title}" (${ach.event_name || 'Award'}).`,
      type: 'achievement',
      related_record_id: newAch.id,
      is_read: false
    });

    return newAch;
  },

  // 11c. Update Achievement (HOD / Admin only)
  async updateAchievement(id: string, updates: Partial<Achievement>): Promise<boolean> {
    const nowIso = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      await supabase.from('achievements').update({ ...updates, updated_at: nowIso }).eq('id', id);
    }
    const list = dataStore.getAchievements().map(a => 
      a.id === id ? { ...a, ...updates, updated_at: nowIso } : a
    );
    dataStore.setAchievements(list);
    return true;
  },

  // 11d. Delete Achievement (HOD / Admin only)
  async deleteAchievement(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('achievements').delete().eq('id', id);
    }
    const list = dataStore.getAchievements().filter(a => a.id !== id);
    dataStore.setAchievements(list);
    return true;
  },

  // 12. Verify Achievement (Teacher/Admin)
  async updateAchievementStatus(achId: string, status: 'Verified' | 'Rejected', verifiedBy: string, remarks?: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      await supabase.from('achievements').update({
        verification_status: status,
        remarks,
        updated_at: nowIso
      }).eq('id', achId);
    }
    const list = dataStore.getAchievements().map(a => 
      a.id === achId ? { ...a, verification_status: status, verified_by: verifiedBy, remarks: remarks || a.remarks, updated_at: nowIso } : a
    );
    dataStore.setAchievements(list);
    return true;
  },

  // 12b. Notifications Service (Scoped to Current User + Max Limit)
  async getNotifications(userId: string, role?: string, limit: number = 50): Promise<NotificationItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .or(`recipient_user_id.eq.${userId},user_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!error && data) return data as NotificationItem[];
      } catch (e) {
        console.warn('Supabase getNotifications error:', e);
      }
    }

    const all = dataStore.getNotifications();
    return all.filter(n => 
      n.recipient_user_id === userId || 
      n.user_id === userId ||
      (role === 'hod' && (n.recipient_user_id.includes('tch-03') || n.recipient_user_id.includes('hod'))) ||
      (role === 'teacher' && (n.recipient_user_id.includes('tch-01') || n.recipient_user_id.includes('teacher'))) ||
      (role === 'student' && (n.recipient_user_id.includes('cse-001') || n.recipient_user_id.includes('student') || n.recipient_user_id === userId)) ||
      (role === 'admin')
    ).slice(0, limit);
  },

  async createNotification(notification: Omit<NotificationItem, 'id' | 'created_at'>): Promise<NotificationItem> {
    const newNotif: NotificationItem = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: notification.user_id || notification.recipient_user_id,
      is_read: false,
      read: false,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').insert([newNotif]);
      } catch (e) {
        console.warn('Supabase createNotification error:', e);
      }
    }

    const all = dataStore.getNotifications();
    dataStore.setNotifications([newNotif, ...all]);
    return newNotif;
  },

  async markNotificationAsRead(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('notifications').update({ is_read: true, read: true }).eq('id', id);
    }
    const all = dataStore.getNotifications().map(n => 
      n.id === id ? { ...n, is_read: true, read: true } : n
    );
    dataStore.setNotifications(all);
    return true;
  },

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('notifications').update({ is_read: true, read: true }).or(`recipient_user_id.eq.${userId},user_id.eq.${userId}`);
    }
    const all = dataStore.getNotifications().map(n => 
      (n.recipient_user_id === userId || n.user_id === userId) ? { ...n, is_read: true, read: true } : n
    );
    dataStore.setNotifications(all);
    return true;
  },

  // 13. Create Notice
  async createNotice(notice: Omit<Notice, 'id' | 'created_at'>): Promise<Notice> {
    const newNotice: Notice = {
      ...notice,
      id: `not-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('notices').insert([newNotice]).select().single();
      if (!error && data) return data as Notice;
    }
    const current = dataStore.getNotices();
    dataStore.setNotices([newNotice, ...current]);
    return newNotice;
  },

  // 14. Create Calendar Event
  async createCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      ...event,
      id: `cal-${Date.now()}`
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('calendar_events').insert([newEvent]).select().single();
      if (!error && data) return data as CalendarEvent;
    }
    const current = dataStore.getCalendar();
    dataStore.setCalendar([...current, newEvent]);
    return newEvent;
  },

  // 15. Save / Publish Sessional Results (Teacher / HOD)
  async saveSessionalResult(result: Omit<SessionalResult, 'id' | 'created_at'>): Promise<SessionalResult> {
    const newResult: SessionalResult = {
      ...result,
      id: `ses-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      await supabase.from('sessional_results').insert([newResult]);
    }
    const current = dataStore.getSessionalResults();
    dataStore.setSessionalResults([newResult, ...current]);
    return newResult;
  },

  // 16. Update Syllabus Unit Progress (Teacher / HOD / Admin)
  async updateSyllabusProgress(unitId: string, progress: number, updatedBy?: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('syllabus_progress').update({ progress_percentage: progress, updated_at: new Date().toISOString() }).eq('id', unitId);
    }
    const list = dataStore.getSyllabusProgress().map(sp => 
      sp.id === unitId ? { ...sp, progress_percentage: progress, updated_at: new Date().toISOString(), updated_by: updatedBy } : sp
    );
    dataStore.setSyllabusProgress(list);
    return true;
  },

  // 17. Digital Gate Pass & Entry (Future Module)
  async issueGatePass(pass: Omit<GatePass, 'id' | 'created_at' | 'status'>): Promise<GatePass> {
    const newPass: GatePass = {
      ...pass,
      id: `gp-${Date.now()}`,
      status: 'Active',
      created_at: new Date().toISOString()
    };
    const current = dataStore.getGatePasses();
    dataStore.setGatePasses([newPass, ...current]);
    return newPass;
  },

  async recordGateEntry(entry: Omit<GateEntry, 'id'>): Promise<GateEntry> {
    const newEntry: GateEntry = {
      ...entry,
      id: `ge-${Date.now()}`
    };
    const current = dataStore.getGateEntries();
    dataStore.setGateEntries([newEntry, ...current]);
    return newEntry;
  },

  // ===========================================================================
  // 18. LIVE SUPABASE GETTERS WITH DATASTORE FALLBACK (Phases 4, 5, 6, 8)
  // ===========================================================================

  // 18a. Attendance Queries (Supports Student Scope & Pagination)
  async getAttendance(filter?: {
    studentId?: string;
    subjectId?: string;
    date?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AttendanceRecord[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('attendance').select('*').order('date', { ascending: false });
        if (filter?.studentId) query = query.eq('student_id', filter.studentId);
        if (filter?.subjectId) query = query.eq('subject_id', filter.subjectId);
        if (filter?.date) query = query.eq('date', filter.date);
        if (filter?.pageSize) {
          const page = Math.max(1, filter.page || 1);
          const from = (page - 1) * filter.pageSize;
          query = query.range(from, from + filter.pageSize - 1);
        }
        const { data, error } = await query;
        if (!error && data) return data as AttendanceRecord[];
      } catch (e) {
        console.warn('Supabase getAttendance error:', e);
      }
    }
    const all = dataStore.getAttendance();
    const filtered = all.filter(a => {
      if (filter?.studentId && a.student_id !== filter.studentId) return false;
      if (filter?.subjectId && a.subject_id !== filter.subjectId) return false;
      if (filter?.date && a.date !== filter.date) return false;
      return true;
    });
    if (filter?.pageSize) {
      const page = Math.max(1, filter.page || 1);
      const from = (page - 1) * filter.pageSize;
      return filtered.slice(from, from + filter.pageSize);
    }
    return filtered;
  },

  // 18b. Leave Requests Queries (Supports Stage, Assignee, Department Scope & Pagination)
  async getLeaves(
    filter?: {
      studentId?: string;
      stage?: LeaveStage;
      status?: LeaveStatus;
      assigneeUserId?: string;
      department?: string;
    } | string,
    pagination?: { page?: number; pageSize?: number }
  ): Promise<LeaveRequest[]> {
    const studentId = typeof filter === 'string' ? filter : filter?.studentId;
    const stage = typeof filter === 'object' ? filter?.stage : undefined;
    const status = typeof filter === 'object' ? filter?.status : undefined;
    const assigneeUserId = typeof filter === 'object' ? filter?.assigneeUserId : undefined;
    const department = typeof filter === 'object' ? filter?.department : undefined;

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('leave_requests').select('*').order('created_at', { ascending: false });
        if (studentId) query = query.or(`student_id.eq.${studentId},submitted_by_user_id.eq.${studentId}`);
        if (stage) query = query.eq('current_stage', stage);
        if (status) query = query.eq('status', status);
        if (assigneeUserId) query = query.eq('current_assignee_user_id', assigneeUserId);
        if (department) query = query.or(`student_branch.eq.${department},department_id.eq.${department}`);
        if (pagination?.pageSize) {
          const page = Math.max(1, pagination.page || 1);
          const from = (page - 1) * pagination.pageSize;
          query = query.range(from, from + pagination.pageSize - 1);
        }
        const { data, error } = await query;
        if (!error && data) return data as LeaveRequest[];
      } catch (e) {
        console.warn('Supabase getLeaves error:', e);
      }
    }

    const all = dataStore.getLeaves();
    let filtered = all;
    if (studentId) {
      filtered = filtered.filter(l => l.student_id === studentId || l.submitted_by_user_id === studentId);
    }
    if (stage) {
      filtered = filtered.filter(l => l.current_stage === stage);
    }
    if (status) {
      filtered = filtered.filter(l => l.status.toLowerCase() === status.toLowerCase());
    }
    if (assigneeUserId) {
      filtered = filtered.filter(l => l.current_assignee_user_id === assigneeUserId);
    }
    if (department) {
      filtered = filtered.filter(l => l.student_branch === department || l.department_id === department);
    }

    if (pagination?.pageSize) {
      const page = Math.max(1, pagination.page || 1);
      const from = (page - 1) * pagination.pageSize;
      return filtered.slice(from, from + pagination.pageSize);
    }
    return filtered;
  },

  // 18c. Complaints Queries (Supports Student Scope & Pagination)
  async getComplaints(studentId?: string, pagination?: { page?: number; pageSize?: number }): Promise<Complaint[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });
        if (studentId) query = query.eq('student_id', studentId);
        if (pagination?.pageSize) {
          const page = Math.max(1, pagination.page || 1);
          const from = (page - 1) * pagination.pageSize;
          query = query.range(from, from + pagination.pageSize - 1);
        }
        const { data, error } = await query;
        if (!error && data) return data as Complaint[];
      } catch (e) {
        console.warn('Supabase getComplaints error:', e);
      }
    }
    const all = dataStore.getComplaints();
    const filtered = studentId ? all.filter(c => c.student_id === studentId) : all;
    if (pagination?.pageSize) {
      const page = Math.max(1, pagination.page || 1);
      const from = (page - 1) * pagination.pageSize;
      return filtered.slice(from, from + pagination.pageSize);
    }
    return filtered;
  },

  // 18d. Doubts Queries (Supports Student/Teacher Scope & Pagination)
  async getDoubts(filter?: { studentId?: string; teacherId?: string; page?: number; pageSize?: number }): Promise<Doubt[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('doubts').select('*, messages:doubt_messages(*)').order('created_at', { ascending: false });
        if (filter?.studentId) query = query.eq('student_id', filter.studentId);
        if (filter?.teacherId) query = query.eq('teacher_id', filter.teacherId);
        if (filter?.pageSize) {
          const page = Math.max(1, filter.page || 1);
          const from = (page - 1) * filter.pageSize;
          query = query.range(from, from + filter.pageSize - 1);
        }
        const { data, error } = await query;
        if (!error && data) return data as Doubt[];
      } catch (e) {
        console.warn('Supabase getDoubts error:', e);
      }
    }
    const all = dataStore.getDoubts();
    const filtered = all.filter(d => {
      if (filter?.studentId && d.student_id !== filter.studentId) return false;
      if (filter?.teacherId && d.teacher_id !== filter.teacherId) return false;
      return true;
    });
    if (filter?.pageSize) {
      const page = Math.max(1, filter.page || 1);
      const from = (page - 1) * filter.pageSize;
      return filtered.slice(from, from + filter.pageSize);
    }
    return filtered;
  },

  // 18e. Achievements Queries (Supports Student Scope & Pagination)
  async getAchievements(studentId?: string, pagination?: { page?: number; pageSize?: number }): Promise<Achievement[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('achievements').select('*').order('created_at', { ascending: false });
        if (studentId) query = query.eq('student_id', studentId);
        if (pagination?.pageSize) {
          const page = Math.max(1, pagination.page || 1);
          const from = (page - 1) * pagination.pageSize;
          query = query.range(from, from + pagination.pageSize - 1);
        }
        const { data, error } = await query;
        if (!error && data) return data as Achievement[];
      } catch (e) {
        console.warn('Supabase getAchievements error:', e);
      }
    }
    const all = dataStore.getAchievements();
    const filtered = studentId ? all.filter(a => a.student_id === studentId) : all;
    if (pagination?.pageSize) {
      const page = Math.max(1, pagination.page || 1);
      const from = (page - 1) * pagination.pageSize;
      return filtered.slice(from, from + pagination.pageSize);
    }
    return filtered;
  },

  // 18f. Sessional Results Queries
  async getSessionalResults(filter?: { studentId?: string; branch?: string; semester?: number }): Promise<SessionalResult[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('sessional_results').select('*').order('created_at', { ascending: false });
        if (filter?.studentId) query = query.eq('student_id', filter.studentId);
        if (filter?.branch) query = query.eq('branch', filter.branch);
        if (filter?.semester) query = query.eq('semester', filter.semester);
        const { data, error } = await query;
        if (!error && data) return data as SessionalResult[];
      } catch (e) {
        console.warn('Supabase getSessionalResults error:', e);
      }
    }
    const all = dataStore.getSessionalResults();
    return all.filter(s => {
      if (filter?.studentId && s.student_id !== filter.studentId) return false;
      if (filter?.branch && s.branch !== filter.branch) return false;
      if (filter?.semester && s.semester !== filter.semester) return false;
      return true;
    });
  },

  // 18g. Timetable Queries (Phase 5)
  async getTimetable(filter?: { branch?: string; semester?: number; section?: string; day?: string }): Promise<TimetableSlot[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Query timetable_slots view or timetable table
        let query = supabase.from('timetable_slots').select('*');
        if (filter?.branch) query = query.eq('branch', filter.branch);
        if (filter?.semester) query = query.eq('semester', filter.semester);
        if (filter?.section) query = query.eq('section', filter.section);
        if (filter?.day) query = query.eq('day', filter.day);
        const { data, error } = await query;
        if (!error && data) return data as TimetableSlot[];
      } catch (e) {
        console.warn('Supabase getTimetable error:', e);
      }
    }
    const all = dataStore.getTimetable();
    return all.filter(t => {
      if (filter?.branch && t.branch !== filter.branch) return false;
      if (filter?.semester && t.semester !== filter.semester) return false;
      if (filter?.section && t.section && t.section !== filter.section) return false;
      if (filter?.day && t.day !== filter.day) return false;
      return true;
    });
  },

  // 18h. Gate Pass Requests & Signed Passes (Phase 6)
  async getGatePassRequests(studentId?: string): Promise<GatePassRequest[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('gate_pass_requests').select('*').order('created_at', { ascending: false });
        if (studentId) query = query.eq('student_id', studentId);
        const { data, error } = await query;
        if (!error && data) return data as GatePassRequest[];
      } catch (e) {
        console.warn('Supabase getGatePassRequests error:', e);
      }
    }
    const all = dataStore.getGatePassRequests();
    return studentId ? all.filter(r => r.student_id === studentId) : all;
  },

  async submitGatePassRequest(req: Omit<GatePassRequest, 'id' | 'created_at' | 'status'>): Promise<GatePassRequest> {
    const newReq: GatePassRequest = {
      ...req,
      id: `gpr-${Date.now()}`,
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('gate_pass_requests').insert([newReq]).select().single();
        if (!error && data) return data as GatePassRequest;
      } catch (e) {
        console.warn('Supabase submitGatePassRequest error:', e);
      }
    }
    const current = dataStore.getGatePassRequests();
    dataStore.setGatePassRequests([newReq, ...current]);
    return newReq;
  },

  async approveGatePassRequest(requestId: string, approverId: string, approverName: string, comments?: string): Promise<boolean> {
    const approvedAt = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('gate_pass_requests').update({
          status: 'Approved',
          approver_id: approverId,
          approver_name: approverName,
          approver_comments: comments,
          approved_at: approvedAt
        }).eq('id', requestId);
      } catch (e) {
        console.warn('Supabase approveGatePassRequest error:', e);
      }
    }
    const list = dataStore.getGatePassRequests().map(r => 
      r.id === requestId 
        ? { ...r, status: 'Approved' as const, approver_id: approverId, approver_name: approverName, approver_comments: comments, approved_at: approvedAt }
        : r
    );
    dataStore.setGatePassRequests(list);
    return true;
  },

  async rejectGatePassRequest(requestId: string, approverId: string, approverName: string, comments?: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('gate_pass_requests').update({
          status: 'Rejected',
          approver_id: approverId,
          approver_name: approverName,
          approver_comments: comments
        }).eq('id', requestId);
      } catch (e) {
        console.warn('Supabase rejectGatePassRequest error:', e);
      }
    }
    const list = dataStore.getGatePassRequests().map(r => 
      r.id === requestId 
        ? { ...r, status: 'Rejected' as const, approver_id: approverId, approver_name: approverName, approver_comments: comments }
        : r
    );
    dataStore.setGatePassRequests(list);
    return true;
  },

  async getSignedGatePasses(studentId?: string): Promise<GatePass[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('signed_gate_passes').select('*').order('created_at', { ascending: false });
        if (studentId) query = query.eq('student_id', studentId);
        const { data, error } = await query;
        if (!error && data) return data as GatePass[];
      } catch (e) {
        console.warn('Supabase getSignedGatePasses error:', e);
      }
    }
    const all = dataStore.getGatePasses();
    return studentId ? all.filter(p => p.student_id === studentId) : all;
  },

  async getGateScanLogs(limit: number = 50): Promise<GateScanLog[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('gate_scan_logs').select('*').order('scanned_at', { ascending: false }).limit(limit);
        if (!error && data) return data as GateScanLog[];
      } catch (e) {
        console.warn('Supabase getGateScanLogs error:', e);
      }
    }
    return dataStore.getGateScanLogs().slice(0, limit);
  },

  async recordGateScan(scan: Omit<GateScanLog, 'id' | 'scanned_at'>): Promise<GateScanLog> {
    const newScan: GateScanLog = {
      ...scan,
      id: `gsl-${Date.now()}`,
      scanned_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('gate_scan_logs').insert([newScan]).select().single();
        if (!error && data) return data as GateScanLog;
      } catch (e) {
        console.warn('Supabase recordGateScan error:', e);
      }
    }
    dataStore.addGateScanLog(newScan);
    return newScan;
  },

  // 18i. Student Fines & Appeals (Supports Student Scope & Pagination)
  async getStudentFines(studentId?: string, pagination?: { page?: number; pageSize?: number }): Promise<StudentFine[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('student_fines').select('*').order('created_at', { ascending: false });
        if (studentId) query = query.eq('student_id', studentId);
        if (pagination?.pageSize) {
          const page = Math.max(1, pagination.page || 1);
          const from = (page - 1) * pagination.pageSize;
          query = query.range(from, from + pagination.pageSize - 1);
        }
        const { data, error } = await query;
        if (!error && data) return data as StudentFine[];
      } catch (e) {
        console.warn('Supabase getStudentFines error:', e);
      }
    }
    const all = dataStore.getStudentFines();
    const filtered = studentId ? all.filter(f => f.student_id === studentId) : all;
    if (pagination?.pageSize) {
      const page = Math.max(1, pagination.page || 1);
      const from = (page - 1) * pagination.pageSize;
      return filtered.slice(from, from + pagination.pageSize);
    }
    return filtered;
  },

  async issueStudentFine(fine: Omit<StudentFine, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<StudentFine> {
    const nowIso = new Date().toISOString();
    const newFine: StudentFine = {
      ...fine,
      id: `fine-${Date.now()}`,
      status: 'Issued',
      created_at: nowIso,
      updated_at: nowIso
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('student_fines').insert([newFine]).select().single();
        if (!error && data) return data as StudentFine;
      } catch (e) {
        console.warn('Supabase issueStudentFine error:', e);
      }
    }
    const current = dataStore.getStudentFines();
    dataStore.setStudentFines([newFine, ...current]);
    return newFine;
  },

  async updateStudentFineStatus(fineId: string, status: StudentFine['status'], waiverReason?: string, waivedBy?: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('student_fines').update({
          status,
          waiver_reason: waiverReason,
          waived_by: waivedBy,
          waived_at: status === 'Waived' ? nowIso : undefined,
          updated_at: nowIso
        }).eq('id', fineId);
      } catch (e) {
        console.warn('Supabase updateStudentFineStatus error:', e);
      }
    }
    const list = dataStore.getStudentFines().map(f => 
      f.id === fineId ? { ...f, status, waiver_reason: waiverReason, updated_at: nowIso } : f
    );
    dataStore.setStudentFines(list);
    return true;
  },

  async getFineAppeals(fineId?: string, studentId?: string): Promise<FineAppeal[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('fine_appeals').select('*').order('created_at', { ascending: false });
        if (fineId) query = query.eq('fine_id', fineId);
        if (studentId) query = query.eq('student_id', studentId);
        const { data, error } = await query;
        if (!error && data) return data as FineAppeal[];
      } catch (e) {
        console.warn('Supabase getFineAppeals error:', e);
      }
    }
    const all = dataStore.getFineAppeals();
    return all.filter(a => {
      if (fineId && a.fine_id !== fineId) return false;
      if (studentId && a.student_id !== studentId) return false;
      return true;
    });
  },

  async submitFineAppeal(appeal: Omit<FineAppeal, 'id' | 'created_at' | 'status'>): Promise<FineAppeal> {
    const newAppeal: FineAppeal = {
      ...appeal,
      id: `appeal-${Date.now()}`,
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('fine_appeals').insert([newAppeal]).select().single();
        if (!error && data) return data as FineAppeal;
      } catch (e) {
        console.warn('Supabase submitFineAppeal error:', e);
      }
    }
    const current = dataStore.getFineAppeals();
    dataStore.setFineAppeals([newAppeal, ...current]);
    return newAppeal;
  },

  async reviewFineAppeal(appealId: string, status: 'Approved' | 'Rejected', reviewerId: string, notes?: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('fine_appeals').update({
          status,
          reviewed_by: reviewerId,
          review_notes: notes,
          reviewed_at: nowIso
        }).eq('id', appealId);
      } catch (e) {
        console.warn('Supabase reviewFineAppeal error:', e);
      }
    }
    const list = dataStore.getFineAppeals().map(a => 
      a.id === appealId ? { ...a, status, reviewed_by: reviewerId, review_notes: notes, reviewed_at: nowIso } : a
    );
    dataStore.setFineAppeals(list);
    return true;
  },

  // 18j. Grades & Dynamic CGPA (Phase 8)
  async getGrades(studentId: string, semester?: number): Promise<Grade[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('grades').select('*').eq('student_id', studentId).order('semester', { ascending: true });
        if (semester) query = query.eq('semester', semester);
        const { data, error } = await query;
        if (!error && data) return data as Grade[];
      } catch (e) {
        console.warn('Supabase getGrades error:', e);
      }
    }
    const all = dataStore.getGrades();
    return all.filter(g => g.student_id === studentId && (!semester || g.semester === semester));
  },

  async saveGrade(grade: Omit<Grade, 'id' | 'created_at'>): Promise<Grade> {
    const newGrade: Grade = {
      ...grade,
      id: `grd-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('grades').insert([newGrade]).select().single();
        if (!error && data) return data as Grade;
      } catch (e) {
        console.warn('Supabase saveGrade error:', e);
      }
    }
    const current = dataStore.getGrades();
    dataStore.setGrades([newGrade, ...current]);
    return newGrade;
  },

  // =============================================================================
  // 19. CAMPUS GALLERY SERVICE
  // =============================================================================
  async getGalleryItems(category?: string, status?: string): Promise<GalleryItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('gallery_items').select('*').order('created_at', { ascending: false });
        if (status) {
          query = query.eq('status', status);
        } else {
          query = query.eq('status', 'approved');
        }
        if (category && category !== 'all' && category !== 'All') {
          query = query.eq('category', category);
        }
        const { data, error } = await query;
        if (!error && data) return data as GalleryItem[];
      } catch (e) {
        console.warn('Supabase getGalleryItems error:', e);
      }
    }
    return [];
  },

  async createGalleryItem(item: Omit<GalleryItem, 'id' | 'created_at'>): Promise<GalleryItem> {
    const newItem: GalleryItem = {
      ...item,
      id: `gal-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('gallery_items').insert([{
          title: item.title,
          description: item.description,
          image_url: item.image_url,
          category: item.category,
          event_date: item.event_date || new Date().toISOString().split('T')[0],
          uploaded_by: item.uploaded_by,
          status: item.status || 'pending'
        }]).select().single();
        if (!error && data) return data as GalleryItem;
      } catch (e) {
        console.warn('Supabase createGalleryItem error:', e);
      }
    }
    return newItem;
  },

  async approveGalleryItem(id: string, status: 'approved' | 'rejected'): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('gallery_items').update({ status }).eq('id', id);
        return !error;
      } catch (e) {
        console.warn('Supabase approveGalleryItem error:', e);
      }
    }
    return true;
  },

  // =============================================================================
  // 20. SUBJECTS & TEACHER ASSIGNMENTS SERVICE
  // =============================================================================
  async getSubjects(params?: { branch?: string; semester?: number; teacherId?: string }): Promise<Subject[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('subjects').select('*, teacher:teachers_master(*)').order('subject_name');
        if (params?.branch && params.branch !== 'All') query = query.eq('branch', params.branch);
        if (params?.semester && params.semester !== 0) query = query.eq('semester', params.semester);
        if (params?.teacherId) {
          const { data: allocations } = await supabase.from('teacher_subjects').select('subject_id').eq('teacher_id', params.teacherId);
          const allocatedSubjectIds = (allocations || []).map((a: any) => a.subject_id);
          if (allocatedSubjectIds.length > 0) {
            query = query.or(`teacher_id.eq.${params.teacherId},id.in.(${allocatedSubjectIds.join(',')})`);
          } else {
            query = query.eq('teacher_id', params.teacherId);
          }
        }
        const { data, error } = await query;
        if (!error && data) {
          return data.map((s: any) => ({
            id: s.id,
            subject_code: s.subject_code,
            subject_name: s.subject_name,
            branch: s.branch,
            semester: s.semester,
            teacher_id: s.teacher_id,
            teacher_name: s.teacher?.full_name || s.teacher?.name || 'Assigned Faculty'
          })) as Subject[];
        }
      } catch (e) {
        console.warn('Supabase getSubjects error:', e);
      }
    }
    const all = dataStore.getSubjects();
    return all.filter(s => {
      const matchBranch = !params?.branch || params.branch === 'All' || s.branch === params.branch;
      const matchSem = !params?.semester || params.semester === 0 || s.semester === params.semester;
      const matchTeacher = !params?.teacherId || s.teacher_id === params.teacherId;
      return matchBranch && matchSem && matchTeacher;
    });
  },

  async getTeacherSubjects(teacherId: string): Promise<Subject[]> {
    return this.getSubjects({ teacherId });
  },

  // =============================================================================
  // 21. SYLLABUS SERVICE (Subject Teacher / HOD / Admin)
  // =============================================================================
  async getSyllabus(params?: { branch?: string; semester?: number; subjectId?: string }): Promise<SyllabusItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('syllabus').select('*, subject:subjects(*)').order('created_at', { ascending: false });
        if (params?.branch && params.branch !== 'All') query = query.eq('branch', params.branch);
        if (params?.semester && params.semester !== 0) query = query.eq('semester', params.semester);
        if (params?.subjectId) query = query.eq('subject_id', params.subjectId);
        const { data, error } = await query;
        if (!error && data) {
          return data.map((item: any) => ({
            id: item.id,
            department: item.department || item.branch,
            branch: item.branch || item.subject?.branch || 'CSE',
            semester: item.semester || item.subject?.semester || 1,
            subject_id: item.subject_id,
            subject_code: item.subject?.subject_code || item.subject_code || '',
            subject_name: item.subject?.subject_name || item.subject_name || item.title,
            title: item.title,
            description: item.description,
            academic_year: item.academic_year,
            units: item.units || [],
            file_url: item.file_url,
            credits: item.credits || 4,
            uploaded_by: item.uploaded_by,
            created_at: item.created_at
          })) as SyllabusItem[];
        }
      } catch (e) {
        console.warn('Supabase getSyllabus error:', e);
      }
    }
    const all = dataStore.getSyllabus();
    return all.filter(s => {
      const matchBranch = !params?.branch || params.branch === 'All' || s.branch === params.branch;
      const matchSem = !params?.semester || params.semester === 0 || s.semester === params.semester;
      const matchSubject = !params?.subjectId || s.subject_id === params.subjectId;
      return matchBranch && matchSem && matchSubject;
    });
  },

  async uploadSyllabus(item: {
    subject_id: string;
    title: string;
    description?: string;
    branch: string;
    semester: number;
    file_url: string;
    academic_year?: string;
    uploaded_by?: string;
  }): Promise<SyllabusItem> {
    const newItem: SyllabusItem = {
      id: `syl-${Date.now()}`,
      subject_id: item.subject_id,
      title: item.title,
      description: item.description,
      branch: item.branch,
      semester: item.semester,
      file_url: item.file_url,
      academic_year: item.academic_year || '2025-26',
      uploaded_by: item.uploaded_by,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('syllabus').insert([{
          subject_id: item.subject_id,
          title: item.title,
          description: item.description,
          branch: item.branch,
          semester: item.semester,
          file_url: item.file_url,
          academic_year: item.academic_year || '2025-26',
          uploaded_by: item.uploaded_by
        }]).select('*, subject:subjects(*)').single();
        if (error) {
          throw new Error(error.message);
        }
        if (data) {
          return {
            ...newItem,
            id: data.id,
            subject_name: data.subject?.subject_name,
            subject_code: data.subject?.subject_code
          };
        }
      } catch (e: any) {
        console.error('Supabase uploadSyllabus error:', e);
        throw e;
      }
    }
    const current = dataStore.getSyllabus();
    dataStore.setSyllabus([newItem, ...current]);
    return newItem;
  },

  async deleteSyllabus(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('syllabus').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return true;
      } catch (e: any) {
        console.error('Supabase deleteSyllabus error:', e);
        throw e;
      }
    }
    const list = dataStore.getSyllabus().filter(s => s.id !== id);
    dataStore.setSyllabus(list);
    return true;
  },

  // =============================================================================
  // 22. PREVIOUS YEAR PAPERS (PYQ) SERVICE (Subject Teacher / HOD / Admin)
  // =============================================================================
  async getPyqs(params?: { branch?: string; semester?: number; subjectId?: string; year?: number }): Promise<PYQItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('pyqs').select('*, subject:subjects(*)').order('year', { ascending: false });
        if (params?.branch && params.branch !== 'All') query = query.eq('branch', params.branch);
        if (params?.semester && params.semester !== 0) query = query.eq('semester', params.semester);
        if (params?.subjectId) query = query.eq('subject_id', params.subjectId);
        if (params?.year) query = query.eq('year', params.year);
        const { data, error } = await query;
        if (!error && data) {
          return data.map((item: any) => ({
            id: item.id,
            subject_id: item.subject_id,
            subject_code: item.subject?.subject_code || item.subject_code || '',
            subject_name: item.subject?.subject_name || item.subject_name || '',
            semester: item.semester || item.subject?.semester || 1,
            branch: item.branch || item.subject?.branch || 'CSE',
            year: item.year,
            exam_type: item.exam_type || 'End Semester',
            file_url: item.file_url,
            description: item.description,
            uploaded_by: item.uploaded_by,
            created_at: item.created_at
          })) as PYQItem[];
        }
      } catch (e) {
        console.warn('Supabase getPyqs error:', e);
      }
    }
    const all = dataStore.getPyqs();
    return all.filter(p => {
      const matchBranch = !params?.branch || params.branch === 'All' || (p.branch || 'CSE') === params.branch;
      const matchSem = !params?.semester || params.semester === 0 || p.semester === params.semester;
      const matchSubject = !params?.subjectId || p.subject_id === params.subjectId;
      const matchYear = !params?.year || p.year === params.year;
      return matchBranch && matchSem && matchSubject && matchYear;
    });
  },

  async uploadPyq(item: {
    subject_id: string;
    year: number;
    exam_type: 'Mid Semester' | 'End Semester' | 'Supplementary';
    semester: number;
    branch?: string;
    file_url: string;
    description?: string;
    uploaded_by?: string;
  }): Promise<PYQItem> {
    const newItem: PYQItem = {
      id: `pyq-${Date.now()}`,
      subject_id: item.subject_id,
      year: item.year,
      exam_type: item.exam_type,
      semester: item.semester,
      branch: item.branch || 'CSE',
      file_url: item.file_url,
      description: item.description,
      uploaded_by: item.uploaded_by,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('pyqs').insert([{
          subject_id: item.subject_id,
          year: item.year,
          exam_type: item.exam_type,
          semester: item.semester,
          branch: item.branch || 'CSE',
          file_url: item.file_url,
          description: item.description,
          uploaded_by: item.uploaded_by
        }]).select('*, subject:subjects(*)').single();
        if (error) {
          throw new Error(error.message);
        }
        if (data) {
          return {
            ...newItem,
            id: data.id,
            subject_name: data.subject?.subject_name,
            subject_code: data.subject?.subject_code
          };
        }
      } catch (e: any) {
        console.error('Supabase uploadPyq error:', e);
        throw e;
      }
    }
    const current = dataStore.getPyqs();
    dataStore.setPyqs([newItem, ...current]);
    return newItem;
  },

  async deletePyq(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('pyqs').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return true;
      } catch (e: any) {
        console.error('Supabase deletePyq error:', e);
        throw e;
      }
    }
    const list = dataStore.getPyqs().filter(p => p.id !== id);
    dataStore.setPyqs(list);
    return true;
  },

  // =============================================================================
  // 23. ONLINE ASSIGNMENTS SERVICE (Teacher / Student)
  // =============================================================================
  async getAssignments(params?: {
    subjectId?: string;
    teacherId?: string;
    studentId?: string;
    branch?: string;
    semester?: number;
  }): Promise<Assignment[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('assignments').select('*, subject:subjects(*), teacher:teachers_master(*), submissions:assignment_submissions(*)').order('created_at', { ascending: false });
        if (params?.subjectId) query = query.eq('subject_id', params.subjectId);
        if (params?.teacherId) query = query.eq('teacher_id', params.teacherId);

        const { data, error } = await query;
        if (!error && data) {
          return data
            .filter((a: any) => {
              if (params?.branch && a.subject && a.subject.branch !== params.branch) return false;
              if (params?.semester && a.subject && a.subject.semester !== params.semester) return false;
              return true;
            })
            .map((a: any) => {
              const mySub = params?.studentId 
                ? (a.submissions || []).find((s: any) => s.student_id === params.studentId)
                : undefined;
              return {
                id: a.id,
                subject_id: a.subject_id,
                teacher_id: a.teacher_id,
                title: a.title,
                description: a.description,
                instructions: a.instructions,
                attachment_url: a.attachment_url,
                max_marks: Number(a.max_marks) || 10,
                due_at: a.due_at,
                allow_resubmission: Boolean(a.allow_resubmission),
                created_at: a.created_at,
                updated_at: a.updated_at,
                subject: a.subject,
                teacher: a.teacher,
                submissions_count: (a.submissions || []).length,
                my_submission: mySub
              } as Assignment;
            });
        }
      } catch (e) {
        console.warn('Supabase getAssignments error:', e);
      }
    }
    return [];
  },

  async getAssignmentById(id: string, studentId?: string): Promise<Assignment | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('*, subject:subjects(*), teacher:teachers_master(*), submissions:assignment_submissions(*)')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) {
          const mySub = studentId 
            ? (data.submissions || []).find((s: any) => s.student_id === studentId)
            : undefined;
          return {
            ...data,
            max_marks: Number(data.max_marks) || 10,
            allow_resubmission: Boolean(data.allow_resubmission),
            submissions_count: (data.submissions || []).length,
            my_submission: mySub
          } as Assignment;
        }
      } catch (e) {
        console.warn('Supabase getAssignmentById error:', e);
      }
    }
    return null;
  },

  async createAssignment(assignment: {
    subject_id: string;
    teacher_id: string;
    title: string;
    description?: string;
    instructions?: string;
    attachment_url?: string;
    max_marks: number;
    due_at: string;
    allow_resubmission: boolean;
  }): Promise<Assignment> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('assignments').insert([{
          subject_id: assignment.subject_id,
          teacher_id: assignment.teacher_id,
          title: assignment.title,
          description: assignment.description,
          instructions: assignment.instructions,
          attachment_url: assignment.attachment_url,
          max_marks: assignment.max_marks,
          due_at: assignment.due_at,
          allow_resubmission: assignment.allow_resubmission
        }]).select('*, subject:subjects(*), teacher:teachers_master(*)').single();

        if (error) throw new Error(error.message);

        // Notify enrolled students of the new assignment
        if (data && data.subject) {
          const { data: students } = await supabase
            .from('students_master')
            .select('id, college_email')
            .eq('branch', data.subject.branch)
            .eq('semester', data.subject.semester)
            .eq('status', 'active');

          if (students && students.length > 0) {
            const notifs = students.map((std: any) => ({
              recipient_user_id: std.id,
              user_id: std.id,
              title: `New Assignment: ${data.title}`,
              message: `${data.subject.subject_name} (${data.subject.subject_code}): Due on ${new Date(data.due_at).toLocaleDateString()}. Max Marks: ${data.max_marks}.`,
              type: 'assignment',
              related_record_id: data.id,
              is_read: false
            }));
            await supabase.from('notifications').insert(notifs);
          }
        }

        return data as Assignment;
      } catch (e: any) {
        console.error('Supabase createAssignment error:', e);
        throw e;
      }
    }
    throw new Error('Supabase is required for online assignments.');
  },

  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('assignments')
          .update({
            title: updates.title,
            description: updates.description,
            instructions: updates.instructions,
            attachment_url: updates.attachment_url,
            max_marks: updates.max_marks,
            due_at: updates.due_at,
            allow_resubmission: updates.allow_resubmission,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select('*, subject:subjects(*), teacher:teachers_master(*)')
          .single();
        if (error) throw new Error(error.message);
        return data as Assignment;
      } catch (e: any) {
        console.error('Supabase updateAssignment error:', e);
        throw e;
      }
    }
    throw new Error('Supabase is required for online assignments.');
  },

  async deleteAssignment(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('assignments').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return true;
      } catch (e: any) {
        console.error('Supabase deleteAssignment error:', e);
        throw e;
      }
    }
    return true;
  },

  // =============================================================================
  // 24. ASSIGNMENT SUBMISSIONS & GRADING SERVICE
  // =============================================================================
  async getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('assignment_submissions')
          .select('*, student:students_master(*), assignment:assignments(*, subject:subjects(*))')
          .eq('assignment_id', assignmentId)
          .order('submitted_at', { ascending: false });
        if (!error && data) return data as AssignmentSubmission[];
      } catch (e) {
        console.warn('Supabase getAssignmentSubmissions error:', e);
      }
    }
    return [];
  },

  async getStudentSubmission(assignmentId: string, studentId: string): Promise<AssignmentSubmission | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('assignment_submissions')
          .select('*, student:students_master(*), assignment:assignments(*, subject:subjects(*))')
          .eq('assignment_id', assignmentId)
          .eq('student_id', studentId)
          .maybeSingle();
        if (!error && data) return data as AssignmentSubmission;
      } catch (e) {
        console.warn('Supabase getStudentSubmission error:', e);
      }
    }
    return null;
  },

  async submitAssignment(submission: {
    assignmentId: string;
    studentId: string;
    answerText?: string;
    fileUrl?: string;
  }): Promise<AssignmentSubmission> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch assignment to verify deadline and teacher
        const { data: assignment, error: aError } = await supabase
          .from('assignments')
          .select('*, subject:subjects(*)')
          .eq('id', submission.assignmentId)
          .single();
        if (aError || !assignment) throw new Error('Assignment not found');

        const now = new Date();
        const due = new Date(assignment.due_at);
        const isLate = now > due;

        // Check if existing submission exists
        const { data: existing } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('assignment_id', submission.assignmentId)
          .eq('student_id', submission.studentId)
          .maybeSingle();

        if (existing) {
          if (!assignment.allow_resubmission && existing.status !== 'resubmission_requested') {
            throw new Error('Resubmission is not permitted for this assignment.');
          }
          if (isLate) {
            throw new Error('Assignment deadline has passed. Resubmission closed.');
          }
          // Update existing submission
          const { data: updated, error: uError } = await supabase
            .from('assignment_submissions')
            .update({
              answer_text: submission.answerText,
              file_url: submission.fileUrl || existing.file_url,
              submitted_at: now.toISOString(),
              updated_at: now.toISOString(),
              status: 'submitted'
            })
            .eq('id', existing.id)
            .select('*, student:students_master(*), assignment:assignments(*)')
            .single();
          if (uError) throw new Error(uError.message);

          // Notify teacher
          await this.createNotification({
            recipient_user_id: assignment.teacher_id,
            user_id: assignment.teacher_id,
            title: `Assignment Resubmission: ${assignment.title}`,
            message: `A student has resubmitted their assignment for ${assignment.subject?.subject_name || 'your course'}.`,
            type: 'assignment_submission',
            related_record_id: updated.id,
            is_read: false
          });

          return updated as AssignmentSubmission;
        }

        // Check deadline on first submission
        if (isLate) {
          throw new Error('Assignment deadline has passed. Late submissions are not accepted.');
        }

        // New submission
        const { data: created, error: cError } = await supabase
          .from('assignment_submissions')
          .insert([{
            assignment_id: submission.assignmentId,
            student_id: submission.studentId,
            answer_text: submission.answerText,
            file_url: submission.fileUrl,
            submitted_at: now.toISOString(),
            status: 'submitted'
          }])
          .select('*, student:students_master(*), assignment:assignments(*)')
          .single();

        if (cError) throw new Error(cError.message);

        // Notify teacher of the submission
        await this.createNotification({
          recipient_user_id: assignment.teacher_id,
          user_id: assignment.teacher_id,
          title: `New Assignment Submission: ${assignment.title}`,
          message: `A new student submission was received for ${assignment.subject?.subject_name || 'your course'}.`,
          type: 'assignment_submission',
          related_record_id: created.id,
          is_read: false
        });

        return created as AssignmentSubmission;
      } catch (e: any) {
        console.error('Supabase submitAssignment error:', e);
        throw e;
      }
    }
    throw new Error('Supabase connection required for assignment submissions.');
  },

  async gradeAssignmentSubmission(
    submissionId: string,
    gradeData: {
      marks: number;
      feedback: string;
      gradedBy: string;
      status?: 'graded' | 'resubmission_requested';
    }
  ): Promise<AssignmentSubmission> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('assignment_submissions')
          .update({
            marks: gradeData.marks,
            teacher_feedback: gradeData.feedback,
            status: gradeData.status || 'graded',
            graded_at: new Date().toISOString(),
            graded_by: gradeData.gradedBy,
            updated_at: new Date().toISOString()
          })
          .eq('id', submissionId)
          .select('*, student:students_master(*), assignment:assignments(*, subject:subjects(*))')
          .single();

        if (error) throw new Error(error.message);

        // Notify the student
        if (data && data.student_id) {
          await this.createNotification({
            recipient_user_id: data.student_id,
            user_id: data.student_id,
            title: `Assignment Graded: ${data.assignment?.title || 'Assignment'}`,
            message: `Your assignment has been graded. Marks: ${gradeData.marks}/${data.assignment?.max_marks || 10}. Feedback: ${gradeData.feedback || 'Good work.'}`,
            type: 'assignment_grade',
            related_record_id: data.id,
            is_read: false
          });
        }

        return data as AssignmentSubmission;
      } catch (e: any) {
        console.error('Supabase gradeAssignmentSubmission error:', e);
        throw e;
      }
    }
    throw new Error('Supabase connection required for grading.');
  },

  // =============================================================================
  // 25. STORAGE FILE UPLOADS
  // =============================================================================
  async uploadAssignmentFile(file: File, studentRoll: string, assignmentId: string): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase connection required for secure file uploads.');
    }
    const cleanExt = (file.name.split('.').pop() || 'pdf').toLowerCase();
    const cleanRoll = studentRoll.replace(/[^a-zA-Z0-9]/g, '_');
    const path = `${assignmentId}/${cleanRoll}_${Date.now()}.${cleanExt}`;

    const { error: uploadError } = await supabase.storage
      .from('assignment-submissions')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('assignment-submissions')
      .getPublicUrl(path);

    return urlData.publicUrl;
  },

  async uploadGalleryMedia(file: File): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase connection required for gallery media uploads.');
    }
    const cleanExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `gallery_${Date.now()}.${cleanExt}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery-media')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Gallery storage upload error:', uploadError);
      throw new Error(`Gallery upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('gallery-media')
      .getPublicUrl(path);

    return urlData.publicUrl;
  },

  // =============================================================================
  // 26. ADMIN DATA IMPORT & AUDIT MANAGEMENT
  // =============================================================================

  async fetchImportValidationContext(): Promise<ValidationMasterContext> {
    const studentsMap = new Map<string, any>();
    const facultyMap = new Map<string, any>();
    const departmentsSet = new Set<string>();
    const branchesSet = new Set<string>();
    const subjectsMap = new Map<string, any>();
    const timetableSlots: ValidationMasterContext['timetableSlots'] = [];
    const attendanceSet = new Set<string>();
    const teacherSubjectSet = new Set<string>();
    const gradesSet = new Set<string>();

    // 1. Fetch from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const [
          { data: stData },
          { data: tcData },
          { data: dpData },
          { data: brData },
          { data: sbData },
          { data: ttData },
          { data: tsData },
          { data: atData },
          { data: gdData }
        ] = await Promise.all([
          supabase.from('students_master').select('id, roll_no, name, full_name, branch, semester, section'),
          supabase.from('teachers_master').select('id, faculty_id, name, full_name, department, role'),
          supabase.from('departments').select('id, code, name'),
          supabase.from('branches').select('id, code, name'),
          supabase.from('subjects').select('id, subject_code, subject_name, branch, semester, teacher_id'),
          supabase.from('timetable').select('*'),
          supabase.from('teacher_subjects').select('id, teacher_id, subject_id, semester, section'),
          supabase.from('attendance').select('id, student_id, subject_id, date, status').limit(2000),
          supabase.from('grades').select('id, student_id, subject_id, subject_code, semester').limit(2000)
        ]);

        if (stData) {
          stData.forEach(s => {
            if (s.roll_no) studentsMap.set(String(s.roll_no).trim().toUpperCase(), s);
          });
        }

        if (tcData) {
          tcData.forEach(t => {
            if (t.faculty_id) facultyMap.set(String(t.faculty_id).trim().toUpperCase(), t);
          });
        }

        if (dpData) {
          dpData.forEach(d => {
            if (d.code) departmentsSet.add(String(d.code).trim().toUpperCase());
          });
        }

        if (brData) {
          brData.forEach(b => {
            if (b.code) branchesSet.add(String(b.code).trim().toUpperCase());
          });
        }

        if (sbData) {
          sbData.forEach(s => {
            if (s.subject_code) subjectsMap.set(String(s.subject_code).trim().toUpperCase(), s);
          });
        }

        if (ttData) {
          ttData.forEach(t => {
            const startMin = t.start_hour_24 !== undefined && t.start_hour_24 !== null
              ? t.start_hour_24 * 60 + (t.start_minute || 0)
              : parseTimeToMinutes(t.start_time) || 0;
            const endMin = t.end_hour_24 !== undefined && t.end_hour_24 !== null
              ? t.end_hour_24 * 60 + (t.end_minute || 0)
              : parseTimeToMinutes(t.end_time) || 0;

            timetableSlots.push({
              id: t.id,
              branch: t.branch || '',
              semester: Number(t.semester) || 1,
              section: t.section || 'A',
              day: t.day || '',
              startMinutes: startMin,
              endMinutes: endMin,
              startTime: t.start_time || '',
              endTime: t.end_time || '',
              subjectCode: t.subject_code || '',
              facultyId: t.teacher_id || '',
              room: t.room_number || ''
            });
          });
        }

        if (tsData && tcData && sbData) {
          const teacherIdToCode = new Map(tcData.map(t => [t.id, t.faculty_id]));
          const subIdToCode = new Map(sbData.map(s => [s.id, s.subject_code]));

          tsData.forEach(ts => {
            const fid = teacherIdToCode.get(ts.teacher_id);
            const sc = subIdToCode.get(ts.subject_id);
            if (fid && sc) {
              teacherSubjectSet.add(`${String(fid).toUpperCase()}|${String(sc).toUpperCase()}|${ts.semester}|${String(ts.section || 'A').toUpperCase()}`);
            }
          });
        }

        if (atData && stData && sbData) {
          const stIdToRoll = new Map(stData.map(s => [s.id, s.roll_no]));
          const subIdToCode = new Map(sbData.map(s => [s.id, s.subject_code]));
          atData.forEach(a => {
            const r = stIdToRoll.get(a.student_id);
            const sc = subIdToCode.get(a.subject_id);
            if (r && sc && a.date) {
              attendanceSet.add(`${String(r).toUpperCase()}|${String(sc).toUpperCase()}|${a.date}`);
            }
          });
        }

        if (gdData && stData) {
          const stIdToRoll = new Map(stData.map(s => [s.id, s.roll_no]));
          gdData.forEach(g => {
            const r = stIdToRoll.get(g.student_id);
            if (r && g.subject_code && g.semester) {
              gradesSet.add(`${String(r).toUpperCase()}|${String(g.subject_code).toUpperCase()}|${g.semester}`);
            }
          });
        }
      } catch (err) {
        console.warn('Error fetching Supabase import validation context, falling back to local master cache:', err);
      }
    }

    // 2. Merge with local dataStore masters for robust fallback
    dataStore.getStudentsMaster().forEach(s => {
      if (s.roll_no && !studentsMap.has(s.roll_no.toUpperCase())) {
        studentsMap.set(s.roll_no.toUpperCase(), s);
      }
    });

    dataStore.getTeachersMaster().forEach(t => {
      if (t.faculty_id && !facultyMap.has(t.faculty_id.toUpperCase())) {
        facultyMap.set(t.faculty_id.toUpperCase(), t);
      }
    });

    dataStore.getSubjects().forEach(s => {
      const code = (s.subject_code || s.code || '').toUpperCase();
      if (code && !subjectsMap.has(code)) {
        subjectsMap.set(code, {
          id: s.id,
          subject_code: s.subject_code || s.code || '',
          subject_name: s.subject_name || s.name || '',
          branch: s.branch,
          semester: s.semester,
          teacher_id: s.teacher_id
        });
      }
    });

    // Default college departments & branches if empty
    if (departmentsSet.size === 0) {
      ['CSE', 'ECE', 'ME', 'CE', 'AS&H'].forEach(d => departmentsSet.add(d));
    }
    if (branchesSet.size === 0) {
      ['CSE', 'CSE AI/ML', 'ECE', 'ME', 'CE'].forEach(b => branchesSet.add(b));
    }

    if (timetableSlots.length === 0) {
      dataStore.getTimetable().forEach(t => {
        const startMin = parseTimeToMinutes(t.start_time) || 0;
        const endMin = parseTimeToMinutes(t.end_time) || 0;
        timetableSlots.push({
          id: t.id,
          branch: t.branch,
          semester: t.semester,
          section: t.section || 'A',
          day: t.day,
          startMinutes: startMin,
          endMinutes: endMin,
          startTime: t.start_time,
          endTime: t.end_time,
          subjectCode: t.subject_code,
          facultyId: t.teacher_id || t.teacher_name || '',
          room: t.room_number
        });
      });
    }

    return {
      studentsMap,
      facultyMap,
      departmentsSet,
      branchesSet,
      subjectsMap,
      timetableSlots,
      attendanceSet,
      teacherSubjectSet,
      gradesSet
    };
  },

  async executeDataImport(params: {
    entityType: ImportEntityType;
    validatedRows: ValidatedRow[];
    importMode: 'create_only' | 'update_existing';
    fileName: string;
    importedBy: string;
    importedByName: string;
    userRole?: string;
  }): Promise<{
    jobId: string;
    totalRows: number;
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
    failedCount: number;
    status: 'Completed' | 'Completed with warnings' | 'Failed';
    errors: ImportError[];
  }> {
    const { entityType, validatedRows, importMode, fileName, importedBy, importedByName, userRole } = params;

    // Strict backend authorization guard
    if (userRole && userRole !== 'admin') {
      throw new Error('Security Exception: Admin authorization required to perform master data import.');
    }
    const jobId = `JOB-${Date.now().toString().slice(-6)}`;
    const errors: ImportError[] = [];

    // Pre-filter rows
    const validRows = validatedRows.filter(r => r.status === 'valid');
    const duplicateRows = validatedRows.filter(r => r.status === 'duplicate');
    const invalidRows = validatedRows.filter(r => r.status === 'invalid');

    // Collect invalid rows into error records
    invalidRows.forEach(row => {
      errors.push({
        id: `err-${Date.now()}-${row.rowNumber}`,
        job_id: jobId,
        row_number: row.rowNumber,
        identifier: String(row.data.roll_no || row.data.faculty_id || row.data.subject_code || row.data.branch_code || ''),
        field_name: row.errors[0]?.column || 'validation',
        error_message: row.errors.map(e => `${e.column}: ${e.message}`).join('; '),
        raw_data: row.raw,
        created_at: new Date().toISOString()
      });
    });

    // ATOMIC TRANSACTION INTEGRITY:
    // If any row is invalid, the entire import MUST abort atomically without committing partial rows.
    if (invalidRows.length > 0) {
      const jobRecord: ImportJob = {
        id: jobId,
        file_name: fileName || `${entityType}_data.csv`,
        target_entity: entityType,
        import_mode: importMode,
        total_rows: validatedRows.length,
        successful_rows: 0,
        updated_rows: 0,
        skipped_rows: 0,
        failed_rows: invalidRows.length,
        imported_by: importedBy,
        imported_by_name: importedByName,
        status: 'Failed',
        created_at: new Date().toISOString()
      };
      dataStore.addImportJob(jobRecord);
      dataStore.setImportErrors(errors);
      return {
        jobId,
        totalRows: validatedRows.length,
        importedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        failedCount: invalidRows.length,
        status: 'Failed',
        errors
      };
    }

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const rowsToProcess = importMode === 'update_existing'
      ? [...validRows, ...duplicateRows]
      : validRows;

    if (importMode === 'create_only') {
      skippedCount = duplicateRows.length;
    }

    // Capture snapshot BEFORE any state mutations for transactional recovery
    const preImportSnapshot = dataStore.getEntitySnapshot(entityType);

    // 1. Process according to entityType
    try {
      switch (entityType) {
        case 'students': {
          const current = [...dataStore.getStudentsMaster()];
          const dbRows: any[] = [];

          rowsToProcess.forEach(r => {
            const roll = String(r.data.roll_no || '').toUpperCase().trim();
            if (!roll) {
              throw new Error(`Database Constraint Violation: roll_no cannot be empty or null (Row ${r.rowNumber})`);
            }
            const existingIdx = current.findIndex(s => s.roll_no.toUpperCase().trim() === roll);

            const studentObj = {
              roll_no: roll,
              student_id: r.data.student_id || `std-${roll}`,
              name: r.data.full_name || r.data.name || 'Student',
              full_name: r.data.full_name || r.data.name || 'Student',
              course: r.data.course || 'B.Tech',
              branch: r.data.branch || 'CSE',
              department: r.data.department || r.data.branch || 'CSE',
              semester: Number(r.data.semester) || 1,
              section: r.data.section || 'A',
              college_email: (r.data.college_email || r.data.email || '').trim().toLowerCase().replace(/^["'`]+|["'`]+$/g, '') || `${roll.toLowerCase()}@hiet.ac.in`,
              phone: r.data.phone || '',
              status: r.data.status || 'active'
            };

            if (existingIdx >= 0) {
              if (importMode === 'update_existing') {
                current[existingIdx] = { ...current[existingIdx], ...studentObj };
                updatedCount++;
                dbRows.push({ id: current[existingIdx].id, ...studentObj });
              }
            } else {
              const newId = `std-imp-${Date.now()}-${r.rowNumber}`;
              current.push({ id: newId, created_at: new Date().toISOString(), ...studentObj });
              importedCount++;
              dbRows.push(studentObj);
            }
          });

          // Attempt atomic PostgreSQL RPC first, fallback to atomic single-statement upsert
          if (isSupabaseConfigured && supabase && dbRows.length > 0) {
            let rpcSuccess = false;
            try {
              const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_import_students_atomic', {
                p_rows: dbRows,
                p_mode: importMode
              });
              if (!rpcErr && rpcRes && rpcRes.success) {
                rpcSuccess = true;
                importedCount = rpcRes.imported_count ?? importedCount;
                updatedCount = rpcRes.updated_count ?? updatedCount;
                if (rpcRes.skipped_count !== undefined) skippedCount = rpcRes.skipped_count;
              } else if (rpcErr) {
                const errMsg = rpcErr.message || '';
                // If RPC failed due to constraint or validation, abort and rollback transaction
                if (!errMsg.includes('could not find the function') && !errMsg.includes('function public.admin_import_students_atomic') && rpcErr.code !== 'PGRST202') {
                  throw new Error(`Atomic Students Import failed: ${errMsg}`);
                }
              }
            } catch (rpcEx: any) {
              if (rpcEx.message?.includes('Atomic Students Import failed')) {
                throw rpcEx;
              }
            }

            if (!rpcSuccess) {
              const { error: dbError } = await supabase.from('students_master').upsert(dbRows, { onConflict: 'roll_no' });
              if (dbError) {
                throw new Error(`Database upsert error on students_master: ${dbError.message}`);
              }
            }
          }

          // Commit to local data store ONLY after database confirmed success
          dataStore.setStudentsMaster(current);
          break;
        }

        case 'faculty': {
          const current = [...dataStore.getTeachersMaster()];
          const dbRows: any[] = [];

          rowsToProcess.forEach(r => {
            const fid = String(r.data.faculty_id).toUpperCase().trim();
            const existingIdx = current.findIndex(t => t.faculty_id.toUpperCase().trim() === fid);
            const safeRole: 'teacher' | 'hod' = String(r.data.role).toLowerCase() === 'hod' ? 'hod' : 'teacher';

            const teacherObj = {
              faculty_id: fid,
              name: r.data.full_name || r.data.name || 'Faculty Member',
              full_name: r.data.full_name || r.data.name || 'Faculty Member',
              department: r.data.department || 'CSE',
              designation: r.data.designation || 'Assistant Professor',
              role: safeRole,
              is_hod: safeRole === 'hod',
              college_email: (r.data.college_email || r.data.email || '').trim().toLowerCase().replace(/^["'`]+|["'`]+$/g, '') || `${fid.toLowerCase()}@hiet.ac.in`,
              phone: r.data.phone || '',
              status: (r.data.status || 'active') as any
            };

            if (existingIdx >= 0) {
              if (importMode === 'update_existing') {
                current[existingIdx] = { ...current[existingIdx], ...teacherObj };
                updatedCount++;
                dbRows.push({ id: current[existingIdx].id, ...teacherObj });
              }
            } else {
              const newId = `tch-imp-${Date.now()}-${r.rowNumber}`;
              current.push({ id: newId, created_at: new Date().toISOString(), ...teacherObj });
              importedCount++;
              dbRows.push(teacherObj);
            }
          });

          if (isSupabaseConfigured && supabase && dbRows.length > 0) {
            let rpcSuccess = false;
            try {
              const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_import_faculty_atomic', {
                p_rows: dbRows,
                p_mode: importMode
              });
              if (!rpcErr && rpcRes && rpcRes.success) {
                rpcSuccess = true;
                importedCount = rpcRes.imported_count ?? importedCount;
                updatedCount = rpcRes.updated_count ?? updatedCount;
                if (rpcRes.skipped_count !== undefined) skippedCount = rpcRes.skipped_count;
              } else if (rpcErr) {
                const errMsg = rpcErr.message || '';
                if (!errMsg.includes('could not find the function') && !errMsg.includes('function public.admin_import_faculty_atomic') && rpcErr.code !== 'PGRST202') {
                  throw new Error(`Atomic Faculty Import failed: ${errMsg}`);
                }
              }
            } catch (rpcEx: any) {
              if (rpcEx.message?.includes('Atomic Faculty Import failed')) {
                throw rpcEx;
              }
            }

            if (!rpcSuccess) {
              const { error: dbError } = await supabase.from('teachers_master').upsert(dbRows, { onConflict: 'faculty_id' });
              if (dbError) {
                throw new Error(`Database upsert error on teachers_master: ${dbError.message}`);
              }
            }
          }

          dataStore.setTeachersMaster(current);
          break;
        }

        case 'departments_branches': {
          const rawRows = rowsToProcess.map(r => ({
            department_code: String(r.data.department_code || '').toUpperCase().trim(),
            department_name: r.data.department_name || '',
            branch_code: String(r.data.branch_code || '').toUpperCase().trim(),
            branch_name: r.data.branch_name || ''
          }));

          if (isSupabaseConfigured && supabase) {
            let rpcSuccess = false;
            try {
              const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_import_departments_branches_atomic', {
                p_rows: rawRows,
                p_mode: importMode
              });
              if (!rpcErr && rpcRes && rpcRes.success) {
                rpcSuccess = true;
                importedCount = rpcRes.imported_count ?? rowsToProcess.length;
                updatedCount = rpcRes.updated_count ?? 0;
              } else if (rpcErr) {
                const errMsg = rpcErr.message || '';
                if (!errMsg.includes('could not find the function') && !errMsg.includes('function public.admin_import_departments_branches_atomic') && rpcErr.code !== 'PGRST202') {
                  throw new Error(`Atomic Departments & Branches Import failed: ${errMsg}`);
                }
              }
            } catch (rpcEx: any) {
              if (rpcEx.message?.includes('Atomic Departments & Branches Import failed')) {
                throw rpcEx;
              }
            }

            if (!rpcSuccess) {
              // Safe batched fallback: upsert unique departments first
              const deptMap = new Map<string, string>();
              rawRows.forEach(r => {
                if (r.department_code) deptMap.set(r.department_code, r.department_name || r.department_code);
              });
              const deptBatch = Array.from(deptMap.entries()).map(([code, name]) => ({ code, name }));
              const { error: deptErr } = await supabase.from('departments').upsert(deptBatch, { onConflict: 'code' });
              if (deptErr) throw new Error(`Database error on departments: ${deptErr.message}`);

              // Query all departments to get IDs in a single query
              const { data: deptData, error: fetchErr } = await supabase.from('departments').select('id, code');
              if (fetchErr) throw new Error(`Failed to resolve department IDs: ${fetchErr.message}`);

              const idMap = new Map<string, string>();
              (deptData || []).forEach((d: any) => idMap.set(d.code.toUpperCase(), d.id));

              // Batch upsert branches
              const branchBatch = rawRows.map(r => ({
                department_id: idMap.get(r.department_code) || null,
                code: r.branch_code,
                name: r.branch_name || r.branch_code
              })).filter(b => b.department_id && b.code);

              const { error: branchErr } = await supabase.from('branches').upsert(branchBatch, { onConflict: 'code' });
              if (branchErr) throw new Error(`Database error on branches: ${branchErr.message}`);

              importedCount = rowsToProcess.length;
            }
          } else {
            rowsToProcess.forEach(r => {
              if (r.isDuplicate) updatedCount++;
              else importedCount++;
            });
          }
          break;
        }

        case 'subjects': {
          const current = [...dataStore.getSubjects()];
          const dbRows: any[] = [];
          const teachers = dataStore.getTeachersMaster();

          rowsToProcess.forEach(r => {
            const scode = String(r.data.subject_code).toUpperCase().trim();
            const existingIdx = current.findIndex(s => (s.subject_code || s.code || '').toUpperCase().trim() === scode);

            let teacherId: string | undefined = undefined;
            if (r.data.teacher_faculty_id) {
              const match = teachers.find(t => t.faculty_id.toUpperCase().trim() === String(r.data.teacher_faculty_id).toUpperCase().trim());
              if (match) teacherId = match.id;
            }

            const subjectObj: any = {
              subject_code: scode,
              subject_name: r.data.subject_name || scode,
              branch: r.data.branch || 'CSE',
              department: r.data.department || r.data.branch || 'CSE',
              semester: Number(r.data.semester) || 1,
              credits: Number(r.data.credits) || 4.0,
              subject_type: r.data.subject_type || 'theory',
              teacher_id: teacherId || null,
              status: r.data.status || 'active'
            };

            if (existingIdx >= 0) {
              if (importMode === 'update_existing') {
                current[existingIdx] = {
                  ...current[existingIdx],
                  subject_code: scode,
                  subject_name: subjectObj.subject_name,
                  branch: subjectObj.branch,
                  semester: subjectObj.semester,
                  teacher_id: teacherId || current[existingIdx].teacher_id
                };
                updatedCount++;
                dbRows.push(subjectObj);
              }
            } else {
              const newId = `sub-imp-${Date.now()}-${r.rowNumber}`;
              current.push({
                id: newId,
                subject_code: scode,
                subject_name: subjectObj.subject_name,
                branch: subjectObj.branch,
                semester: subjectObj.semester,
                teacher_id: teacherId || 'tch-01'
              });
              importedCount++;
              dbRows.push(subjectObj);
            }
          });

          if (isSupabaseConfigured && supabase && dbRows.length > 0) {
            const { error: dbError } = await supabase.from('subjects').upsert(dbRows, { onConflict: 'subject_code' });
            if (dbError) {
              throw new Error(`Database upsert error on subjects: ${dbError.message}`);
            }
          }

          dataStore.setSubjects(current);
          break;
        }

        case 'teacher_subjects': {
          const rawRows = rowsToProcess.map(r => ({
            faculty_id: String(r.data.faculty_id || '').toUpperCase().trim(),
            subject_code: String(r.data.subject_code || '').toUpperCase().trim(),
            semester: Number(r.data.semester) || 1,
            section: String(r.data.section || 'A').toUpperCase().trim(),
            academic_year: r.data.academic_year || '2026-2027'
          }));

          if (isSupabaseConfigured && supabase) {
            let rpcSuccess = false;
            try {
              const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_import_teacher_subjects_atomic', {
                p_rows: rawRows,
                p_mode: importMode
              });
              if (!rpcErr && rpcRes && rpcRes.success) {
                rpcSuccess = true;
                importedCount = rpcRes.imported_count ?? rowsToProcess.length;
                updatedCount = rpcRes.updated_count ?? 0;
              } else if (rpcErr) {
                const errMsg = rpcErr.message || '';
                if (!errMsg.includes('could not find the function') && !errMsg.includes('function public.admin_import_teacher_subjects_atomic') && rpcErr.code !== 'PGRST202') {
                  throw new Error(`Atomic Teacher Subjects Import failed: ${errMsg}`);
                }
              }
            } catch (rpcEx: any) {
              if (rpcEx.message?.includes('Atomic Teacher Subjects Import failed')) {
                throw rpcEx;
              }
            }

            if (!rpcSuccess) {
              // Single-statement batch insertion fallback
              const teachers = dataStore.getTeachersMaster();
              const subjects = dataStore.getSubjects();
              const dbRows = rawRows.map(r => {
                const tMatch = teachers.find(t => t.faculty_id.toUpperCase().trim() === r.faculty_id);
                const sMatch = subjects.find(s => (s.subject_code || s.code || '').toUpperCase().trim() === r.subject_code);
                return {
                  teacher_id: tMatch?.id || r.faculty_id,
                  subject_id: sMatch?.id || r.subject_code,
                  semester: r.semester,
                  section: r.section,
                  academic_year: r.academic_year,
                  status: 'active'
                };
              });

              const { error: dbError } = await supabase.from('teacher_subjects').upsert(dbRows, { onConflict: 'teacher_id,subject_id' });
              if (dbError) throw new Error(`Database error on teacher_subjects: ${dbError.message}`);
              importedCount = rowsToProcess.length;
            }
          } else {
            rowsToProcess.forEach(r => {
              if (r.isDuplicate) updatedCount++;
              else importedCount++;
            });
          }
          break;
        }

        case 'timetable': {
          const current = [...dataStore.getTimetable()];
          const dbRows: any[] = [];
          const subjects = dataStore.getSubjects();
          const teachers = dataStore.getTeachersMaster();

          rowsToProcess.forEach(r => {
            const scode = String(r.data.subject_code).toUpperCase().trim();
            const fid = String(r.data.faculty_id).toUpperCase().trim();
            const sub = subjects.find(s => (s.subject_code || s.code || '').toUpperCase() === scode);
            const tch = teachers.find(t => t.faculty_id.toUpperCase() === fid);

            const startMin = parseTimeToMinutes(r.data.start_time) || 570;
            const endMin = parseTimeToMinutes(r.data.end_time) || 625;

            const slotObj = {
              department: r.data.branch || 'CSE',
              branch: r.data.branch || 'CSE',
              semester: Number(r.data.semester) || 1,
              section: r.data.section || 'A',
              day: r.data.day || 'Monday',
              start_time: r.data.start_time,
              end_time: r.data.end_time,
              start_hour_24: Math.floor(startMin / 60),
              start_minute: startMin % 60,
              end_hour_24: Math.floor(endMin / 60),
              end_minute: endMin % 60,
              subject_code: scode,
              subject_name: sub?.subject_name || sub?.name || scode,
              teacher_id: fid,
              teacher_name: tch?.name || tch?.full_name || 'Faculty',
              room_number: r.data.room || 'LH-101'
            };

            const newId = `tt-imp-${Date.now()}-${r.rowNumber}`;
            current.push({
              id: newId,
              branch: slotObj.branch,
              semester: slotObj.semester,
              section: slotObj.section,
              day: slotObj.day as any,
              start_time: slotObj.start_time,
              end_time: slotObj.end_time,
              start_hour_24: slotObj.start_hour_24,
              start_minute: slotObj.start_minute,
              end_hour_24: slotObj.end_hour_24,
              end_minute: slotObj.end_minute,
              subject_code: slotObj.subject_code,
              subject_name: slotObj.subject_name,
              teacher_id: slotObj.teacher_id,
              teacher_name: slotObj.teacher_name,
              room_number: slotObj.room_number
            });

            importedCount++;
            dbRows.push(slotObj);
          });

          if (isSupabaseConfigured && supabase && dbRows.length > 0) {
            const { error: dbError } = await supabase.from('timetable').insert(dbRows);
            if (dbError) {
              throw new Error(`Database insert error on timetable: ${dbError.message}`);
            }
          }

          dataStore.setTimetable(current);
          break;
        }

        case 'attendance': {
          const current = [...dataStore.getAttendance()];
          const dbRows: any[] = [];
          const students = dataStore.getStudentsMaster();
          const subjects = dataStore.getSubjects();

          for (const r of rowsToProcess) {
            const roll = String(r.data.roll_no).toUpperCase().trim();
            const scode = String(r.data.subject_code).toUpperCase().trim();
            const dateStr = String(r.data.date).trim();

            const sMatch = students.find(s => s.roll_no.toUpperCase() === roll);
            const subMatch = subjects.find(s => (s.subject_code || s.code || '').toUpperCase() === scode);
            const studentUuid = sMatch?.id || roll;
            const subjectUuid = subMatch?.id || scode;

            const attRecord = {
              student_id: studentUuid,
              subject_id: subjectUuid,
              date: dateStr,
              status: r.data.status || 'Present'
            };

            const existingIdx = current.findIndex(a => 
              a.student_id === studentUuid && 
              a.subject_id === subjectUuid && 
              a.date === dateStr
            );

            if (existingIdx >= 0) {
              if (importMode === 'update_existing') {
                current[existingIdx] = { ...current[existingIdx], status: attRecord.status as any };
                updatedCount++;
                dbRows.push(attRecord);
              }
            } else {
              current.push({
                id: `att-imp-${Date.now()}-${r.rowNumber}`,
                student_id: studentUuid,
                student_roll: roll,
                subject_id: subjectUuid,
                subject_code: scode,
                date: dateStr,
                status: attRecord.status as any
              });
              importedCount++;
              dbRows.push(attRecord);
            }
          }

          if (isSupabaseConfigured && supabase && dbRows.length > 0) {
            const { error: dbError } = await supabase.from('attendance').upsert(dbRows, { onConflict: 'student_id,subject_id,date' });
            if (dbError) {
              throw new Error(`Database upsert error on attendance: ${dbError.message}`);
            }
          }

          dataStore.setAttendance(current);
          break;
        }

        case 'sessional_marks': {
          const current = [...dataStore.getSessionalResults()];
          const dbRows: any[] = [];
          const students = dataStore.getStudentsMaster();
          const subjects = dataStore.getSubjects();

          for (const r of rowsToProcess) {
            const roll = String(r.data.roll_no).toUpperCase().trim();
            const scode = String(r.data.subject_code).toUpperCase().trim();
            const st = students.find(s => s.roll_no.toUpperCase() === roll);
            const sub = subjects.find(s => (s.subject_code || s.code || '').toUpperCase() === scode);

            const studentUuid = st?.id || roll;
            const marksObt = Number(r.data.marks_obtained) || 0;
            const maxM = Number(r.data.max_marks) || 25;
            const pct = Math.round((marksObt / maxM) * 100);

            const sessionalObj = {
              student_id: studentUuid,
              student_roll: roll,
              student_name: st?.name || 'Student',
              subject_name: sub?.subject_name || sub?.name || scode,
              subject_code: scode,
              exam_type: (r.data.exam_type || 'Sessional 1') as ('Sessional 1' | 'Sessional 2'),
              marks_obtained: marksObt,
              max_marks: maxM,
              percentage: pct,
              semester: Number(r.data.semester) || st?.semester || 1,
              branch: st?.branch || 'CSE',
              is_published: true,
              remarks: r.data.exam_name || 'Imported Sessional'
            };

            const existingIdx = current.findIndex(sr => 
              sr.student_roll.toUpperCase() === roll &&
              sr.subject_code && sr.subject_code.toUpperCase() === scode &&
              sr.exam_type === sessionalObj.exam_type
            );

            if (existingIdx >= 0) {
              if (importMode === 'update_existing') {
                current[existingIdx] = { ...current[existingIdx], ...sessionalObj };
                updatedCount++;
                dbRows.push(sessionalObj);
              }
            } else {
              current.push({
                id: `sess-imp-${Date.now()}-${r.rowNumber}`,
                ...sessionalObj
              });
              importedCount++;
              dbRows.push(sessionalObj);
            }
          }

          if (isSupabaseConfigured && supabase && dbRows.length > 0) {
            const { error: dbError } = await supabase.from('sessional_results').insert(dbRows);
            if (dbError) {
              throw new Error(`Database insert error on sessional_results: ${dbError.message}`);
            }
          }

          dataStore.setSessionalResults(current);
          break;
        }

        case 'results_grades': {
          const current = [...dataStore.getAcademicRecords()];
          const dbRows: any[] = [];
          const students = dataStore.getStudentsMaster();
          const subjects = dataStore.getSubjects();

          for (const r of rowsToProcess) {
            const roll = String(r.data.roll_no).toUpperCase().trim();
            const scode = String(r.data.subject_code).toUpperCase().trim();
            const sem = Number(r.data.semester) || 1;
            const st = students.find(s => s.roll_no.toUpperCase() === roll);
            const sub = subjects.find(s => (s.subject_code || s.code || '').toUpperCase() === scode);

            const studentUuid = st?.id || roll;
            const subjectUuid = sub?.id;

            const gradeObj = {
              student_id: studentUuid,
              subject_id: subjectUuid || null,
              subject_code: scode,
              subject_name: sub?.subject_name || sub?.name || scode,
              semester: sem,
              credits: Number(r.data.credits) || 4.0,
              letter_grade: String(r.data.grade).toUpperCase() as any,
              grade_point: Number(r.data.grade_point) || 0,
              marks: (Number(r.data.grade_point) || 0) * 10
            };

            const existingIdx = current.findIndex(ar => 
              ar.student_id === studentUuid && 
              ar.semester === sem
            );

            if (existingIdx >= 0) {
              if (importMode === 'update_existing') {
                current[existingIdx] = {
                  ...current[existingIdx],
                  grade: gradeObj.letter_grade,
                  grade_point: gradeObj.grade_point
                };
                updatedCount++;
                dbRows.push(gradeObj);
              }
            } else {
              current.push({
                id: `grd-imp-${Date.now()}-${r.rowNumber}`,
                student_id: studentUuid,
                semester: sem,
                subject_id: subjectUuid,
                marks: gradeObj.marks,
                grade: gradeObj.letter_grade,
                grade_point: gradeObj.grade_point
              });
              importedCount++;
              dbRows.push(gradeObj);
            }
          }

          if (isSupabaseConfigured && supabase && dbRows.length > 0) {
            const { error: dbError } = await supabase.from('grades').insert(dbRows);
            if (dbError) {
              throw new Error(`Database insert error on grades: ${dbError.message}`);
            }
          }

          dataStore.setAcademicRecords(current);
          break;
        }

        case 'syllabus': {
          const current = [...dataStore.getSyllabus()];
          const dbRows: any[] = [];
          const subjects = dataStore.getSubjects();

          for (const r of rowsToProcess) {
            const scode = String(r.data.subject_code).toUpperCase().trim();
            const sub = subjects.find(s => (s.subject_code || s.code || '').toUpperCase() === scode);
            const subjectUuid = sub?.id;

            const sylObj = {
              branch: r.data.branch || 'CSE',
              semester: Number(r.data.semester) || 1,
              subject_id: subjectUuid || null,
              title: r.data.title || `${scode} Syllabus`,
              description: r.data.description || '',
              academic_year: r.data.academic_year || '2026-2027',
              file_url: r.data.document_url || ''
            };

            const newId = `syl-imp-${Date.now()}-${r.rowNumber}`;
            current.push({
              id: newId,
              branch: sylObj.branch,
              semester: sylObj.semester,
              subject_id: subjectUuid || 'sub-01',
              title: sylObj.title,
              file_url: sylObj.file_url,
              created_at: new Date().toISOString()
            });

            importedCount++;
            dbRows.push(sylObj);
          }

          if (isSupabaseConfigured && supabase && dbRows.length > 0) {
            const { error: dbError } = await supabase.from('syllabus').insert(dbRows);
            if (dbError) {
              throw new Error(`Database insert error on syllabus: ${dbError.message}`);
            }
          }

          dataStore.setSyllabus(current);
          break;
        }

        case 'pyqs': {
          const current = [...dataStore.getPyqs()];
          const dbRows: any[] = [];
          const subjects = dataStore.getSubjects();

          for (const r of rowsToProcess) {
            const scode = String(r.data.subject_code).toUpperCase().trim();
            const sub = subjects.find(s => (s.subject_code || s.code || '').toUpperCase() === scode);
            const subjectUuid = sub?.id;

            const pyqObj = {
              branch: r.data.branch || 'CSE',
              semester: Number(r.data.semester) || 1,
              subject_id: subjectUuid || null,
              year: Number(r.data.year) || 2025,
              exam_type: r.data.exam_type || 'End Semester',
              title: r.data.title || `${scode} PYQ`,
              file_url: r.data.document_url || '',
              description: r.data.description || ''
            };

            const newId = `pyq-imp-${Date.now()}-${r.rowNumber}`;
            current.push({
              id: newId,
              subject_id: subjectUuid || 'sub-01',
              semester: pyqObj.semester,
              year: pyqObj.year,
              exam_type: pyqObj.exam_type as any,
              file_url: pyqObj.file_url,
              created_at: new Date().toISOString()
            });

            importedCount++;
            dbRows.push(pyqObj);
          }

          if (isSupabaseConfigured && supabase && dbRows.length > 0) {
            const { error: dbError } = await supabase.from('pyqs').insert(dbRows);
            if (dbError) {
              throw new Error(`Database insert error on pyqs: ${dbError.message}`);
            }
          }

          dataStore.setPyqs(current);
          break;
        }
      }
    } catch (err: any) {
      console.error('Import execution error:', err);
      // TRANSACTION FAILURE ROLLBACK:
      // Revert in-memory and persisted local state to exact pre-import consistent state
      dataStore.restoreEntitySnapshot(entityType, preImportSnapshot);
      // Reset counters so uncommitted rows are never counted as successful
      importedCount = 0;
      updatedCount = 0;

      errors.push({
        id: `err-${Date.now()}-fatal`,
        job_id: jobId,
        row_number: 0,
        field_name: 'database_transaction',
        error_message: `Transaction failed and was safely rolled back: ${err.message || 'Execution error'}`,
        created_at: new Date().toISOString()
      });
    }

    // Determine final status
    let finalStatus: 'Completed' | 'Completed with warnings' | 'Failed' = 'Completed';
    if (errors.length > 0) {
      if (importedCount === 0 && updatedCount === 0) {
        finalStatus = 'Failed';
      } else {
        finalStatus = 'Completed with warnings';
      }
    }

    const jobRecord: ImportJob = {
      id: jobId,
      file_name: fileName || `${entityType}_data.csv`,
      target_entity: entityType,
      import_mode: importMode,
      total_rows: validatedRows.length,
      successful_rows: importedCount,
      updated_rows: updatedCount,
      skipped_rows: skippedCount,
      failed_rows: errors.length,
      imported_by: importedBy,
      imported_by_name: importedByName,
      status: finalStatus,
      created_at: new Date().toISOString()
    };

    // Save to local dataStore
    dataStore.addImportJob(jobRecord);
    if (errors.length > 0) {
      dataStore.setImportErrors(errors);
    }

    // Save to Supabase audit tables if connected
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('import_jobs').insert([{
          id: jobId.startsWith('JOB-') ? undefined : jobId, // Supabase uses UUID for ID if not overridden
          file_name: jobRecord.file_name,
          target_entity: entityType,
          import_mode: importMode,
          total_rows: jobRecord.total_rows,
          successful_rows: jobRecord.successful_rows,
          updated_rows: jobRecord.updated_rows || 0,
          skipped_rows: jobRecord.skipped_rows || 0,
          failed_rows: jobRecord.failed_rows,
          imported_by_name: importedByName,
          status: finalStatus
        }]);

        if (errors.length > 0) {
          // If job was saved to supabase, we can insert errors (omitting if foreign key is strict UUID)
        }
      } catch (logErr) {
        console.warn('Could not write import job to Supabase audit log, retained in local memory:', logErr);
      }
    }

    return {
      jobId,
      totalRows: validatedRows.length,
      importedCount,
      updatedCount,
      skippedCount,
      failedCount: errors.length,
      status: finalStatus,
      errors
    };
  },

  async getImportAuditJobs(): Promise<ImportJob[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('import_jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as ImportJob[];
        }
      } catch (err) {
        console.warn('Supabase getImportAuditJobs error, using local jobs:', err);
      }
    }
    return dataStore.getImportJobs();
  },

  async getImportJobErrors(jobId: string): Promise<ImportError[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('import_errors')
          .select('*')
          .eq('job_id', jobId)
          .order('row_number', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as ImportError[];
        }
      } catch (err) {
        console.warn('Supabase getImportJobErrors error, using local errors:', err);
      }
    }
    return dataStore.getImportErrors(jobId);
  },

  // =============================================================================
  // SMART BOARD TEACHING & SYLLABUS SYNC (Sections 39-47)
  // =============================================================================
  async getSmartBoardLessons(params?: { 
    teacherId?: string; 
    department?: string; 
    subjectId?: string; 
    semester?: number 
  }): Promise<SmartBoardLesson[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('smartboard_lessons').select('*').order('created_at', { ascending: false });
        if (params?.teacherId) query = query.eq('teacher_id', params.teacherId);
        if (params?.department) query = query.eq('department', params.department);
        if (params?.subjectId) query = query.eq('subject_id', params.subjectId);
        if (params?.semester) query = query.eq('semester', params.semester);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as SmartBoardLesson[];
        }
      } catch (err) {
        console.warn('Supabase getSmartBoardLessons error, using local data:', err);
      }
    }

    let lessons = dataStore.getSmartBoardLessons();
    if (params?.teacherId) lessons = lessons.filter(l => l.teacher_id === params.teacherId);
    if (params?.department) lessons = lessons.filter(l => l.department === params.department);
    if (params?.subjectId) lessons = lessons.filter(l => l.subject_id === params.subjectId);
    if (params?.semester) lessons = lessons.filter(l => l.semester === params.semester);
    return lessons;
  },

  async createSmartBoardLesson(lesson: Partial<SmartBoardLesson>): Promise<SmartBoardLesson> {
    const newLesson: SmartBoardLesson = {
      id: lesson.id || `sb-${Date.now()}`,
      teacher_id: lesson.teacher_id || 'FAC001',
      teacher_name: lesson.teacher_name || 'Faculty Member',
      subject_id: lesson.subject_id || 'sub-01',
      subject_name: lesson.subject_name || 'Subject',
      subject_code: lesson.subject_code || 'CS-01',
      department: lesson.department || 'CSE',
      semester: lesson.semester || 6,
      section: lesson.section || 'A',
      room_number: lesson.room_number || 'LH-301',
      class_date: lesson.class_date || new Date().toISOString().slice(0, 10),
      start_time: lesson.start_time || '10:00',
      end_time: lesson.end_time || '10:50',
      duration_minutes: lesson.duration_minutes || 50,
      unit: lesson.unit || 'Unit 1',
      topic: lesson.topic || 'Class Topic',
      syllabus_topic_id: lesson.syllabus_topic_id,
      lesson_file_url: lesson.lesson_file_url,
      file_name: lesson.file_name,
      file_type: lesson.file_type || 'pdf',
      notes_summary: lesson.notes_summary || '',
      ai_summary: lesson.ai_summary,
      ai_learning_objectives: lesson.ai_learning_objectives || [],
      ai_keywords: lesson.ai_keywords || [],
      ai_recommended_next_topic: lesson.ai_recommended_next_topic,
      ai_summary_status: lesson.ai_summary_status || 'not_requested',
      sync_status: 'Synced',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('smartboard_lessons').insert([newLesson]);
      } catch (err) {
        console.warn('Supabase createSmartBoardLesson insert error, saving locally:', err);
      }
    }

    dataStore.addSmartBoardLesson(newLesson);
    return newLesson;
  },

  // =============================================================================
  // CAMPUS PRESENCE & LOCATION TRACKER (Sections 48-51)
  // =============================================================================
  async getCampusZones(): Promise<CampusZone[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('campus_zones').select('*');
        if (!error && data && data.length > 0) {
          return data as CampusZone[];
        }
      } catch (err) {
        console.warn('Supabase getCampusZones error, using local zones:', err);
      }
    }
    return dataStore.getCampusZones();
  },

  async getCampusPresence(params?: { department?: string; studentId?: string }): Promise<CampusPresenceRecord[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('campus_presence').select('*').order('updated_at', { ascending: false });
        if (params?.department) query = query.eq('department', params.department);
        if (params?.studentId) query = query.eq('student_id', params.studentId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as CampusPresenceRecord[];
        }
      } catch (err) {
        console.warn('Supabase getCampusPresence error, using local presence records:', err);
      }
    }

    let records = dataStore.getCampusPresence();
    if (params?.department) records = records.filter(r => r.department === params.department);
    if (params?.studentId) records = records.filter(r => r.student_id === params.studentId);
    return records;
  },

  // =============================================================================
  // PUBLIC VERIFICATION & OPERATIONAL MODULES (Sections 7.10, 7.16 - 7.20)
  // =============================================================================
  async verifyHallTicketPublic(token: string): Promise<any> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('rpc_verify_hall_ticket', { p_token: token });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase rpc_verify_hall_ticket error, fallback:', err);
      }
    }
    return {
      is_valid: true,
      student_name: 'Aarav Sharma',
      roll_number: 'CSE001',
      department: 'Computer Science & Engineering',
      semester: 6,
      academic_year: '2025-2026',
      exam_name: 'End Semester Examination May-June 2026',
      issued_at: '2026-05-10T10:00:00Z'
    };
  },

  async verifyCertificatePublic(token: string): Promise<any> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('rpc_verify_event_certificate', { p_token: token });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase rpc_verify_event_certificate error, fallback:', err);
      }
    }
    return {
      is_valid: true,
      certificate_number: 'HIET/HACK/2026/042',
      recipient_name: 'Aarav Sharma',
      roll_number: 'CSE001',
      department: 'Computer Science & Engineering',
      event_name: 'HIET National Smart Campus Hackathon 2026',
      event_date: '2026-04-18',
      issued_at: '2026-04-19T14:30:00Z'
    };
  },

  async verifyGatePassScan(token: string, gateName = 'Main Gate', action = 'exit'): Promise<any> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('rpc_verify_gate_pass', {
          p_token: token,
          p_gate_name: gateName,
          p_action: action
        });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase rpc_verify_gate_pass error:', err);
      }
    }
    return { success: true, status: 'processed', action };
  },

  async runComplaintSlaEscalation(): Promise<any> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('rpc_run_complaint_sla_escalation');
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase rpc_run_complaint_sla_escalation error:', err);
      }
    }
    return { success: true, escalated_tickets: 0 };
  }
};

export const executeDataImport = apiService.executeDataImport.bind(apiService);
export const fetchImportValidationContext = apiService.fetchImportValidationContext.bind(apiService);
export const getImportAuditJobs = apiService.getImportAuditJobs.bind(apiService);
export const getImportJobErrors = apiService.getImportJobErrors.bind(apiService);


