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
  Moon,
  ShoppingBag,
  Plus,
  Minus,
  QrCode,
  Receipt,
  Store
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

const CANTEEN_ITEMS = [
  { id: 'c1', name: 'Aloo Pyaz Paratha + Dahi', price: 45, category: 'Hot Breakfast', veg: true },
  { id: 'c2', name: 'Crispy Samosa Plate (2 pcs + Chutney)', price: 30, category: 'Hot Snacks', veg: true },
  { id: 'c3', name: 'Special Pahadi Rajma Chawal Combo', price: 70, category: 'Lunch Special', veg: true },
  { id: 'c4', name: 'Veg Hakka Noodles', price: 60, category: 'Chinese Quick Bites', veg: true },
  { id: 'c5', name: 'Grilled Cheese Sandwich', price: 55, category: 'Snacks', veg: true },
  { id: 'c6', name: 'Cold Coffee with Ice Cream', price: 50, category: 'Beverages', veg: true },
  { id: 'c7', name: 'Masala Cutting Chai', price: 15, category: 'Beverages', veg: true },
  { id: 'c8', name: 'Paneer Burger + French Fries', price: 75, category: 'Fast Food', veg: true }
];

export const HostelMessView: React.FC<Props> = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const student = user?.studentMaster;
  const studentId = user?.id || 'prof-std-cse-001';
  const studentName = student?.name || user?.name || 'Aarav Sharma';

  const [primaryTab, setPrimaryTab] = useState<'mess' | 'canteen'>('mess');

  // Canteen Order State
  const [canteenCart, setCanteenCart] = useState<Record<string, number>>({});
  const [pickupSlot, setPickupSlot] = useState<'11:15 AM (Morning Recess)' | '01:15 PM (Lunch Break)' | '03:45 PM (Evening Tea)'>('01:15 PM (Lunch Break)');
  const [activeToken, setActiveToken] = useState<{
    tokenNo: string;
    items: { name: string; qty: number; price: number }[];
    total: number;
    slot: string;
    status: 'Preparing in Kitchen' | 'Ready for Pickup';
  } | null>(null);

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

  // Canteen Cart Handlers
  const handleAddToCart = (id: string) => {
    setCanteenCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCanteenCart(prev => {
      const next = { ...prev };
      if (next[id] > 1) {
        next[id] -= 1;
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const cartTotalAmount = Object.entries(canteenCart).reduce((sum, [id, qty]) => {
    const item = CANTEEN_ITEMS.find(it => it.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const cartItemCount = Object.values(canteenCart).reduce((a, b) => a + b, 0);

  const handlePlaceCanteenOrder = () => {
    if (cartItemCount === 0) return;
    const orderedItems = Object.entries(canteenCart).map(([id, qty]) => {
      const item = CANTEEN_ITEMS.find(it => it.id === id)!;
      return { name: item.name, qty, price: item.price };
    });

    const tokenNo = `CAN-${Date.now().toString().slice(-4)}`;
    setActiveToken({
      tokenNo,
      items: orderedItems,
      total: cartTotalAmount,
      slot: pickupSlot,
      status: 'Preparing in Kitchen'
    });
    setCanteenCart({});
    success('Order Placed Successfully!', `Token #${tokenNo} generated. Show this at Canteen Counter for express pickup.`);
  };

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
              <span>Campus Dining, Mess & Cafeteria Desk</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Hostel Mess & Campus Canteen Express Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              FSSAI-compliant balanced meal schedules for Hostels, plus Zero-Queue Canteen pre-ordering with digital pickup token.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setPrimaryTab('mess')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  primaryTab === 'mess'
                    ? 'bg-[#0f2942] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hostel Mess Menu
              </button>
              <button
                type="button"
                onClick={() => setPrimaryTab('canteen')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  primaryTab === 'canteen'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Canteen Pre-Order (Zero-Queue)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 7-Day Day Selector Pills (Only for Mess Menu) */}
        {primaryTab === 'mess' && (
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
        )}
      </div>

      {/* 2. Today's Special & Active Day Menu Grid (Mess Only) */}
      {primaryTab === 'mess' && (
        <div className="space-y-6">
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
      )}

      {/* VIEW 2: CAMPUS CANTEEN ZERO-QUEUE PRE-ORDER & DIGITAL TOKEN */}
      {primaryTab === 'canteen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Canteen Menu Grid */}
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Store className="w-5 h-5 text-amber-600" />
                      <span>Campus Canteen Express Menu</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select your favorite snacks & beverages to skip the queue during class break.
                    </p>
                  </div>

                  {/* Slot selector */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-bold">Pickup Slot:</span>
                    <select
                      value={pickupSlot}
                      onChange={e => setPickupSlot(e.target.value as any)}
                      className="p-1.5 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs focus:outline-hidden"
                    >
                      <option value="11:15 AM (Morning Recess)">11:15 AM (Recess)</option>
                      <option value="01:15 PM (Lunch Break)">01:15 PM (Lunch)</option>
                      <option value="03:45 PM (Evening Tea)">03:45 PM (Tea)</option>
                    </select>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {CANTEEN_ITEMS.map(item => {
                    const countInCart = canteenCart[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                          countInCart > 0
                            ? 'border-amber-400 bg-amber-50/40 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-xs">{item.name}</h4>
                          <span className="text-sm font-black text-slate-900 block font-mono">₹{item.price}</span>
                        </div>

                        {countInCart > 0 ? (
                          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.id)}
                              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-xs w-4 text-center">{countInCart}</span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item.id)}
                              className="w-6 h-6 rounded-lg bg-amber-600 text-white hover:bg-amber-700 flex items-center justify-center font-bold cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Order Token & Cart */}
            <div className="lg:col-span-4 space-y-4">
              {/* Active Token Card (If Generated) */}
              {activeToken && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-lg space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-white/20 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                      Express Canteen Token
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-orange-900">
                      {activeToken.status}
                    </span>
                  </div>

                  <div className="text-center py-2">
                    <span className="text-xs text-amber-100 font-semibold">TOKEN NUMBER</span>
                    <h2 className="text-4xl font-black text-white font-mono tracking-widest">{activeToken.tokenNo}</h2>
                    <p className="text-[11px] text-amber-100 mt-1">Pickup Counter: <strong>Counter #2 (Express Lane)</strong></p>
                  </div>

                  <div className="bg-black/20 rounded-2xl p-3 text-xs space-y-1.5 border border-white/10">
                    <div className="flex justify-between text-amber-100 text-[11px] font-bold">
                      <span>Pickup Slot:</span>
                      <span>{activeToken.slot}</span>
                    </div>
                    <div className="border-t border-white/10 pt-1.5 space-y-1">
                      {activeToken.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span>{it.qty}x {it.name}</span>
                          <span className="font-mono">₹{it.price * it.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-black text-sm pt-1.5 border-t border-white/20">
                      <span>Total Paid:</span>
                      <span>₹{activeToken.total}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-amber-200 text-center leading-tight">
                    Show this token screen at Counter 2 when the bell rings. No cash line required!
                  </p>
                </div>
              )}

              {/* Cart Drawer */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <span>Your Canteen Tray ({cartItemCount})</span>
                  </h4>
                  {cartItemCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setCanteenCart({})}
                      className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {cartItemCount === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
                    <span>Your tray is empty. Add items from the menu to pre-order.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {Object.entries(canteenCart).map(([id, qty]) => {
                        const item = CANTEEN_ITEMS.find(it => it.id === id)!;
                        return (
                          <div key={id} className="flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-800">{item.name}</span>
                              <span className="text-slate-400 text-[11px] block font-mono">₹{item.price} x {qty}</span>
                            </div>
                            <span className="font-black text-slate-900 font-mono">₹{item.price * qty}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between font-extrabold text-sm">
                      <span className="text-slate-700">Total Payable:</span>
                      <span className="text-slate-900 font-mono">₹{cartTotalAmount}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePlaceCanteenOrder}
                      className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Generate Pickup Token (₹{cartTotalAmount})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
