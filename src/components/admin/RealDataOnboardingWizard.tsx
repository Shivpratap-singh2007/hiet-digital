import React from 'react';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Network, 
  UserCheck, 
  Award, 
  CalendarClock, 
  FileText, 
  Mail, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ImportEntityType, ImportJob } from '../../types';
import { ValidationMasterContext } from '../../lib/importValidation';

export interface WizardStepDefinition {
  stepNumber: number;
  id: ImportEntityType;
  title: string;
  description: string;
  prerequisite?: string;
  icon: React.ComponentType<{ className?: string }>;
  recommendedPilotCount: string;
}

const WIZARD_STEPS: WizardStepDefinition[] = [
  {
    stepNumber: 1,
    id: 'departments',
    title: 'Create Departments',
    description: 'Register college academic departments (e.g., CSE, ECE, ME, CE, AS&H) and branch codes.',
    icon: Building2,
    recommendedPilotCount: '1-2 departments (e.g. CSE)'
  },
  {
    stepNumber: 2,
    id: 'faculty',
    title: 'Import Faculty Master',
    description: 'Onboard verified faculty records with employee codes, designations, and department linkages.',
    prerequisite: 'Requires Step 1 (Departments)',
    icon: Users,
    recommendedPilotCount: '3–5 faculty members'
  },
  {
    stepNumber: 3,
    id: 'students',
    title: 'Import Students Master',
    description: 'Import student enrollment records with unique roll numbers, semesters, and sections.',
    prerequisite: 'Requires Step 1 (Departments)',
    icon: GraduationCap,
    recommendedPilotCount: '10–20 students (1 Section)'
  },
  {
    stepNumber: 4,
    id: 'subjects',
    title: 'Import Subjects Catalog',
    description: 'Configure academic subjects, syllabus codes, credits, and semester course catalogs.',
    prerequisite: 'Requires Step 1 (Departments)',
    icon: BookOpen,
    recommendedPilotCount: '4–5 core subjects'
  },
  {
    stepNumber: 5,
    id: 'teacher_subjects',
    title: 'Map Faculty to Subjects',
    description: 'Link subject offerings to verified faculty instructors per semester and section.',
    prerequisite: 'Requires Step 2 (Faculty) & Step 4 (Subjects)',
    icon: Network,
    recommendedPilotCount: '4–5 teaching assignments'
  },
  {
    stepNumber: 6,
    id: 'class_incharge',
    title: 'Assign Class In-Charges',
    description: 'Designate primary faculty in-charges for sections (1 active in-charge per class/semester).',
    prerequisite: 'Requires Step 2 (Faculty) & Step 3 (Students)',
    icon: UserCheck,
    recommendedPilotCount: '1 in-charge for pilot section'
  },
  {
    stepNumber: 7,
    id: 'hod_assignment',
    title: 'Assign Department HODs',
    description: 'Appoint Heads of Department with verified effective dates while preserving faculty roles.',
    prerequisite: 'Requires Step 1 (Departments) & Step 2 (Faculty)',
    icon: Award,
    recommendedPilotCount: '1 HOD for pilot department'
  },
  {
    stepNumber: 8,
    id: 'timetable',
    title: 'Import Timetable Schedule',
    description: 'Establish weekly lecture slots, classroom locations, GPS geofences, and time bounds.',
    prerequisite: 'Requires Step 4 (Subjects) & Step 5 (Faculty Mapping)',
    icon: CalendarClock,
    recommendedPilotCount: '1 week schedule for 1 section'
  },
  {
    stepNumber: 9,
    id: 'syllabus',
    title: 'Import Syllabus & Units',
    description: 'Upload unit-by-unit syllabus outlines, course outcomes, and reference curriculum materials.',
    prerequisite: 'Requires Step 4 (Subjects)',
    icon: FileText,
    recommendedPilotCount: 'Units for 4–5 pilot subjects'
  },
  {
    stepNumber: 10,
    id: 'user_invitations',
    title: 'Invite / Create User Accounts',
    description: 'Issue secure activation invitations via email for verified students and faculty. No passwords in CSV.',
    prerequisite: 'Requires Step 2 (Faculty) & Step 3 (Students)',
    icon: Mail,
    recommendedPilotCount: 'Send invites to pilot cohort'
  },
  {
    stepNumber: 11,
    id: 'attendance',
    title: 'Run Pilot Verification',
    description: 'Test attendance taking, timetable display, leave submissions, and marks entry with pilot cohort.',
    prerequisite: 'All preceding steps',
    icon: ShieldCheck,
    recommendedPilotCount: '1-2 trial test sessions'
  }
];

interface RealDataOnboardingWizardProps {
  onSelectModule: (module: ImportEntityType) => void;
  context: ValidationMasterContext | null;
  recentJobs: ImportJob[];
  onOpenDemoManagement?: () => void;
}

