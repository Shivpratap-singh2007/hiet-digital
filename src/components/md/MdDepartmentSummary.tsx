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
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
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

      <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
        <table className="w-full text-left text-xs min-w-[580px]">
          <thead className="bg-slate-50/80 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-bold border-b border-slate-200/80 dark:border-zinc-700/80">
            <tr>
              <th className="px-3.5 py-2.5">Department</th>
              <th className="px-3 py-2.5 text-center">Students</th>
              <th className="px-3 py-2.5 text-center">Faculty</th>
              <th className="px-3 py-2.5 text-center">Attendance %</th>
              <th className="px-3 py-2.5 text-center">Approved Leaves</th>
              <th className="px-3 py-2.5 text-right">Gate Passes</th>
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
    </div>
  );
};
