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
  AlertCircle
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

const MODULE_ICONS: Record<ImportEntityType, React.ElementType> = {
  students: GraduationCap,
  faculty: Briefcase,
  departments_branches: Layers,
  subjects: BookOpen,
  teacher_subjects: Users,
  timetable: Calendar,
  attendance: CalendarCheck,
  sessional_marks: FileText,
  results_grades: Award,
  syllabus: FileSpreadsheet,
  pyqs: FileQuestion
};

export const MasterDataImportView: React.FC = () => {
  const { user, role } = useAuth();

  // Active top tab
  const [activeTab, setActiveTab] = useState<'import' | 'audit'>('import');

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

  // Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    jobId: string;
    totalRows: number;
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
    failedCount: number;
    status: 'Completed' | 'Completed with warnings' | 'Failed';
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
  };

  const handleResetWorkflow = () => {
    setFileName('');
    setFileSize('');
    setRawRows([]);
    setValidationSummary(null);
    setIsDryRunSuccess(false);
    setImportResult(null);
    setErrorMessage(null);
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
      setIsDryRunSuccess(true);
    } catch (e: any) {
      setErrorMessage(`Validation error: ${e.message || 'Unknown verification error'}`);
    } finally {
      setIsValidating(false);
    }
  };

  // Execute Actual Import
  const handleExecuteImport = async () => {
    if (!validationSummary || validationSummary.rows.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await apiService.executeDataImport({
        entityType: selectedEntity,
        validatedRows: validationSummary.rows,
        importMode,
        fileName: fileName || `${selectedEntity}_import.csv`,
        importedBy: user?.id || 'admin',
        importedByName: user?.name || 'College Administrator',
        userRole: role || undefined
      });

      setImportResult(res);
      // Refresh audit jobs list and master validation context
      loadAuditJobs();
      loadValidationContext();
    } catch (e: any) {
      setErrorMessage(e.message || 'Import could not be completed. Please check your connection and try again.');
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
        identifier: r.data.roll_no || r.data.faculty_id || r.data.subject_code || r.data.branch_code || 'N/A',
        field: r.errors[0]?.column || 'validation',
        error: r.errors.map(e => `${e.column}: ${e.message}`).join('; '),
        rawData: r.data
      }));

    downloadFailedRowsCsv(failedRows, selectedEntity);
  };

  // Security Check: Only Principal / Admin should access
  if (role !== 'admin' && role !== 'principal') {
    return (
      <div className="max-w-4xl mx-auto p-6 sm:p-12 text-center bg-white rounded-2xl border border-red-200 shadow-xs my-8">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h2>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          The College Data Import & Master Management Console is strictly accessible only to Principal & College Administration.
        </p>
      </div>
    );
  }

  const selectedConfig = IMPORT_MODULE_CONFIGS[selectedEntity];
  const ModuleIcon = MODULE_ICONS[selectedEntity];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Navigation Breadcrumb */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 flex-wrap">
              <span>Principal Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-700">Data Management</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-[#0f2942] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Import College Data
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Database className="w-6 h-6 text-blue-600" />
              College Data Import & Master Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Add and update student databases, faculty allocations, timetable schedules, attendance, and exam grades through validated CSV/XLSX imports without manual database queries.
            </p>
          </div>

          {/* Tab Selector: Import Console vs Audit Logs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'import'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Import Wizard
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Import History ({auditJobs.length})
            </button>
          </div>
        </div>

        {/* Status / Notice Pill */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Strict Role Verification Active: Administrator Authorization Enforced</span>
          </div>
          <div className="flex items-center gap-2">
            {isLoadingContext ? (
              <span className="flex items-center gap-1.5 text-blue-600">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Synchronizing master catalogs...
              </span>
            ) : (
              <span className="text-slate-400">
                {validationContext?.studentsMap.size || 0} Students • {validationContext?.facultyMap.size || 0} Faculty • {validationContext?.subjectsMap.size || 0} Subjects verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Import Notice: </span>
            {errorMessage}
          </div>
          <button 
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTab === 'audit' ? (
        /* ========================================================================= */
        /* SECTION 20: IMPORT HISTORY & AUDIT LOGS                                   */
        /* ========================================================================= */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Master Data Import Audit History
              </h2>
              <p className="text-xs text-slate-500">
                Immutable record of all college bulk imports, processed rows, skips, and rejections.
              </p>
            </div>
            <button
              onClick={loadAuditJobs}
              disabled={isLoadingAudit}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {auditJobs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No import records recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Completed imports from the Import Wizard will be audited and logged here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Admin</th>
                    <th className="p-3">Data Type</th>
                    <th className="p-3">File Name</th>
                    <th className="p-3 text-center">Total Rows</th>
                    <th className="p-3 text-center text-emerald-700">Imported</th>
                    <th className="p-3 text-center text-blue-700">Updated</th>
                    <th className="p-3 text-center text-amber-700">Skipped</th>
                    <th className="p-3 text-center text-red-700">Failed</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditJobs.map((job) => {
                    const d = new Date(job.created_at);
                    const formattedDate = !isNaN(d.getTime()) 
                      ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : job.created_at;

                    return (
                      <tr key={job.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-medium text-slate-900 whitespace-nowrap">{formattedDate}</td>
                        <td className="p-3 whitespace-nowrap">{job.imported_by_name || 'Admin'}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 capitalize">
                            {job.target_entity.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600 max-w-[160px] truncate" title={job.file_name}>
                          {job.file_name}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{job.total_rows}</td>
                        <td className="p-3 text-center font-bold text-emerald-600">{job.successful_rows}</td>
                        <td className="p-3 text-center font-semibold text-blue-600">{job.updated_rows || 0}</td>
                        <td className="p-3 text-center text-amber-600">{job.skipped_rows || 0}</td>
                        <td className="p-3 text-center font-bold text-red-600">{job.failed_rows}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            job.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : job.status === 'Completed with warnings'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {job.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                            {job.status === 'Completed with warnings' && <AlertTriangle className="w-3 h-3" />}
                            {job.status === 'Failed' && <XCircle className="w-3 h-3" />}
                            {job.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleSelectAuditJob(job)}
                            className="text-xs text-blue-600 font-semibold hover:underline"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit Job Detail Modal / Panel */}
          {selectedAuditJob && (
            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-slate-50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Audit Job: {selectedAuditJob.id} — {selectedAuditJob.target_entity}
                  </h3>
                  <p className="text-xs text-slate-500">
                    File: {selectedAuditJob.file_name} • Mode: {selectedAuditJob.import_mode}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAuditJob(null)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg"
                >
                  Close
                </button>
              </div>

              {auditErrors.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-red-700">Logged Row Rejections ({auditErrors.length}):</span>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {auditErrors.map((err, idx) => (
                      <div key={idx} className="p-2.5 bg-white border border-red-200 rounded-lg text-xs text-slate-800 flex items-start gap-2">
                        <span className="font-bold text-red-600 whitespace-nowrap">Row {err.row_number}:</span>
                        <span className="font-mono text-[11px] text-slate-500">[{err.field_name || 'general'}]</span>
                        <span className="text-slate-700">{err.error_message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No rejection errors recorded for this job.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* IMPORT WIZARD (7-STEP WORKFLOW)                                          */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* STEP 1: Select Data Type (11 Clean Cards Grid) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Step 1 of 7
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  Select Target College Data Module
                </h2>
                <p className="text-xs text-slate-500">
                  Choose the academic or administrative module you wish to batch import or update.
                </p>
              </div>
            </div>

            {/* 11 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {(Object.keys(IMPORT_MODULE_CONFIGS) as ImportEntityType[]).map((key, index) => {
                const config = IMPORT_MODULE_CONFIGS[key];
                const Icon = MODULE_ICONS[key];
                const isSelected = selectedEntity === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectModule(key)}
                    className={`text-left p-3.5 rounded-xl border transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                          #{index + 1}
                        </span>
                      </div>
                      <h3 className={`text-xs sm:text-sm font-bold ${
                        isSelected ? 'text-blue-900' : 'text-slate-800'
                      }`}>
                        {config.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {config.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-400">
                        {config.headers.length} headers
                      </span>
                      {isSelected ? (
                        <span className="font-bold text-blue-600 flex items-center gap-0.5">
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Step 2 of 7
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <ModuleIcon className="w-5 h-5 text-blue-600" />
                  Download Official Template for: {selectedConfig.title}
                </h2>
                <p className="text-xs text-slate-500">
                  Pre-configured with standard column headers, verified sample rows, and college-accepted formatting.
                </p>
              </div>

              {/* Download Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('csv')}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
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
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Info className="w-4 h-4 text-blue-600" />
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
                          ? 'bg-blue-50 text-blue-800 border-blue-200 font-bold'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                      title={selectedConfig.fieldDescriptions[h] || h}
                    >
                      {h} {isReq ? '*' : ''}
                    </span>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                * Bold columns with an asterisk are required. Passwords must never be stored in CSV files; Supabase Auth handles credentials.
              </p>
            </div>
          </div>

          {/* STEP 3 & 4: Upload File & Duplicate Handling Mode */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                Step 3 & 4 of 7
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                Upload File & Select Duplicate Record Policy
              </h2>
              <p className="text-xs text-slate-500">
                Upload your completed CSV or XLSX sheet. Choose how to handle records that already exist in the database.
              </p>
            </div>

            {/* Duplicate Handling Policy Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  importMode === 'create_only'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
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
                  <span className="text-xs font-bold text-slate-800 block">
                    [Skip Existing] — Safe Insert Only
                  </span>
                  <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                    Inserts only new records. If a record already exists in the database, it will be skipped without overwriting existing data.
                  </span>
                </div>
              </label>

              <label 
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  importMode === 'update_existing'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
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
                  <span className="text-xs font-bold text-slate-800 block">
                    [Update Existing] — Upsert & Overwrite
                  </span>
                  <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                    Inserts new records and updates existing records with the fresh data from this spreadsheet.
                  </span>
                </div>
              </label>
            </div>

            {/* Upload Drag & Drop Area */}
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 sm:p-8 text-center transition bg-slate-50/50 hover:bg-blue-50/20">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
                id="master-file-upload"
              />
              <label htmlFor="master-file-upload" className="cursor-pointer block">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                  Click to select file or drag and drop
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Supported formats: CSV (.csv), Excel (.xlsx, .xls) • Maximum file size: 5MB
                </span>
              </label>

              {fileName && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-900">{fileName}</span>
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
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    Step 5, 6 & 7 of 7
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                    Validation Summary & Data Preview
                  </h2>
                  <p className="text-xs text-slate-500">
                    Review row-by-row validation results before committing changes to the college database.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => runValidation(rawRows, selectedEntity)}
                    disabled={isValidating}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                    Re-Validate
                  </button>
                  {validationSummary.invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadErrors}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Error Report ({validationSummary.invalidCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Validation Summary Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Rows
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                    {validationSummary.totalRows}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-800 mt-1 block">
                    {validationSummary.validCount}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Duplicate
                  </span>
                  <span className="text-2xl font-extrabold text-amber-800 mt-1 block">
                    {validationSummary.duplicateCount}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-red-200 bg-red-50/50">
                  <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Invalid
                  </span>
                  <span className="text-2xl font-extrabold text-red-800 mt-1 block">
                    {validationSummary.invalidCount}
                  </span>
                </div>
              </div>

              {/* Error Detail Breakdown (if any invalid rows) */}
              {validationSummary.invalidCount > 0 && (
                <div className="border border-red-200 bg-red-50/40 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Validation Errors Found ({validationSummary.errors.length} issues in {validationSummary.invalidCount} rows):
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {validationSummary.errors.slice(0, 100).map((err, idx) => (
                      <div key={idx} className="p-2 bg-white border border-red-100 rounded-lg text-xs flex items-start gap-2 shadow-2xs">
                        <span className="font-bold text-red-700 shrink-0">Row {err.rowNumber}</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-mono text-[11px] text-slate-600 shrink-0">Column "{err.column}"</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-red-700 font-medium">{err.message}</span>
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

              {/* In-Container Horizontally Scrollable Preview Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Data Preview (First 50 Rows):
                </span>
                <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 bg-slate-50">Row</th>
                        <th className="p-2.5 bg-slate-50">Validation Status</th>
                        {selectedConfig.headers.map(h => (
                          <th key={h} className="p-2.5 bg-slate-50 font-mono text-[11px]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {validationSummary.rows.slice(0, 50).map((row) => (
                        <tr 
                          key={row.rowNumber} 
                          className={
                            row.status === 'invalid'
                              ? 'bg-red-50/40 hover:bg-red-50/60'
                              : row.status === 'duplicate'
                              ? 'bg-amber-50/30 hover:bg-amber-50/50'
                              : 'hover:bg-slate-50/60'
                          }
                        >
                          <td className="p-2.5 font-bold text-slate-500 font-mono text-[11px]">
                            {row.rowNumber}
                          </td>
                          <td className="p-2.5">
                            {row.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            )}
                            {row.status === 'duplicate' && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                                title={row.duplicateReason}
                              >
                                <AlertTriangle className="w-3 h-3" /> Duplicate
                              </span>
                            )}
                            {row.status === 'invalid' && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200"
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

              {/* Action Buttons: Dry Run [Validate Only] vs [Import Valid Records] */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {importMode === 'create_only' ? (
                    <span>
                      Mode: <strong className="text-slate-700">Skip Existing</strong> ({validationSummary.validCount} valid new rows will be imported, {validationSummary.duplicateCount} duplicates skipped).
                    </span>
                  ) : (
                    <span>
                      Mode: <strong className="text-slate-700">Update Existing</strong> ({validationSummary.validCount + validationSummary.duplicateCount} records will be imported / updated).
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleResetWorkflow}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        runValidation(rawRows, selectedEntity);
                        setIsDryRunSuccess(true);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                      Validate Only (Dry Run)
                    </button>
                    {isDryRunSuccess && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verified
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isProcessing || (validationSummary.validCount === 0 && (importMode !== 'update_existing' || validationSummary.duplicateCount === 0))}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Writing to Database...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        Import Valid Records
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Post-Import Result Report Card (Section 17) */}
          {importResult && (
            <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Import Operation Complete
                    </h2>
                    <p className="text-xs text-slate-500">
                      Audit Job Reference: <strong className="font-mono text-slate-700">{importResult.jobId}</strong> • Status: {importResult.status}
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
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Total Rows</span>
                  <span className="text-xl font-extrabold text-slate-900 block mt-0.5">{importResult.totalRows}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">✓ Imported</span>
                  <span className="text-xl font-extrabold text-emerald-700 block mt-0.5">{importResult.importedCount}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">↻ Updated</span>
                  <span className="text-xl font-extrabold text-blue-700 block mt-0.5">{importResult.updatedCount}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">⚠ Skipped</span>
                  <span className="text-xl font-extrabold text-amber-700 block mt-0.5">{importResult.skippedCount}</span>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-[10px] font-bold text-red-700 uppercase">✕ Failed</span>
                  <span className="text-xl font-extrabold text-red-700 block mt-0.5">{importResult.failedCount}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleResetWorkflow}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition"
                >
                  Import Another File
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
