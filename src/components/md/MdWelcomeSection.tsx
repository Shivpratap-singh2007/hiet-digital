import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function getKolkataTimeInfo(): { greeting: string; formattedTime: string; formattedDate: string } {
  const now = new Date();

  // Determine Asia/Kolkata hour
  const hourString = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    hour12: false
  }).format(now);
  const kolkataHour = parseInt(hourString, 10);

  const greeting = kolkataHour < 12 
    ? 'Good Morning' 
    : kolkataHour < 17 
    ? 'Good Afternoon' 
    : 'Good Evening';

  // Format date: e.g. 09 Oct 2026
  const dateFormatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(now);

  // Format time: e.g. 03:42 PM IST
  const timeFormatted = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(now);

  return {
    greeting,
    formattedDate: dateFormatted,
    formattedTime: `${timeFormatted} IST`
  };
}

export const MdWelcomeSection: React.FC = () => {
  const { user } = useAuth();
  const [timeInfo, setTimeInfo] = useState(getKolkataTimeInfo);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeInfo(getKolkataTimeInfo());
    }, 15000); // refresh every 15s
    return () => clearInterval(timer);
  }, []);

  // Extract clean authenticated name
  const rawName = user?.name || 'Managing Director';
  // Strip parenthetical suffix if present (e.g. "Dushyant Kaistha (Managing Director)" -> "Dushyant Kaistha")
  const displayName = rawName.replace(/\s*\([^)]*\)/g, '').trim() || 'Managing Director';


  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
            Directorate Executive Suite
          </span>
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono hidden sm:inline">
            HIET Vidyanagar
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight mt-1.5">
          {timeInfo.greeting}, {displayName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
          Here&apos;s the overview of your institution.
        </p>
      </div>

      <div className="flex items-center gap-3 self-start md:self-auto bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 shrink-0">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
          <Calendar className="w-3.5 h-3.5 text-[#0f2942] dark:text-blue-400" />
          <span>{timeInfo.formattedDate}</span>
        </div>
        <span className="text-slate-300 dark:text-zinc-600">|</span>
        <div className="flex items-center gap-1.5 font-mono text-slate-900 dark:text-zinc-100 font-bold">
          <Clock className="w-3.5 h-3.5 text-[#0f2942] dark:text-blue-400" />
          <span>{timeInfo.formattedTime}</span>
        </div>
      </div>
    </div>
  );
};
