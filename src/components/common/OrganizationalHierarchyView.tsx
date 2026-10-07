import React from 'react';
import { 
  Building2, 
  Crown, 
  Award, 
  Users, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  ClipboardCheck,
  ChevronDown
} from 'lucide-react';

export const OrganizationalHierarchyView: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[#0f2942] text-xs font-bold mb-1.5 border border-slate-200">
          <Building2 className="w-3.5 h-3.5" />
          <span>HIET Governance Structure</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f2942] tracking-tight">
          Official Institutional Hierarchy
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          HIET GROUP OF INSTITUTIONS • Vidyanagar, Shahpur, Distt. Kangra (H.P.)
        </p>
      </div>

      {/* Visual Hierarchy Tree */}
      <div className="max-w-3xl mx-auto flex flex-col items-center space-y-4 py-2">
        
        {/* Level 1: Managing Director (MD) */}
        <div className="w-full max-w-md p-4 rounded-xl bg-[#0f2942] text-white border border-slate-800 shadow-sm text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-sky-200 text-[10px] font-bold uppercase tracking-wider mb-1">
            <Crown className="w-3 h-3" />
            <span>Highest Institutional Authority</span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight">
            MANAGING DIRECTOR (MD)
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Strategic governance & administrative management
          </p>
        </div>

        {/* Down Arrow */}
        <div className="flex flex-col items-center text-slate-400">
          <div className="w-0.5 h-4 bg-slate-300" />
          <ChevronDown className="w-4 h-4 -mt-1 text-slate-500" />
        </div>

        {/* Level 2: Principal */}
        <div className="w-full max-w-md p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">
            <Award className="w-3 h-3" />
            <span>Head of Institution</span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight">
            PRINCIPAL
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Academic & administrative control • Overall college administration
          </p>
        </div>

        {/* Down Arrow */}
        <div className="flex flex-col items-center text-slate-400">
          <div className="w-0.5 h-4 bg-slate-300" />
          <ChevronDown className="w-4 h-4 -mt-1 text-slate-500" />
        </div>

        {/* Level 3: Heads of Departments (HODs) */}
        <div className="w-full max-w-md p-4 rounded-xl bg-slate-800 text-white border border-slate-700 shadow-sm text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-3 h-3" />
            <span>Departmental Leadership</span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight">
            HEADS OF DEPARTMENTS (HODs)
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Departmental administration • Academic supervision • Faculty & subject coordination • Department monitoring
          </p>
        </div>

        {/* Down Arrow branching into Faculty Members + Class In-Charges */}
        <div className="flex flex-col items-center text-slate-400">
          <div className="w-0.5 h-4 bg-slate-300" />
          <ChevronDown className="w-4 h-4 -mt-1 text-slate-500" />
        </div>

        {/* Level 4: Faculty Members + Class In-Charges (Parallel Responsibilities) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white text-[#0f2942] text-[10px] font-bold uppercase border border-slate-200 mb-1">
              <Briefcase className="w-3 h-3" />
              <span>Teaching & Mentorship</span>
            </div>
            <h4 className="text-sm font-extrabold text-[#0f2942]">FACULTY MEMBERS</h4>
            <p className="text-[11px] text-slate-600 mt-1">
              Teaching • Examination • Mentoring • Academic responsibilities
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white text-[#0f2942] text-[10px] font-bold uppercase border border-slate-200 mb-1">
              <ClipboardCheck className="w-3 h-3" />
              <span>Class Coordination</span>
            </div>
            <h4 className="text-sm font-extrabold text-[#0f2942]">CLASS IN-CHARGES</h4>
            <p className="text-[11px] text-slate-600 mt-1">
              Attendance • Discipline • Student communication • Class coordination
            </p>
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex flex-col items-center text-slate-400">
          <div className="w-0.5 h-4 bg-slate-300" />
          <ChevronDown className="w-4 h-4 -mt-1 text-slate-500" />
        </div>

        {/* Level 5: Non-Teaching / Technical Staff */}
        <div className="w-full max-w-md p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white text-slate-700 text-[10px] font-bold uppercase border border-slate-200 mb-1">
            <Wrench className="w-3 h-3" />
            <span>Campus Operations Support</span>
          </div>
          <h4 className="text-sm font-extrabold text-slate-900">
            NON-TEACHING / TECHNICAL STAFF
          </h4>
          <p className="text-[11px] text-slate-600 mt-1">
            Laboratory support • Library support • IT support • Office support • Technical support
          </p>
        </div>

        {/* Down Arrow */}
        <div className="flex flex-col items-center text-slate-400">
          <div className="w-0.5 h-4 bg-slate-300" />
          <ChevronDown className="w-4 h-4 -mt-1 text-slate-500" />
        </div>

        {/* Level 6: Students */}
        <div className="w-full max-w-md p-4 rounded-xl bg-[#0f2942] text-white border border-slate-800 shadow-sm text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-sky-200 text-[10px] font-bold uppercase tracking-wider mb-1">
            <GraduationCap className="w-3 h-3" />
            <span>Learners & Campus Community</span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight">
            STUDENTS
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Academic learning • Attendance • Assignments • Results • Syllabus • PYQs • College services
          </p>
        </div>

      </div>
    </div>
  );
};
