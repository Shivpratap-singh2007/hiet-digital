import React, { useState, useEffect } from 'react';
import { Clock, MapPin, User, Sparkles, ChevronRight, CheckCircle2, Calendar } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { TimetableSlot } from '../../types';

export const TimetableActiveView: React.FC = () => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const branch = student?.branch || 'CSE';
  const semester = student?.semester || 6;
  const section = student?.section || 'A';

  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => dataStore.getTimetable());

  useEffect(() => {
    let isMounted = true;
    async function loadLiveTimetable() {
      try {
        const slots = await apiService.getTimetable({
          branch,
          semester,
          section
        });
        if (isMounted && slots && slots.length > 0) {
          setTimetable(slots);
        }
      } catch (e) {
        console.warn('Error loading live timetable from Supabase:', e);
      }
    }
    loadLiveTimetable();
    return () => { isMounted = false; };
  }, [branch, semester, section]);

  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return (today === 'Sunday' || today === 'Saturday') ? 'Monday' : today;
  });
  
  // Simulation offset for testing at any time of day/night
  const [simulatedTime, setSimulatedTime] = useState<string>('live');

  // Compute active current hour and minute
  const getCurrentHourAndMinute = () => {
    if (simulatedTime === '09:30') return { hour: 9, minute: 30 };
    if (simulatedTime === '10:30') return { hour: 10, minute: 30 };
    if (simulatedTime === '11:30') return { hour: 11, minute: 30 };
    if (simulatedTime === '12:30') return { hour: 12, minute: 30 };
    if (simulatedTime === '14:30') return { hour: 14, minute: 30 };
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes() };
  };

  const { hour: currentHour, minute: currentMinute } = getCurrentHourAndMinute();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  // Find currently active slot
  const isSlotActive = (slot: TimetableSlot) => {
    const slotStart = slot.start_hour_24 * 60 + slot.start_minute;
    const slotEnd = slot.end_hour_24 * 60 + slot.end_minute;
    return currentTotalMinutes >= slotStart && currentTotalMinutes < slotEnd;
  };

  // Find upcoming slot
  const isSlotUpcoming = (slot: TimetableSlot) => {
    const slotStart = slot.start_hour_24 * 60 + slot.start_minute;
    return slotStart > currentTotalMinutes && slotStart - currentTotalMinutes <= 60;
  };

  const daySlots = timetable.filter((t: TimetableSlot) => t.day === selectedDay);
  const activeSlot = daySlots.find(isSlotActive);

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 animate-spin-slow" />
            <span>Class Timetable & Live Schedule</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-highlights active and upcoming lectures in real-time
          </p>
        </div>

        {/* Time Simulation Quick Pill for Evaluators */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
          <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5">
            Simulate Time:
          </span>
          <select
            value={simulatedTime}
            onChange={e => setSimulatedTime(e.target.value)}
            className="text-xs font-bold bg-white text-blue-700 px-2.5 py-1 rounded-lg border border-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="live">System Real Time</option>
            <option value="09:30">09:30 AM (Maths Active)</option>
            <option value="10:30">10:30 AM (Physics Active)</option>
            <option value="11:30">11:30 AM (BEE Active)</option>
            <option value="12:30">12:30 PM (Comm Active)</option>
            <option value="14:30">02:30 PM (EVS Active)</option>
          </select>
        </div>
      </div>

      {/* Active Lecture Billboard Card */}
      {activeSlot ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md relative overflow-hidden animate-pulse-subtle">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold tracking-wider uppercase border border-white/30 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              NOW • Currently Active Class
            </span>
            <span className="text-xs font-mono font-bold text-blue-100">
              {activeSlot.start_time} – {activeSlot.end_time}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3 mt-1">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {activeSlot.subject_name}
              </h3>
              <p className="text-xs text-blue-100 font-medium mt-0.5">
                Faculty: <strong>{activeSlot.teacher_name}</strong>
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 text-xs font-bold text-white backdrop-blur-xs">
                <MapPin className="w-3.5 h-3.5 text-cyan-300" />
                <span>{activeSlot.room_number}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="font-medium">No class currently in session. Next class starts according to schedule below.</span>
          </div>
          <button
            onClick={() => setSimulatedTime('09:30')}
            className="text-[11px] font-bold text-blue-600 hover:underline shrink-0"
          >
            Test Live Highlight →
          </button>
        </div>
      )}

      {/* Day of Week Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedDay === day
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Class Schedule Timeline Cards */}
      <div className="space-y-2.5">
        {daySlots.map((slot: TimetableSlot) => {
          const active = isSlotActive(slot);
          const upcoming = isSlotUpcoming(slot);

          return (
            <div
              key={slot.id}
              className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                active
                  ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                  : upcoming
                  ? 'bg-amber-50/60 border-amber-300 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Time Strip */}
                <div className="min-w-20 sm:min-w-24 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Clock className={`w-3.5 h-3.5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className={`text-xs font-extrabold ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                      {slot.start_time}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    to {slot.end_time}
                  </span>
                </div>

                {/* Subject & Teacher Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-extrabold truncate ${active ? 'text-blue-900' : 'text-slate-900'}`}>
                      {slot.subject_name}
                    </h4>
                    {active && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                        NOW
                      </span>
                    )}
                    {upcoming && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider">
                        UPCOMING
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {slot.teacher_name} • {slot.subject_code}
                  </p>
                </div>

                {/* Room Pill */}
                <div className="shrink-0 text-right">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                    active 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    <MapPin className="w-3 h-3" />
                    <span>{slot.room_number}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
