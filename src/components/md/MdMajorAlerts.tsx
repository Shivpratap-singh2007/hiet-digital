import React from 'react';
import { ShieldAlert, ArrowRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  overallAttendanceRate: number;
  openComplaints: number;
  lowAttendanceWarningCount: number;
  onNavigateTab?: (tab: any) => void;
}

export const MdMajorAlerts: React.FC<Props> = ({
  overallAttendanceRate,
  openComplaints,
  lowAttendanceWarningCount,
  onNavigateTab
}) => {
  const alerts = [
    {
      id: 'hptu-compliance',
      title: 'HPTU 75% Attendance Compliance',
      status: overallAttendanceRate >= 75 ? 'Satisfactory' : 'Action Required',
      statusType: overallAttendanceRate >= 75 ? 'success' : 'danger',
      description: `Campus aggregate is ${overallAttendanceRate}%. ${lowAttendanceWarningCount} semester warnings monitored across 5 branches.`,
      icon: overallAttendanceRate >= 75 ? CheckCircle2 : AlertTriangle
    },
    {
      id: 'grievance-sla',
      title: 'Grievance Redressal Cell',
      status: openComplaints > 0 ? `${openComplaints} In Review` : 'All Resolved',
      statusType: openComplaints > 0 ? 'warning' : 'success',
      description: 'Active student & staff grievances assigned to statutory committee. Zero escalated disputes.',
      icon: Clock
    },
    {
      id: 'faculty-workload',
      title: 'Faculty Workload Equilibrium',
      status: 'Optimal',
      statusType: 'success',
      description: 'Average teaching load is 16 credit hours/week adhering strictly to AICTE institutional norms.',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
            Major Alerts
          </h2>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
          Active Monitoring
        </span>
      </div>

      <div className="space-y-2.5 text-xs">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div
              key={alert.id}
              className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 space-y-1"
            >
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-zinc-100">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${
                    alert.statusType === 'success' 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : alert.statusType === 'warning'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`} />
                  <span>{alert.title}</span>
                </div>
                <span className={`text-[11px] font-mono ${
                  alert.statusType === 'success' 
                    ? 'text-emerald-700 dark:text-emerald-400' 
                    : alert.statusType === 'warning'
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}>
                  {alert.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed pl-5">
                {alert.description}
              </p>
            </div>
          );
        })}
      </div>

      {onNavigateTab && (
        <div className="pt-1 border-t border-slate-100 dark:border-zinc-800/80 flex justify-end">
          <button
            type="button"
            onClick={() => onNavigateTab('audit_log')}
            className="text-xs font-bold text-[#0f2942] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Audit Log Ledger</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
