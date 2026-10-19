import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Pencil, 
  Trash2, 
  Calendar as CalendarIcon, 
  Filter, 
  X, 
  Info,
  Layers,
  ListFilter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { CalendarEvent } from '../../types';

// =============================================================================
// Helper Date Formatting & Calculation Utilities (No External Date Libraries)
// =============================================================================

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(datetimeStr?: string): string {
  if (!datetimeStr) return '';
  if (datetimeStr.includes('T')) {
    return datetimeStr.split('T')[0];
  }
  return datetimeStr.slice(0, 10);
}

function formatDisplayDate(dateKey: string): string {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatMonthYearHeader(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}

function isEventScheduledOnDate(event: CalendarEvent, dateKey: string): boolean {
  const startKey = parseDateKey(event.start_datetime);
  const endKey = parseDateKey(event.end_datetime) || startKey;
  if (!startKey) return false;
  return dateKey >= startKey && dateKey <= endKey;
}

const EVENT_CATEGORIES = [
  'All',
  'Classes',
  'Exams',
  'Assignments',
  'Holidays',
  'Seminars',
  'Hackathons',
  'Placements',
  'Important Dates'
] as const;

export const CalendarView: React.FC = () => {
  const { role, user } = useAuth();
  const isAuthorized = role === 'admin' || role === 'principal' || role === 'managing_director' || role === 'md' || role === 'hod' || role === 'teacher' || role === 'faculty';

  // Core Calendar Navigation State (Dynamic current date)
  const [currentNavDate, setCurrentNavDate] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => toLocalDateString(new Date()));
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Data State
  const [events, setEvents] = useState<CalendarEvent[]>(() => dataStore.getCalendar());
  const [loading, setLoading] = useState<boolean>(false);

  // Modal States
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<CalendarEvent['event_type']>('Classes');
  const [formDepartment, setFormDepartment] = useState('ALL');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:30 AM');
  const [formEndTime, setFormEndTime] = useState('12:30 PM');
  const [formVenue, setFormVenue] = useState('');
  const [formAudience, setFormAudience] = useState('All B.Tech Students');
  const [formDescription, setFormDescription] = useState('');
  const [formIsVerified, setFormIsVerified] = useState(true);

  // Load events on mount
  useEffect(() => {
    let isMounted = true;
    async function loadEvents() {
      try {
        setLoading(true);
        const data = await apiService.getCalendarEvents();
        if (isMounted && data) {
          setEvents(data);
        }
      } catch (err) {
        console.warn('Failed to load live calendar events:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadEvents();
    return () => { isMounted = false; };
  }, []);

  // Category Filtered Events
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'All') return events;
    return events.filter(e => e.event_type === selectedCategory);
  }, [events, selectedCategory]);

  // Today's String Key
  const todayDateStr = useMemo(() => toLocalDateString(new Date()), []);

  // Events on the currently selected date
  const selectedDateEvents = useMemo(() => {
    return filteredEvents.filter(ev => isEventScheduledOnDate(ev, selectedDateStr));
  }, [filteredEvents, selectedDateStr]);

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    setCurrentNavDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentNavDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentNavDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateStr(todayDateStr);
  };

  // Month Grid Cells Construction (Sunday = 0 to Saturday = 6)
  const calendarGridCells = useMemo(() => {
    const year = currentNavDate.getFullYear();
    const month = currentNavDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // 1. Previous Month Overflow Cells
    const prevCells = [];
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateKey = toLocalDateString(prevDate);
      const cellEvents = filteredEvents.filter(ev => isEventScheduledOnDate(ev, dateKey));
      prevCells.push({
        dayNumber: dayNum,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayDateStr,
        isSelected: dateKey === selectedDateStr,
        events: cellEvents,
        hasEvents: cellEvents.length > 0
      });
    }

    // 2. Current Month Cells
    const currentCells = [];
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const currDate = new Date(year, month, d);
      const dateKey = toLocalDateString(currDate);
      const cellEvents = filteredEvents.filter(ev => isEventScheduledOnDate(ev, dateKey));
      currentCells.push({
        dayNumber: d,
        dateKey,
        isCurrentMonth: true,
        isToday: dateKey === todayDateStr,
        isSelected: dateKey === selectedDateStr,
        events: cellEvents,
        hasEvents: cellEvents.length > 0
      });
    }

    // 3. Next Month Overflow Cells (Fill remaining columns to multiple of 7)
    const combinedLength = prevCells.length + currentCells.length;
    const nextDaysNeeded = combinedLength % 7 === 0 ? 0 : 7 - (combinedLength % 7);
    const nextCells = [];
    for (let d = 1; d <= nextDaysNeeded; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateKey = toLocalDateString(nextDate);
      const cellEvents = filteredEvents.filter(ev => isEventScheduledOnDate(ev, dateKey));
      nextCells.push({
        dayNumber: d,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayDateStr,
        isSelected: dateKey === selectedDateStr,
        events: cellEvents,
        hasEvents: cellEvents.length > 0
      });
    }

    return [...prevCells, ...currentCells, ...nextCells];
  }, [currentNavDate, filteredEvents, todayDateStr, selectedDateStr]);

  // Open Add Event Modal
  const handleOpenAddModal = (presetDate?: string) => {
    const targetDate = presetDate || selectedDateStr || todayDateStr;
    setEditingEvent(null);
    setFormTitle('');
    setFormCategory('Classes');
    setFormDepartment('ALL');
    setFormStartDate(targetDate);
    setFormEndDate(targetDate);
    setFormStartTime('09:30 AM');
    setFormEndTime('12:30 PM');
    setFormVenue('Academic Block A');
    setFormAudience('All B.Tech Students');
    setFormDescription('');
    setFormIsVerified(true);
    setShowModal(true);
  };

  // Open Edit Event Modal
  const handleOpenEditModal = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setFormTitle(ev.title || '');
    setFormCategory(ev.event_type || 'Classes');
    setFormDepartment(ev.department || 'ALL');
    setFormStartDate(parseDateKey(ev.start_datetime) || selectedDateStr);
    setFormEndDate(parseDateKey(ev.end_datetime) || parseDateKey(ev.start_datetime) || selectedDateStr);
    setFormStartTime(ev.start_time || '09:30 AM');
    setFormEndTime(ev.end_time || '12:30 PM');
    setFormVenue(ev.venue || ev.location || '');
    setFormAudience(ev.audience || 'All B.Tech Students');
    setFormDescription(ev.description || '');
    setFormIsVerified(ev.is_verified !== false);
    setShowModal(true);
  };

  // Submit Add or Edit Form
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formStartDate) return;

    setSubmitting(true);
    try {
      const payload: Omit<CalendarEvent, 'id'> = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        event_type: formCategory,
        department: formDepartment,
        start_datetime: `${formStartDate}T09:00:00`,
        end_datetime: `${formEndDate || formStartDate}T17:00:00`,
        start_time: formStartTime.trim() || '09:30 AM',
        end_time: formEndTime.trim() || '12:30 PM',
        venue: formVenue.trim() || 'HIET Campus',
        location: formVenue.trim() || 'HIET Campus',
        audience: formAudience.trim() || 'All Students & Faculty',
        is_verified: formIsVerified,
        created_by: user?.name || user?.email || 'Institution Admin'
      };

      if (editingEvent) {
        const updated = await apiService.updateCalendarEvent(editingEvent.id, payload);
        if (updated) {
          setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? { ...ev, ...payload } : ev));
        }
      } else {
        const created = await apiService.createCalendarEvent(payload);
        if (created) {
          setEvents(prev => [...prev, created]);
        }
      }
      setShowModal(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('Error saving calendar event:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Event Handler
  const handleDeleteEvent = async (id: string) => {
    try {
      await apiService.deleteCalendarEvent(id);
      setEvents(prev => prev.filter(ev => ev.id !== id));
      setDeleteCandidateId(null);
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  // Navy Monochrome Category Badge Helper
  const renderCategoryBadge = (category: string) => {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#0F2942]/10 text-[#0F2942] border border-[#0F2942]/20">
        {category}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in max-w-5xl mx-auto px-1 sm:px-2 pb-24">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            <span>HIET Digital Campus</span>
            <span>•</span>
            <span>Academic Session 2026-27</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F2942] mt-0.5 flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-[#0F2942] shrink-0" />
            <span>Academic Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
            Official institute schedule for academic classes, sessional & end-sem examinations, gazetted holidays, symposiums, and placement drives.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* Month / Agenda View Toggle */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-1 rounded-xl flex items-center gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F2942]'
              }`}
            >
              Month Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F2942]'
              }`}
            >
              Agenda List
            </button>
          </div>

          {/* Add Event (Authorized Roles Only) */}
          {isAuthorized && (
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="px-3.5 py-2 bg-[#0F2942] hover:bg-[#183B56] active:bg-[#0B1F33] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Event</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mr-1 shrink-0 font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span>Category:</span>
        </div>
        {EVENT_CATEGORIES.map(category => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'bg-white hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F2942] border border-[#E2E8F0]'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* 3. Monthly Calendar Grid View */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
          {/* Month Navigation Bar */}
          <div className="p-3 sm:p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="w-8 h-8 rounded-xl border border-[#E2E8F0] bg-white text-[#0F2942] hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <h2 className="text-base sm:text-lg font-bold text-[#0F2942] tracking-tight min-w-[140px] sm:min-w-[180px] text-center">
                {formatMonthYearHeader(currentNavDate)}
              </h2>

              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="w-8 h-8 rounded-xl border border-[#E2E8F0] bg-white text-[#0F2942] hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Jump to Today Button */}
            <button
              type="button"
              onClick={handleGoToToday}
              className="px-3 py-1.5 rounded-xl border border-[#0F2942] text-[#0F2942] hover:bg-[#0F2942] hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* 7-Column Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-[#E2E8F0] bg-white text-center">
            {[
              { short: 'S', full: 'Sun' },
              { short: 'M', full: 'Mon' },
              { short: 'T', full: 'Tue' },
              { short: 'W', full: 'Wed' },
              { short: 'T', full: 'Thu' },
              { short: 'F', full: 'Fri' },
              { short: 'S', full: 'Sat' }
            ].map((day, idx) => (
              <div 
                key={idx}
                className="py-2.5 text-[11px] sm:text-xs font-bold text-[#64748B] uppercase tracking-wider"
              >
                <span className="sm:hidden">{day.short}</span>
                <span className="hidden sm:inline">{day.full}</span>
              </div>
            ))}
          </div>

          {/* 7-Column Date Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#E2E8F0] bg-[#E2E8F0]/30">
            {calendarGridCells.map((cell, idx) => {
              const isSelected = cell.isSelected;
              const isToday = cell.isToday;

              return (
                <button
                  key={`${cell.dateKey}-${idx}`}
                  type="button"
                  onClick={() => setSelectedDateStr(cell.dateKey)}
                  className={`min-h-[58px] sm:min-h-[76px] p-1 sm:p-1.5 flex flex-col items-center justify-between transition-all cursor-pointer text-center relative ${
                    cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/70'
                  } ${
                    isSelected ? 'ring-2 ring-inset ring-[#0F2942] bg-[#F8FAFC]' : 'hover:bg-slate-100/60'
                  }`}
                >
                  {/* Date Number Badge */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm transition-all ${
                      isToday
                        ? 'bg-[#0F2942] text-white font-extrabold shadow-2xs'
                        : isSelected
                        ? 'border-2 border-[#0F2942] text-[#0F2942] font-extrabold bg-[#0F2942]/10'
                        : cell.isCurrentMonth
                        ? 'text-slate-800 font-semibold'
                        : 'text-slate-300 font-normal'
                    }`}
                  >
                    {cell.dayNumber}
                  </div>

                  {/* Event Dots Indicator (Navy Blue Dots) */}
                  <div className="h-3 flex items-center justify-center gap-0.5 mt-0.5">
                    {cell.hasEvents && (
                      <div className="flex items-center gap-0.5">
                        {cell.events.slice(0, 3).map((_, dotIdx) => (
                          <span
                            key={dotIdx}
                            className="w-1.5 h-1.5 rounded-full bg-[#0F2942]"
                          />
                        ))}
                        {cell.events.length > 3 && (
                          <span className="text-[9px] font-bold text-[#0F2942] leading-none">
                            +
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Events For Selected Date Section */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#0F2942] flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#0F2942]" />
              <span>
                {formatDisplayDate(selectedDateStr)}
              </span>
              {selectedDateStr === todayDateStr && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0F2942] text-white">
                  Today
                </span>
              )}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'event scheduled' : 'events scheduled'}
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </p>
          </div>

          {isAuthorized && (
            <button
              type="button"
              onClick={() => handleOpenAddModal(selectedDateStr)}
              className="text-xs font-bold text-[#0F2942] hover:text-[#183B56] flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Event for this Date</span>
            </button>
          )}
        </div>

        {/* Selected Date Event Cards List */}
        {selectedDateEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] flex items-center justify-center mx-auto">
              <CalendarDays className="w-6 h-6 text-[#0F2942]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">
                No events scheduled for this date
              </h4>
              <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
                No examinations, assignment submissions, holidays, or lectures have been scheduled for {formatDisplayDate(selectedDateStr)}.
              </p>
            </div>
            {isAuthorized && (
              <button
                type="button"
                onClick={() => handleOpenAddModal(selectedDateStr)}
                className="px-4 py-2 bg-[#0F2942] hover:bg-[#183B56] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Event on {selectedDateStr}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedDateEvents.map(ev => {
              const isMultiDay = ev.end_datetime && parseDateKey(ev.end_datetime) !== parseDateKey(ev.start_datetime);

              return (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {renderCategoryBadge(ev.event_type)}
                        {ev.is_verified !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F8FAFC] text-slate-700 border border-[#E2E8F0]">
                            <CheckCircle2 className="w-3 h-3 text-[#0F2942]" />
                            <span>Verified Schedule</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Provisional
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-bold text-[#64748B]">
                        {ev.department === 'ALL' ? 'All Departments' : `${ev.department} Dept`}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-extrabold text-[#0F2942] leading-snug">
                      {ev.title}
                    </h4>

                    {/* Description */}
                    {ev.description && (
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Grid */}
                  <div className="pt-3 border-t border-[#E2E8F0] space-y-2 text-xs text-slate-700">
                    {/* Timing */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#0F2942] shrink-0" />
                      <span className="font-semibold text-slate-800">
                        {ev.start_time || '09:30 AM'}
                        {ev.end_time && ` – ${ev.end_time}`}
                      </span>
                      {isMultiDay && (
                        <span className="text-[11px] text-[#64748B]">
                          (Runs through {formatDisplayDate(parseDateKey(ev.end_datetime))})
                        </span>
                      )}
                    </div>

                    {/* Venue / Location */}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0F2942] shrink-0" />
                      <span className="text-[#64748B]">
                        Venue: <strong className="text-slate-800">{ev.venue || ev.location || 'HIET Campus'}</strong>
                      </span>
                    </div>

                    {/* Target Audience */}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#0F2942] shrink-0" />
                      <span className="text-[#64748B]">
                        Audience: <strong className="text-slate-800">{ev.audience || 'All Students & Faculty'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Authorized User Actions (Edit & Delete) */}
                  {isAuthorized && (
                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(ev)}
                        className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-[#0F2942]" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteCandidateId(ev.id)}
                        className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-slate-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Agenda List View (Chronological Schedule) */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h3 className="text-base font-extrabold text-[#0F2942] flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-[#0F2942]" />
              <span>Chronological Semester Agenda</span>
            </h3>
            <span className="text-xs text-[#64748B] font-semibold">
              {filteredEvents.length} total events
            </span>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {filteredEvents
              .slice()
              .sort((a, b) => (a.start_datetime || '').localeCompare(b.start_datetime || ''))
              .map(ev => {
                const startDateStr = parseDateKey(ev.start_datetime);

                return (
                  <div key={ev.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1 sm:max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        {renderCategoryBadge(ev.event_type)}
                        <span className="text-xs font-extrabold text-[#0F2942]">
                          {formatDisplayDate(startDateStr)}
                        </span>
                        {startDateStr === todayDateStr && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F2942] text-white">
                            Today
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-[#0F2942]">
                        {ev.title}
                      </h4>

                      {ev.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {ev.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-[#64748B] pt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-[#0F2942]" />
                          {ev.start_time || '09:30 AM'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#0F2942]" />
                          {ev.venue || ev.location || 'HIET Campus'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#0F2942]" />
                          {ev.audience || 'All Students'}
                        </span>
                      </div>
                    </div>

                    {isAuthorized && (
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(ev)}
                          className="p-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F2942] transition cursor-pointer"
                          title="Edit Event"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidateId(ev.id)}
                          className="p-2 rounded-xl border border-[#E2E8F0] hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 6. Add / Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#0F2942]">
                  {editingEvent ? 'Edit Academic Calendar Event' : 'Schedule Academic Event'}
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Institutional schedule updates sync immediately across student and faculty portals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl border border-[#E2E8F0] hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Event Title <span className="text-[#0F2942]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Sessional 2 Written Examinations (B.Tech)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F2942] focus:border-[#0F2942]"
                />
              </div>

              {/* Category & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Event Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F2942] focus:border-[#0F2942]"
                  >
                    <option value="Classes">Classes & Academic Sessions</option>
                    <option value="Exams">Sessional & Final Examinations</option>
                    <option value="Assignments">Assignment Deadlines</option>
                    <option value="Holidays">College & Gazetted Holidays</option>
                    <option value="Seminars">Workshops & Seminars</option>
                    <option value="Hackathons">Hackathons & Fests</option>
                    <option value="Placements">Registration & Placement Drives</option>
                    <option value="Important Dates">Important University Milestones</option>
                    <option value="Events">General Campus Events</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Department Scope
                  </label>
                  <select
                    value={formDepartment}
                    onChange={e => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F2942] focus:border-[#0F2942]"
                  >
                    <option value="ALL">All Departments (Campus-wide)</option>
                    <option value="CSE">Computer Science & Engineering (CSE)</option>
                    <option value="ECE">Electronics & Communication (ECE)</option>
                    <option value="ME">Mechanical Engineering (ME)</option>
                    <option value="CE">Civil Engineering (CE)</option>
                  </select>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Start Date <span className="text-[#0F2942]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={e => {
                      setFormStartDate(e.target.value);
                      if (!formEndDate || formEndDate < e.target.value) {
                        setFormEndDate(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F2942] focus:border-[#0F2942]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F2942] focus:border-[#0F2942]"
                  />
                </div>
              </div>

              {/* Start Time & End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={formStartTime}
                    onChange={e => setFormStartTime(e.target.value)}
                    placeholder="e.g. 09:30 AM or All Day"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F2942] focus:border-[#0F2942]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={formEndTime}
                    onChange={e => setFormEndTime(e.target.value)}
                    placeholder="e.g. 12:30 PM or All Day"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F2942] focus:border-[#0F2942]"
                  />
                </div>
              </div>

              {/* Venue & Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Venue / Location
                  </label>
                  <input
                    type="text"
                    value={formVenue}
                    onChange={e => setFormVenue(e.target.value)}
                    placeholder="e.g. Exam Hall 1, Block A"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F2942] focus:border-[#0F2942]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={formAudience}
                    onChange={e => setFormAudience(e.target.value)}
                    placeholder="e.g. All B.Tech Students"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F2942] focus:border-[#0F2942]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Description & Instructions
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Provide syllabus coverage, mandatory instructions or link details..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F2942] focus:border-[#0F2942]"
                />
              </div>

              {/* Verified Institutional Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsVerified"
                  checked={formIsVerified}
                  onChange={e => setFormIsVerified(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0F2942] focus:ring-[#0F2942] border-[#E2E8F0]"
                />
                <label htmlFor="formIsVerified" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Mark as Verified Institutional Schedule (Official ERP Record)
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0F2942] hover:bg-[#183B56] active:bg-[#0B1F33] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Dialog */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#0F2942] border border-[#E2E8F0] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-[#0F2942]" />
            </div>

            <div>
              <h4 className="font-extrabold text-base text-[#0F2942]">
                Delete Calendar Event?
              </h4>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                This event will be permanently removed from all student, faculty, and administrative academic calendars.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidateId(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteEvent(deleteCandidateId)}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#0F2942] hover:bg-[#183B56] rounded-xl transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