export const RealDataOnboardingWizard: React.FC<RealDataOnboardingWizardProps> = ({
  onSelectModule,
  context,
  recentJobs,
  onOpenDemoManagement
}) => {
  const getStepMetrics = (stepId: ImportEntityType) => {
    let count = 0;
    if (context) {
      switch (stepId) {
        case 'departments':
        case 'departments_branches':
          count = context.departmentsSet?.size || 0;
          break;
        case 'faculty':
          count = context.facultyMap?.size || 0;
          break;
        case 'students':
          count = context.studentsMap?.size || 0;
          break;
        case 'subjects':
          count = context.subjectsMap?.size || 0;
          break;
        case 'teacher_subjects':
          count = context.teacherSubjectSet?.size || 0;
          break;
        case 'class_incharge':
          count = context.classInchargeSet?.size || 0;
          break;
        case 'hod_assignment':
          count = context.hodAssignmentsSet?.size || 0;
          break;
        case 'timetable':
          count = context.timetableSlots?.length || 0;
          break;
        case 'syllabus':
          count = 0; // counted if available
          break;
        case 'user_invitations':
          count = context.userEmailsSet?.size || 0;
          break;
        case 'attendance':
          count = context.attendanceSet?.size || 0;
          break;
      }
    }

    const lastJob = recentJobs.find(j => j.target_entity === stepId);
    let status: 'Not Started' | 'In Progress' | 'Completed' | 'Needs Attention' = 'Not Started';

    if (lastJob) {
      if (lastJob.status === 'Completed' || lastJob.status === 'completed') {
        status = 'Completed';
      } else if (lastJob.status === 'Failed' || lastJob.status === 'failed' || lastJob.status === 'rolled_back' || lastJob.status === 'validation_failed') {
        status = 'Needs Attention';
      } else {
        status = 'In Progress';
      }
    } else if (count > 0) {
      status = 'Completed';
    }

    return {
      count,
      status,
      lastImportTime: lastJob?.created_at ? new Date(lastJob.created_at).toLocaleDateString() : null,
      failedRows: lastJob?.failed_rows || 0
    };
  };

  const completedSteps = WIZARD_STEPS.filter(s => getStepMetrics(s.id).status === 'Completed').length;
  const progressPercent = Math.round((completedSteps / WIZARD_STEPS.length) * 100);

  return (
    <div className="space-y-6">
      {/* Pilot Cohort Recommendation Card */}
      <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/80 via-blue-50/40 to-slate-50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Staged Rollout Strategy</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Principal Guidance: Launch with a Pilot Cohort
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              Do not attempt importing the entire college at once. We strongly advise piloting with a single focused cohort:
              <strong className="text-indigo-600 dark:text-indigo-400 font-semibold"> CSE Department, 6th Semester, Section A (10–20 Students, 3–5 Faculty, 4–5 Subjects)</strong>.
              This allows you to verify timetables, geofenced attendance, and role permissions safely before rolling out campus-wide.
            </p>
          </div>
          {onOpenDemoManagement && (
            <div className="shrink-0 flex items-center">
              <button
                onClick={onOpenDemoManagement}
                className="px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold text-xs transition shadow-sm"
              >
                Demo Data Management
              </button>
            </div>
          )}
        </div>

        {/* Progress Tracker Bar */}
        <div className="mt-5 pt-4 border-t border-indigo-100 dark:border-indigo-950/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <span>Onboarding Progress: {completedSteps} of {WIZARD_STEPS.length} Steps Completed</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Guided Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {WIZARD_STEPS.map((step) => {
          const Icon = step.icon;
          const { count, status, lastImportTime, failedRows } = getStepMetrics(step.id);

          const statusStyles = {
            'Completed': 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            'In Progress': 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
            'Needs Attention': 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
            'Not Started': 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          };

          return (
            <div 
              key={step.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition flex flex-col justify-between"
            >
              <div>
                {/* Step Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60">
                      {step.stepNumber}
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusStyles[status]}`}>
                    {status}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {step.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {step.description}
                </p>

                {step.prerequisite && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                    ⚠️ {step.prerequisite}
                  </p>
                )}
              </div>

              {/* Step Footer / Metrics */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Current Records:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {count} {count === 1 ? 'record' : 'records'}
                  </span>
                </div>

                {lastImportTime && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 inline" />
                      <span>Last import:</span>
                    </span>
                    <span>{lastImportTime}</span>
                  </div>
                )}

                {failedRows > 0 && (
                  <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                    {failedRows} validation error(s) flagged
                  </div>
                )}

                <div className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 bg-indigo-50/50 dark:bg-indigo-950/20 p-2 rounded-lg">
                  <span className="font-medium">Pilot:</span> {step.recommendedPilotCount}
                </div>

                <button
                  onClick={() => onSelectModule(step.id)}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
                >
                  <span>Open {step.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
