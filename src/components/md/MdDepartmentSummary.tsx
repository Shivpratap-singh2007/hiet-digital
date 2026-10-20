import React from 'react';
import { ArrowRight } from 'lucide-react';

export interface DepartmentRowData {
  code: string;
  name: string;
  established: string;
  studentCount: number;
  facultyCount: number;
  attendanceRate: number;
  approvedLeaves: number;
  gatePasses: number;
  color: string;
}

interface Props {
  departments: DepartmentRowData[];
  totalUniqueStudents: number;
  totalUniqueFaculty: number;
  overallAttendanceRate: number;
  onNavigateTab?: (tab: any) => void;
}

export const MdDepartmentSummary: React.FC<Props> = ({
  departments,
  totalUniqueStudents,
  totalUniqueFaculty,
  overallAttendanceRate,
  onNavigateTab
}) => {
  const totalApprovedLeaves = departments.reduce((acc, d) => acc + d.approvedLeaves, 0);
  const totalGatePasses = departments.reduce((acc, d) => acc + d.gatePasses, 0);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
            Department-wise Summary
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Student cohort strength, faculty allocation, attendance compliance and movements
          </p>
        </div>
        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('principal_analytics')}
            className="text-xs font-bold text-[#0f2942] dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Trends</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Desktop Department Summary Table */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full text-left text-xs min-w-[620px]">
          <thead className="bg-slate-50/80 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-bold border-b border-slate-200/80 dark:border-zinc-700/80">
            <tr>
              <th className="px-3.5 py-2.5 min-w-[170px] whitespace-nowrap">Department</th>
              <th className="px-3.5 py-2.5 text-center min-w-[90px] whitespace-nowrap">Students</th>
              <th className="px-3.5 py-2.5 text-center min-w-[90px] whitespace-nowrap">Faculty</th>
              <th className="px-3.5 py-2.5 text-center min-w-[110px] whitespace-nowrap">Attendance %</th>
              <th className="px-3.5 py-2.5 text-center min-w-[120px] whitespace-nowrap">Approved Leaves</th>
              <th className="px-3.5 py-2.5 text-right min-w-[100px] whitespace-nowrap">Gate Passes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {departments.map((dept) => (
              <tr key={dept.code} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition">
                <td className="px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${dept.color} shrink-0`} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-zinc-100">{dept.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                        Code: {dept.code} • Est. {dept.established}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-center font-semibold text-slate-800 dark:text-zinc-200 font-mono">
                  {dept.studentCount}
                </td>
                <td className="px-3 py-3 text-center font-semibold text-slate-800 dark:text-zinc-200 font-mono">
                  {dept.facultyCount}
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="inline-flex items-center gap-1.5 font-bold font-mono">
                    <span className={dept.attendanceRate >= 80 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
                      {dept.attendanceRate}%
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${dept.attendanceRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                </td>
                <td className="px-3 py-3 text-center font-mono text-slate-700 dark:text-zinc-300">
                  {dept.approvedLeaves}
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                  {dept.gatePasses}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/90 dark:bg-zinc-800/80 font-bold border-t border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100">
            <tr>
              <td className="px-3.5 py-2.5 uppercase tracking-wider text-[11px] font-extrabold">
                Institution Total (Unique)
              </td>
              <td className="px-3 py-2.5 text-center font-mono font-extrabold text-blue-700 dark:text-blue-400">
                {totalUniqueStudents}
              </td>
              <td className="px-3 py-2.5 text-center font-mono font-extrabold text-purple-700 dark:text-purple-400">
                {totalUniqueFaculty}
              </td>
              <td className="px-3 py-2.5 text-center font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                {overallAttendanceRate}%
              </td>
              <td className="px-3 py-2.5 text-center font-mono">
                {totalApprovedLeaves}
              </td>
              <td className="px-3 py-2.5 text-right font-mono">
                {totalGatePasses}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile Department Cards (320px - 768px) */}
      <div className="md:hidden space-y-3">
        {departments.map((dept) => (
          <div
            key={dept.code}
            className="p-4 bg-slate-50/60 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/80 rounded-xl space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${dept.color} shrink-0 mt-0.5`} />
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100 leading-tight">
                    {dept.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-400 font-mono mt-0.5">
                    Code: {dept.code} • Est. {dept.established}
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-bold shrink-0">
                <span className={dept.attendanceRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                  {dept.attendanceRate}%
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${dept.attendanceRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 text-xs">
              <div className="bg-white dark:bg-zinc-800/80 p-2 rounded-lg border border-slate-100 dark:border-zinc-700/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Students</span>
                <span className="font-mono font-bold text-slate-800 dark:text-zinc-200 text-sm">{dept.studentCount}</span>
              </div>
              <div className="bg-white dark:bg-zinc-800/80 p-2 rounded-lg border border-slate-100 dark:border-zinc-700/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Faculty</span>
                <span className="font-mono font-bold text-slate-800 dark:text-zinc-200 text-sm">{dept.facultyCount}</span>
              </div>
              <div className="bg-white dark:bg-zinc-800/80 p-2 rounded-lg border border-slate-100 dark:border-zinc-700/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Leaves</span>
                <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 text-sm">{dept.approvedLeaves}</span>
              </div>
              <div className="bg-white dark:bg-zinc-800/80 p-2 rounded-lg border border-slate-100 dark:border-zinc-700/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Gate Passes</span>
                <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-sm">{dept.gatePasses}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Institution Total Summary Card on Mobile */}
        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Institution Total (Unique)</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs">
              {overallAttendanceRate}% Attendance
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Total Students</span>
              <span className="font-mono font-bold text-blue-400 text-sm">{totalUniqueStudents}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Total Faculty</span>
              <span className="font-mono font-bold text-purple-400 text-sm">{totalUniqueFaculty}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Total Leaves</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{totalApprovedLeaves}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Total Passes</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{totalGatePasses}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
