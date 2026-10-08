import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  Database,
  RefreshCw,
  History,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  Info,
  ChevronRight,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  Users,
  Briefcase,
  Layers,
  Award,
  Calendar,
  FileText,
  FileQuestion,
  Check,
  AlertCircle,
  Building2,
  UserCheck,
  Mail,
  Compass,
  X,
  Lock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { ImportJob, ImportError, ImportEntityType } from '../../types';
import { apiService } from '../../lib/supabase';
import { 
  IMPORT_MODULE_CONFIGS, 
  downloadImportTemplate, 
  downloadFailedRowsCsv 
} from '../../lib/importTemplates';
import { 
  validateImportBatch, 
  ValidationMasterContext, 
  ValidationSummary 
} from '../../lib/importValidation';
import { RealDataOnboardingWizard } from './RealDataOnboardingWizard';
import { DemoDataManagementModal } from './DemoDataManagementModal';
import { isProduction } from '../../lib/envConfig';

const MODULE_ICONS: Record<ImportEntityType, React.ElementType> = {
  departments: Building2,
  departments_branches: Layers,
  faculty: Briefcase,
  students: GraduationCap,
  subjects: BookOpen,
  teacher_subjects: Users,
  class_incharge: UserCheck,
  hod_assignment: Award,
  timetable: Calendar,
  syllabus: FileSpreadsheet,
  sessional_marks: FileText,
  results_grades: Award,
  attendance: CalendarCheck,
  calendar: Calendar,
  notices: FileText,
  pyqs: FileQuestion,
  user_invitations: Mail
};

