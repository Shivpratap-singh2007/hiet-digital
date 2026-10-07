import React, { useState } from 'react';
import { CalendarDays, Filter, Plus, Calendar, Clock, MapPin, Tag } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { CalendarEvent } from '../../types';
import { formatDate } from '../../lib/utils';

export const CalendarView: React.FC = () => {
  const { role } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>(() => dataStore.getCalendar());
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<CalendarEvent['event_type']>('Events');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);

  const eventTypes: CalendarEvent['event_type'][] = [
    'Classes',
    'Exams',
    'Holidays',
    'Events',
    'Seminars',
    'Hackathons',
    'Assignments',
    'Important Dates'
  ];

  const filteredEvents = selectedType === 'All'
    ? events
    : events.filter(e => e.event_type === selectedType);

  const getTypeStyle = (type: CalendarEvent['event_type']) => {
    switch (type) {
      case 'Exams':
        return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200';
      case 'Holidays':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
      case 'Hackathons':
      case 'Events':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200';
      case 'Seminars':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDatetime) return;

    setSubmitting(true);
    const newEv = await apiService.createCalendarEvent({
      title,
      description,
      event_type: eventType,
      start_datetime: startDatetime,
      end_datetime: endDatetime || startDatetime,
      department
    });

    setEvents(prev => [...prev, newEv]);
    setSubmitting(false);
    setShowAddModal(false);
    setTitle('');
    setDescription('');
    setStartDatetime('');
    setEndDatetime('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-700 dark:text-blue-400" />
            HIET College Academic Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key semester dates, mid-terms, final exams, Himachal gazetted holidays, and technical symposiums
          </p>
        </div>

        {(role === 'admin' || role === 'hod') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Schedule Event
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedType('All')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition ${
            selectedType === 'All'
              ? 'bg-blue-700 text-white font-semibold'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          All Schedules
        </button>
        {eventTypes.map(t => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition ${
              selectedType === t
                ? 'bg-blue-700 text-white font-semibold'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Events Timeline / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEvents.map(ev => (
          <div
            key={ev.id}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTypeStyle(ev.event_type)}`}>
                  {ev.event_type}
                </span>

                <span className="text-[11px] font-semibold text-slate-400">
                  {ev.department === 'ALL' ? 'All Campus' : `${ev.department} Dept`}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {ev.title}
              </h3>

              {ev.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {ev.description}
                </p>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-400">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(ev.start_datetime)}
              </span>
              {ev.end_datetime && ev.end_datetime !== ev.start_datetime && (
                <span className="text-[11px] text-slate-400">
                  until {formatDate(ev.end_datetime)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Publish Calendar Event
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Events appear automatically on students' and teachers' academic calendars.
            </p>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. End-Semester Practical Lab Vivas"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {eventTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="ALL">All Departments</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDatetime}
                    onChange={e => setStartDatetime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDatetime}
                    onChange={e => setEndDatetime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Description / Venue Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide instructions, venue or timings..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium rounded-lg"
                >
                  {submitting ? 'Saving...' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
