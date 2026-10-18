import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  CalendarDays,
  Send,
  Coffee,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { campusLifeStore } from '../../lib/campusLifeData';
import { MessDayMenu, MessFeedbackRecord } from '../../types';

interface Props {
  onNavigate?: (tab: any) => void;
}

const DAYS_OF_WEEK: MessDayMenu['day'][] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export const HostelMessView: React.FC<Props> = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const student = user?.studentMaster;
  const studentId = user?.id || 'prof-std-cse-001';
  const studentName = student?.name || user?.name || 'Aarav Sharma';

  const menu = campusLifeStore.getMessMenu();
  const [feedbackList, setFeedbackList] = useState<MessFeedbackRecord[]>(() =>
    campusLifeStore.getMessFeedback()
  );

  // Determine current day of week
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as MessDayMenu['day'];
  const [selectedDay, setSelectedDay] = useState<MessDayMenu['day']>(
    DAYS_OF_WEEK.includes(todayDayName) ? todayDayName : 'Monday'
  );

  // Feedback form state
  const [feedbackMeal, setFeedbackMeal] = useState<MessFeedbackRecord['meal_type']>('Lunch');
  const [tasteRating, setTasteRating] = useState(5);
  const [hygieneRating, setHygieneRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeDayMenu = menu.find(m => m.day === selectedDay) || menu[0];

  // Determine current live meal based on hour
  const currentHour = new Date().getHours();
  let liveMealType: 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner' = 'Dinner';
  if (currentHour >= 7 && currentHour < 10) liveMealType = 'Breakfast';
  else if (currentHour >= 12 && currentHour < 15) liveMealType = 'Lunch';
  else if (currentHour >= 16 && currentHour < 18) liveMealType = 'Snacks';
  else if (currentHour >= 19 && currentHour < 22) liveMealType = 'Dinner';

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const newRecord: MessFeedbackRecord = {
      id: `mess-fb-${Date.now()}`,
      student_id: studentId,
      student_name: studentName,
      meal_type: feedbackMeal,
      date: new Date().toISOString().split('T')[0],
      rating: tasteRating,
      hygiene_rating: hygieneRating,
      comment: comment.trim() || undefined,
      created_at: new Date().toISOString()
    };

    setTimeout(() => {
      campusLifeStore.addMessFeedback(newRecord);
      setFeedbackList(campusLifeStore.getMessFeedback());
      setSubmitting(false);
      setComment('');
      success('Feedback Submitted', 'Thank you! Your rating has been recorded for the Mess Committee review.');
    }, 400);
  };

  const avgRating = (
    feedbackList.reduce((acc, f) => acc + (f.rating + f.hygiene_rating) / 2, 0) /
    (feedbackList.length || 1)
  ).toFixed(1);

  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">
      {/* 1. Institutional Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold uppercase mb-2 border border-amber-200">
              <UtensilsCrossed className="w-3 h-3 text-amber-600" />
              <span>Campus Dining & Nutrition Cell</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Hostel Mess Weekly Menu & Daily Rating
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              FSSAI-compliant balanced meal schedules for Shivalik & Dhauladhar Hostels, live meal highlights, and student quality feedback.
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-center pr-3 border-r border-slate-200">
              <div className="text-lg font-black text-amber-600 flex items-center justify-center gap-0.5">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{avgRating}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Satisfaction</span>
            </div>
            <div className="text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Mess In-Charge</span>
              <div className="font-bold text-slate-800">Chef Om Prakash</div>
              <span className="text-[10px] text-slate-500">Hostel Dining Block</span>
            </div>
          </div>
        </div>

        {/* 7-Day Day Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-slate-100">
          {DAYS_OF_WEEK.map(day => {
            const isSelected = day === selectedDay;
            const isToday = day === todayDayName;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0f2942] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{day}</span>
                {isToday && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Today's Special & Active Day Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Breakfast */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700 inline-block">
                <Sun className="w-5 h-5 text-amber-600" />
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                07:30 - 09:30 AM
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Breakfast</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {activeDayMenu.breakfast}
            </p>
          </div>
          {liveMealType === 'Breakfast' && selectedDay === todayDayName && (
            <div className="pt-2 border-t border-slate-100 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Serving Now in Dining Hall</span>
            </div>
          )}
        </div>

        {/* Lunch */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-orange-50 text-orange-700 inline-block">
                <Coffee className="w-5 h-5 text-orange-600" />
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                12:30 - 02:30 PM
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Lunch</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {activeDayMenu.lunch}
            </p>
          </div>
          {liveMealType === 'Lunch' && selectedDay === todayDayName && (
            <div className="pt-2 border-t border-slate-100 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Serving Now in Dining Hall</span>
            </div>
          )}
        </div>

        {/* Evening Snacks */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-700 inline-block">
                <Sunset className="w-5 h-5 text-rose-600" />
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                04:45 - 06:00 PM
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Evening Snacks</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {activeDayMenu.snacks}
            </p>
          </div>
          {liveMealType === 'Snacks' && selectedDay === todayDayName && (
            <div className="pt-2 border-t border-slate-100 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Serving Now in Dining Hall</span>
            </div>
          )}
        </div>

        {/* Dinner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 inline-block">
                <Moon className="w-5 h-5 text-indigo-600" />
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                07:45 - 09:45 PM
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Dinner</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {activeDayMenu.dinner}
            </p>
          </div>
          {liveMealType === 'Dinner' && selectedDay === todayDayName && (
            <div className="pt-2 border-t border-slate-100 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Serving Now in Dining Hall</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Daily Food Quality Rating & Feedback Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback Input Form */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#0f2942]" />
              <span>Submit Meal Feedback</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Help maintain food hygiene and taste standards.
            </p>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Meal</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const).map(m => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setFeedbackMeal(m)}
                    className={`py-1.5 rounded-xl font-bold text-[11px] border transition ${
                      feedbackMeal === m
                        ? 'bg-[#0f2942] text-white border-[#0f2942]'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Taste & Quality Rating (1-5)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setTasteRating(star)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= tasteRating
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="font-bold text-slate-700 ml-2">{tasteRating} / 5</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Hygiene & Cleanliness Rating (1-5)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setHygieneRating(star)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= hygieneRating
                          ? 'fill-emerald-500 text-emerald-600'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="font-bold text-slate-700 ml-2">{hygieneRating} / 5</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Suggestions / Remarks (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="E.g., Sabzi was delicious today; tea needs more ginger..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0f2942]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Rating'}</span>
            </button>
          </form>
        </div>

        {/* Recent Student Feedback List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-[#0f2942]" />
              <span>Hostelers Recent Reviews</span>
            </h3>
            <span className="text-xs text-slate-500">{feedbackList.length} Feedbacks logged</span>
          </div>

          <div className="space-y-3">
            {feedbackList.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.student_name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px]">
                      {item.meal_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{item.rating}.0</span>
                  </div>
                </div>

                {item.comment && (
                  <p className="text-slate-600 text-xs italic">
                    "{item.comment}"
                  </p>
                )}

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Hygiene Score: {item.hygiene_rating}/5</span>
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