export const MasterDataImportView: React.FC = () => {
  const { user, role } = useAuth();

  // Active top tab: wizard | import | audit
  const [activeTab, setActiveTab] = useState<'wizard' | 'import' | 'audit'>('wizard');

  // Selected Entity Module
  const [selectedEntity, setSelectedEntity] = useState<ImportEntityType>('students');
  const [importMode, setImportMode] = useState<'create_only' | 'update_existing'>('create_only');

  // File Upload & Parse State
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isDryRunSuccess, setIsDryRunSuccess] = useState(false);
  const [dryRunToken, setDryRunToken] = useState<string | null>(null);

  // Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [hasAcknowledgedSafety, setHasAcknowledgedSafety] = useState(false);

  // Demo Data Management Modal State
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    jobId: string;
    totalRows: number;
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
    failedCount: number;
    status: ImportJob['status'];
    errors: ImportError[];
  } | null>(null);

  // Audit Logs State
  const [auditJobs, setAuditJobs] = useState<ImportJob[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [selectedAuditJob, setSelectedAuditJob] = useState<ImportJob | null>(null);
  const [auditErrors, setAuditErrors] = useState<ImportError[]>([]);

  // Master Reference Data Cache for in-browser instant validation
  const [validationContext, setValidationContext] = useState<ValidationMasterContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadValidationContext = useCallback(async () => {
    setIsLoadingContext(true);
    try {
      const ctx = await apiService.fetchImportValidationContext();
      setValidationContext(ctx);
    } catch (e: any) {
      console.warn('Failed to load validation master context:', e);
    } finally {
      setIsLoadingContext(false);
    }
  }, []);

  const loadAuditJobs = useCallback(async () => {
    setIsLoadingAudit(true);
    try {
      const jobs = await apiService.getImportAuditJobs();
      setAuditJobs(jobs);
    } catch (e) {
      console.warn('Failed to load audit jobs:', e);
    } finally {
      setIsLoadingAudit(false);
    }
  }, []);

  // Pre-load reference validation context on mount
  useEffect(() => {
    loadValidationContext();
    loadAuditJobs();
  }, [loadValidationContext, loadAuditJobs]);

  const handleSelectAuditJob = async (job: ImportJob) => {
    setSelectedAuditJob(job);
    try {
      const errs = await apiService.getImportJobErrors(job.id);
      setAuditErrors(errs);
    } catch (e) {
      console.warn('Failed to fetch errors for job:', e);
      setAuditErrors([]);
    }
  };

  // Switch Module
  const handleSelectModule = (entity: ImportEntityType) => {
    setSelectedEntity(entity);
    handleResetWorkflow();
    setActiveTab('import');
  };

  const handleResetWorkflow = () => {
    setFileName('');
    setFileSize('');
    setRawRows([]);
    setValidationSummary(null);
    setIsDryRunSuccess(false);
    setDryRunToken(null);
    setImportResult(null);
    setErrorMessage(null);
    setIsConfirmModalOpen(false);
    setHasAcknowledgedSafety(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Template Download
  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    downloadImportTemplate(selectedEntity, format);
  };

  // File Upload & Parse
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setImportResult(null);
    setIsDryRunSuccess(false);
    setDryRunToken(null);

    // Limit check: 5MB maximum
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds 5MB limit. Please upload files under 5MB.');
      return;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExt || '')) {
      setErrorMessage('Invalid file format. Please upload a CSV or XLSX file.');
      return;
    }

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const parsed: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!parsed || parsed.length === 0) {
          setErrorMessage('This file contains no records. Please ensure your sheet has data below the header row.');
          setRawRows([]);
          setValidationSummary(null);
          return;
        }

        setRawRows(parsed);
        // Automatically validate preview
        runValidation(parsed, selectedEntity);
      } catch (err: any) {
        setErrorMessage(`Failed to parse file: ${err.message || 'Corrupted or unsupported format'}`);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Run Validation (Dry run / Preview)
  const runValidation = (rows: Record<string, any>[], entity: ImportEntityType) => {
    setIsValidating(true);
    setErrorMessage(null);

    // Use current or empty context
    const ctx: ValidationMasterContext = validationContext || {
      studentsMap: new Map(),
      facultyMap: new Map(),
      departmentsSet: new Set(['CSE', 'ECE', 'ME', 'CE', 'AS&H']),
      branchesSet: new Set(['CSE', 'CSE AI/ML', 'ECE', 'ME', 'CE']),
      subjectsMap: new Map(),
      timetableSlots: [],
      attendanceSet: new Set(),
      teacherSubjectSet: new Set(),
      gradesSet: new Set()
    };

    try {
      const summary = validateImportBatch(entity, rows, ctx);
      setValidationSummary(summary);
      
      // If 0 invalid rows, dry run passes and produces token
      if (summary.invalidCount === 0) {
        setIsDryRunSuccess(true);
        setDryRunToken(`CONFIRM_DRYRUN_${Date.now()}`);
      } else {
        setIsDryRunSuccess(false);
        setDryRunToken(null);
      }
    } catch (e: any) {
      setErrorMessage(`Validation error: ${e.message || 'Unknown verification error'}`);
    } finally {
      setIsValidating(false);
    }
  };

  // Open Confirmation Modal
  const handleInitiateImport = () => {
    if (!validationSummary) return;

    if (validationSummary.invalidCount > 0) {
      setErrorMessage('Cannot proceed: Uploaded file contains validation errors. All rows must pass validation before atomic import.');
      return;
    }

    if (!isDryRunSuccess || !dryRunToken) {
      setErrorMessage('Please run and complete a successful Dry Run before confirming.');
      return;
    }

    setIsConfirmModalOpen(true);
    setHasAcknowledgedSafety(false);
  };

  // Execute Confirmed Atomic Server-Side Import
  const handleConfirmedAtomicImport = async () => {
    if (!validationSummary || !dryRunToken) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (selectedEntity === 'user_invitations') {
        const invitations = validationSummary.rows.map(r => ({
          email: r.data.email,
          full_name: r.data.full_name || r.data.name || 'Invited User',
          role: r.data.role || 'student',
          identifier: r.data.identifier || r.data.roll_no || r.data.employee_code || '',
          department_code: r.data.department_code || 'CSE'
        }));

        const inviteRes = await apiService.inviteRealUsers({
          invitations,
          isDryRun: false,
          confirmationToken: dryRunToken,
          importedBy: user?.id,
          importedByName: user?.name
        });

        setIsConfirmModalOpen(false);
        setImportResult({
          jobId: `INV-${Date.now().toString().slice(-6)}`,
          totalRows: invitations.length,
          importedCount: inviteRes.summary.inviteSent,
          updatedCount: 0,
          skippedCount: inviteRes.summary.alreadyExists,
          failedCount: inviteRes.summary.failed,
          status: inviteRes.summary.failed === 0 ? 'completed' : 'completed',
          errors: []
        });
      } else {
        const res = await apiService.processMasterImportServer({
          entityType: selectedEntity,
          validatedRows: validationSummary.rows,
          isDryRun: false,
          confirmationToken: dryRunToken,
          mode: importMode === 'update_existing' ? 'update_existing' : 'skip_duplicates',
          fileName: fileName || `${selectedEntity}_import.csv`,
          importedBy: user?.id || 'admin',
          importedByName: user?.name || 'College Administrator',
          userRole: role || undefined
        });

        setIsConfirmModalOpen(false);
        setImportResult({
          jobId: res.jobId,
          totalRows: res.totalRows,
          importedCount: res.importedCount,
          updatedCount: res.updatedCount,
          skippedCount: res.skippedCount,
          failedCount: res.failedCount,
          status: res.status,
          errors: res.errors || []
        });

        if (res.status === 'rolled_back') {
          setErrorMessage(`Atomic Rollback Triggered: ${res.error || 'A required constraint failed during execution. All row insertions were safely rolled back.'}`);
        } else {
          setSuccessToast(`Successfully imported ${res.importedCount} records for ${selectedEntity}.`);
        }
      }

      // Refresh audit jobs list and master validation context
      loadAuditJobs();
      loadValidationContext();
    } catch (e: any) {
      setIsConfirmModalOpen(false);
      setErrorMessage(`Import failed and rolled back safely: ${e.message || 'Transaction aborted.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Failed Rows CSV Report
  const handleDownloadErrors = () => {
    if (!validationSummary) return;
    const failedRows = validationSummary.rows
      .filter(r => r.status === 'invalid')
      .map(r => ({
        rowNumber: r.rowNumber,
        identifier: r.data.roll_no || r.data.employee_code || r.data.faculty_id || r.data.subject_code || r.data.branch_code || 'N/A',
        field: r.errors[0]?.column || 'validation',
        error: r.errors.map(e => `${e.column}: ${e.message}`).join('; '),
        rawData: r.data
      }));

    downloadFailedRowsCsv(failedRows, selectedEntity);
  };

  // Security Check: Only Principal / Admin should access
  if (role !== 'admin' && role !== 'principal') {
    return (
      <div className="max-w-4xl mx-auto p-6 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900 shadow-xs my-8">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Access Restricted</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          The Master Data Import and Staged Real-Data Onboarding Console is restricted strictly to College Principals and System Administrators.
        </p>
      </div>
    );
  }

  const selectedConfig = IMPORT_MODULE_CONFIGS[selectedEntity] || IMPORT_MODULE_CONFIGS['students'];
  const ModuleIcon = MODULE_ICONS[selectedEntity] || GraduationCap;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <span>Administration</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Data Management</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                Staged Real College Onboarding
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              College Data Import & Real-Data Onboarding
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Safely onboard real college records (Departments, Faculty, Students, Subjects, Timetable, Marks) with atomic transactional rollback and zero plaintext password imports.
            </p>
          </div>

          {/* Top Actions: Tabs + Demo Data Management */}
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {!isProduction() && (
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Demo Data
              </button>
            )}

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('wizard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'wizard'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                Onboarding Wizard
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'import'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
                Import Console
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'audit'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                Audit Logs ({auditJobs.length})
              </button>
            </div>
          </div>
        </div>

        {/* Status / Notice Pill */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Strict Role Verification Active: Administrator Authorization Enforced</span>
          </div>
          <div className="flex items-center gap-2">
            {isLoadingContext ? (
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Synchronizing master catalogs...
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 font-medium">
                {validationContext?.studentsMap.size || 0} Students • {validationContext?.facultyMap.size || 0} Faculty • {validationContext?.subjectsMap.size || 0} Subjects verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-4 flex items-start gap-3 text-red-800 dark:text-red-300 text-xs sm:text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Import Notice: </span>
            {errorMessage}
          </div>
          <button 
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 dark:hover:text-red-200 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Banner */}
      {successToast && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4 flex items-start gap-3 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Success: </span>
            {successToast}
          </div>
          <button 
            onClick={() => setSuccessToast(null)}
            className="text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-200 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: ONBOARDING WIZARD */}
      {activeTab === 'wizard' && (
        <RealDataOnboardingWizard
          onSelectModule={handleSelectModule}
          context={validationContext}
          recentJobs={auditJobs}
          onOpenDemoManagement={!isProduction() ? () => setIsDemoModalOpen(true) : undefined}
        />
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Master Data Import Audit History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable ledger of all college bulk imports, processed rows, skips, and rejections.
              </p>
            </div>
            <button
              onClick={loadAuditJobs}
              disabled={isLoadingAudit}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {auditJobs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <History className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No import records recorded yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Completed imports from the Import Wizard will be audited and logged here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Admin</th>
                    <th className="p-3">Data Type</th>
                    <th className="p-3">File Name</th>
                    <th className="p-3 text-center">Total Rows</th>
                    <th className="p-3 text-center text-emerald-700 dark:text-emerald-400">Imported</th>
                    <th className="p-3 text-center text-blue-700 dark:text-blue-400">Updated</th>
                    <th className="p-3 text-center text-amber-700 dark:text-amber-400">Skipped</th>
                    <th className="p-3 text-center text-red-700 dark:text-red-400">Failed</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {auditJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {job.created_at ? new Date(job.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-3 font-medium text-slate-900 dark:text-white">
                        {job.imported_by_name || 'Admin'}
                      </td>
                      <td className="p-3 uppercase font-mono font-bold text-slate-600 dark:text-slate-400">
                        {job.target_entity}
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200 max-w-[150px] truncate" title={job.file_name}>
                        {job.file_name}
                      </td>
                      <td className="p-3 text-center font-bold">{job.total_rows}</td>
                      <td className="p-3 text-center font-bold text-emerald-700 dark:text-emerald-400">{job.successful_rows}</td>
                      <td className="p-3 text-center font-bold text-blue-700 dark:text-blue-400">{job.updated_rows || 0}</td>
                      <td className="p-3 text-center font-bold text-amber-700 dark:text-amber-400">{job.skipped_rows || 0}</td>
                      <td className="p-3 text-center font-bold text-red-700 dark:text-red-400">{job.failed_rows}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          job.status === 'Completed' || job.status === 'completed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                            : job.status === 'Failed' || job.status === 'failed' || job.status === 'rolled_back'
                            ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleSelectAuditJob(job)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit Job Detail Modal */}
          {selectedAuditJob && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-2xl w-full shadow-2xl relative my-8">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Import Job Audit: {selectedAuditJob.id}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Target Entity: <span className="font-mono font-bold uppercase">{selectedAuditJob.target_entity}</span> • {selectedAuditJob.file_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedAuditJob(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Rows</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white block">{selectedAuditJob.total_rows}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                    <span className="text-[10px] text-emerald-700 uppercase font-semibold">Imported</span>
                    <span className="text-lg font-bold text-emerald-700 block">{selectedAuditJob.successful_rows}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                    <span className="text-[10px] text-amber-700 uppercase font-semibold">Skipped</span>
                    <span className="text-lg font-bold text-amber-700 block">{selectedAuditJob.skipped_rows || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                    <span className="text-[10px] text-red-700 uppercase font-semibold">Failed</span>
                    <span className="text-lg font-bold text-red-700 block">{selectedAuditJob.failed_rows}</span>
                  </div>
                </div>

                {auditErrors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Logged Errors ({auditErrors.length}):
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                      {auditErrors.map((err, i) => (
                        <div key={i} className="text-xs p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                          <span className="font-bold text-red-600">Row {err.row_number || err.row}:</span>
                          <span className="text-slate-600 dark:text-slate-400">{err.error_message || err.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setSelectedAuditJob(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: IMPORT CONSOLE */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* STEP 1: Select Data Type (All 16 Clean Cards Grid) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900">
                  Step 1 of 7
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                  Select Target College Data Module
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose the academic or administrative module you wish to batch import or update.
                </p>
              </div>
            </div>

            {/* 16 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {(Object.keys(IMPORT_MODULE_CONFIGS) as ImportEntityType[]).map((key, index) => {
                const config = IMPORT_MODULE_CONFIGS[key];
                const Icon = MODULE_ICONS[key] || FileSpreadsheet;
                const isSelected = selectedEntity === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectModule(key)}
                    className={`text-left p-3.5 rounded-xl border transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                          #{index + 1}
                        </span>
                      </div>
                      <h3 className={`text-xs sm:text-sm font-bold ${
                        isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {config.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {config.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-400">
                        {config.headers.length} headers
                      </span>
                      {isSelected ? (
                        <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Selected
                        </span>
                      ) : (
                        <span className="text-slate-400 hover:text-slate-600">Select</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Download Template & Required Fields Reference */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900">
                  Step 2 of 7
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                  <ModuleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Download Official Template for: {selectedConfig.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pre-configured with standard column headers, verified sample rows, and college-accepted formatting.
                </p>
              </div>

              {/* Download Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('csv')}
                  className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Download CSV Template
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                  Download XLSX Template
                </button>
              </div>
            </div>

            {/* Required Fields Badge List */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Required Columns for {selectedConfig.title}:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedConfig.headers.map(h => {
                  const isReq = selectedConfig.requiredHeaders.includes(h);
                  return (
                    <span
                      key={h}
                      className={`px-2 py-1 rounded-md text-[11px] font-mono border ${
                        isReq
                          ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-bold'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                      title={selectedConfig.fieldDescriptions[h] || h}
                    >
                      {h} {isReq ? '*' : ''}
                    </span>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                * Bold columns with an asterisk are required. Passwords must never be stored in CSV files; Supabase Auth handles credentials.
              </p>
            </div>
          </div>

          {/* STEP 3 & 4: Upload File & Duplicate Handling Mode */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900">
                Step 3 & 4 of 7
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                Upload File & Select Duplicate Record Policy
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload your completed CSV or XLSX sheet. Choose how to handle records that already exist in the database.
              </p>
            </div>

            {/* Duplicate Handling Policy Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  importMode === 'create_only'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="import_mode"
                  checked={importMode === 'create_only'}
                  onChange={() => setImportMode('create_only')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    [Skip Existing] — Safe Insert Only
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block mt-0.5">
                    Inserts only new records. If a record already exists in the database, it will be skipped without overwriting existing data.
                  </span>
                </div>
              </label>

              <label 
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  importMode === 'update_existing'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="import_mode"
                  checked={importMode === 'update_existing'}
                  onChange={() => setImportMode('update_existing')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    [Update Existing] — Upsert & Overwrite
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block mt-0.5">
                    Inserts new records and updates existing records with the fresh data from this spreadsheet.
                  </span>
                </div>
              </label>
            </div>

            {/* Upload Drag & Drop Area */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-6 sm:p-8 text-center transition bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/20">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
                id="master-file-upload"
              />
              <label htmlFor="master-file-upload" className="cursor-pointer block">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                  Click to select file or drag and drop
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                  Supported formats: CSV (.csv), Excel (.xlsx, .xls) • Maximum file size: 5MB
                </span>
              </label>

              {fileName && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">{fileName}</span>
                  <span className="text-slate-400">({fileSize})</span>
                  <button
                    type="button"
                    onClick={handleResetWorkflow}
                    className="ml-2 text-slate-400 hover:text-red-600 text-xs font-bold"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* STEP 5, 6, 7: Preview, Validation Breakdown, & Action Confirmation */}
          {validationSummary && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900">
                    Step 5, 6 & 7 of 7
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                    Validation Summary & Data Preview
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review row-by-row validation results before committing changes to the college database.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => runValidation(rawRows, selectedEntity)}
                    disabled={isValidating}
                    className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                    Re-Validate
                  </button>
                  {validationSummary.invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadErrors}
                      className="px-3.5 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Error Report ({validationSummary.invalidCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Validation Summary Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Total Rows
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                    {validationSummary.totalRows}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-1 block">
                    {validationSummary.validCount}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Duplicate
                  </span>
                  <span className="text-2xl font-extrabold text-amber-800 dark:text-amber-300 mt-1 block">
                    {validationSummary.duplicateCount}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30">
                  <span className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider block flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Invalid
                  </span>
                  <span className="text-2xl font-extrabold text-red-800 dark:text-red-300 mt-1 block">
                    {validationSummary.invalidCount}
                  </span>
                </div>
              </div>

              {/* Rich 5-Tuple Error Breakdown (if any invalid rows) */}
              {validationSummary.invalidCount > 0 && (
                <div className="border border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800 dark:text-red-300">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    Validation Errors Found ({validationSummary.errors.length} issues in {validationSummary.invalidCount} rows):
                  </div>
                  <p className="text-[11px] text-red-700 dark:text-red-400">
                    Atomic transaction safety rule: All validation errors must be corrected in the spreadsheet before import. No partial import is permitted.
                  </p>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {validationSummary.errors.slice(0, 100).map((err, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/60 rounded-xl text-xs space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between font-bold text-red-700 dark:text-red-400">
                          <span>Row {err.rowNumber} • Column: <code className="font-mono bg-red-50 dark:bg-red-950 px-1 py-0.5 rounded">{err.column}</code></span>
                          {err.invalidValue !== undefined && err.invalidValue !== '' && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              Got: "{err.invalidValue}"
                            </span>
                          )}
                        </div>
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          <strong>Reason:</strong> {err.reason || err.message}
                        </div>
                        {err.suggestedCorrection && (
                          <div className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                            💡 <strong>Suggested Correction:</strong> {err.suggestedCorrection}
                          </div>
                        )}
                      </div>
                    ))}
                    {validationSummary.errors.length > 100 && (
                      <p className="text-[11px] text-slate-500 text-center pt-1">
                        ...and {validationSummary.errors.length - 100} more errors. Download the full error report CSV to inspect all rows.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Data Preview Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Data Preview (First 50 Rows):
                </span>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 bg-slate-50 dark:bg-slate-800">Row</th>
                        <th className="p-2.5 bg-slate-50 dark:bg-slate-800">Status</th>
                        {selectedConfig.headers.map(h => (
                          <th key={h} className="p-2.5 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {validationSummary.rows.slice(0, 50).map((row) => (
                        <tr 
                          key={row.rowNumber} 
                          className={
                            row.status === 'invalid'
                              ? 'bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/60'
                              : row.status === 'duplicate'
                              ? 'bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/50'
                              : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                          }
                        >
                          <td className="p-2.5 font-bold text-slate-500 font-mono text-[11px]">
                            {row.rowNumber}
                          </td>
                          <td className="p-2.5">
                            {row.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            )}
                            {row.status === 'duplicate' && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                title={row.duplicateReason}
                              >
                                <AlertTriangle className="w-3 h-3" /> Duplicate
                              </span>
                            )}
                            {row.status === 'invalid' && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                                title={row.errors.map(e => e.message).join('; ')}
                              >
                                <XCircle className="w-3 h-3" /> Invalid ({row.errors.length})
                              </span>
                            )}
                          </td>
                          {selectedConfig.headers.map(h => (
                            <td key={h} className="p-2.5 font-mono text-[11px]">
                              {row.data[h] !== undefined && row.data[h] !== '' ? String(row.data[h]) : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons: Dry Run -> Explicit Confirmation -> Atomic Import */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {importMode === 'create_only' ? (
                    <span>
                      Mode: <strong className="text-slate-700 dark:text-slate-300">Skip Existing</strong> ({validationSummary.validCount} new rows will be imported, {validationSummary.duplicateCount} duplicates skipped).
                    </span>
                  ) : (
                    <span>
                      Mode: <strong className="text-slate-700 dark:text-slate-300">Update Existing</strong> ({validationSummary.validCount + validationSummary.duplicateCount} records will be imported / updated).
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleResetWorkflow}
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => runValidation(rawRows, selectedEntity)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Run Dry Run
                    </button>
                    {isDryRunSuccess && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Dry Run Passed
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleInitiateImport}
                    disabled={isProcessing || !isDryRunSuccess || validationSummary.invalidCount > 0}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Proceed to Import...
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Post-Import Result Report Card */}
          {importResult && (
            <div className={`bg-white dark:bg-slate-900 border-2 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 ${
              importResult.status === 'rolled_back' || importResult.status === 'failed'
                ? 'border-red-500'
                : 'border-emerald-500'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    importResult.status === 'rolled_back' || importResult.status === 'failed'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  }`}>
                    {importResult.status === 'rolled_back' || importResult.status === 'failed' ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {importResult.status === 'rolled_back' ? 'Import Rolled Back (Atomic Safeguard)' : 'Import Operation Complete'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Audit Job Reference: <strong className="font-mono text-slate-700 dark:text-slate-300">{importResult.jobId}</strong> • Status: {importResult.status}
                    </p>
                  </div>
                </div>

                {importResult.failedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadErrors}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Error Report ({importResult.failedCount})
                  </button>
                )}
              </div>

              {/* Import Numbers Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Total Rows</span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white block mt-0.5">{importResult.totalRows}</span>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">✓ Imported</span>
                  <span className="text-xl font-extrabold text-emerald-700 block mt-0.5">{importResult.importedCount}</span>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">↻ Updated</span>
                  <span className="text-xl font-extrabold text-blue-700 block mt-0.5">{importResult.updatedCount}</span>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">⚠ Skipped</span>
                  <span className="text-xl font-extrabold text-amber-700 block mt-0.5">{importResult.skippedCount}</span>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900">
                  <span className="text-[10px] font-bold text-red-700 uppercase">✕ Failed</span>
                  <span className="text-xl font-extrabold text-red-700 block mt-0.5">{importResult.failedCount}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  View Audit Logs
                </button>
                <button
                  type="button"
                  onClick={handleResetWorkflow}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition"
                >
                  Import Another File
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Explicit Confirmation Modal */}
      {isConfirmModalOpen && validationSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Explicit Import Confirmation
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Step 7: Atomic Database Transaction Authorization
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-5 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Entity:</span>
                  <span className="font-bold text-slate-900 dark:text-white uppercase">{selectedEntity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Source File:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valid Rows to Process:</span>
                  <span className="font-bold text-emerald-600">{validationSummary.validCount} rows</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duplicate Handling:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {importMode === 'update_existing' ? 'Update & Overwrite' : 'Skip Existing'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Dry Run Token:</span>
                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{dryRunToken}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Atomic Transaction Guarantee
                </div>
                <p className="text-[11px] leading-relaxed">
                  If any single row violates database foreign keys or unique constraints during insertion, the entire batch will be automatically rolled back with zero partial writes.
                </p>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAcknowledgedSafety}
                  onChange={(e) => setHasAcknowledgedSafety(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  I confirm this spreadsheet contains verified HIET college data and authorize committing these records to the database ledger.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Back to Preview
              </button>
              <button
                type="button"
                onClick={handleConfirmedAtomicImport}
                disabled={!hasAcknowledgedSafety || isProcessing}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Executing Transaction...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm & Import Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Data Management Modal */}
      <DemoDataManagementModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSuccess={(msg) => setSuccessToast(msg)}
      />
    </div>
  );
};
