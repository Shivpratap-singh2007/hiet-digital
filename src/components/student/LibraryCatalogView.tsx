import React, { useState } from 'react';
import {
  Library,
  Search,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  BookmarkCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { campusLifeStore } from '../../lib/campusLifeData';
import { LibraryBook, BorrowedBookRecord } from '../../types';

interface Props {
  onNavigate?: (tab: any) => void;
}

export const LibraryCatalogView: React.FC<Props> = () => {
  const { user } = useAuth();
  const { success, info } = useToast();
  const studentId = user?.id || 'prof-std-cse-001';

  const [books] = useState<LibraryBook[]>(() => campusLifeStore.getLibraryBooks());
  const [borrowed, setBorrowed] = useState<BorrowedBookRecord[]>(() =>
    campusLifeStore.getBorrowedBooks(studentId)
  );

  const [activeTab, setActiveTab] = useState<'catalog' | 'issued'>('catalog');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');

  const filteredBooks = books.filter(b => {
    const matchDept = selectedDept === 'All' || b.department.toLowerCase().includes(selectedDept.toLowerCase());
    const matchSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.accession_no.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  const handleRenewBook = (recordId: string, title: string) => {
    campusLifeStore.renewBook(recordId);
    setBorrowed(campusLifeStore.getBorrowedBooks(studentId));
    success('Book Renewed', `"${title}" due date extended by 14 days.`);
  };

  const handleRequestIssue = (book: LibraryBook) => {
    if (book.available_copies <= 0) {
      info('Book Reserved', `All copies currently in circulation. You have been added to the reservation queue for "${book.title}".`);
      return;
    }

    const newRecord: BorrowedBookRecord = {
      id: `borrow-${Date.now()}`,
      book_id: book.id,
      book_title: book.title,
      accession_no: book.accession_no,
      student_id: studentId,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'issued',
      fine_amount: 0,
      renew_count: 0
    };

    campusLifeStore.borrowBook(newRecord);
    setBorrowed(campusLifeStore.getBorrowedBooks(studentId));
    success('Issue Request Approved', `"${book.title}" issued for 21 days. Collect from ${book.shelf_location}.`);
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase mb-2 border border-blue-100">
              <Library className="w-3 h-3 text-blue-600" />
              <span>Central Library & Book Bank • OPAC System</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Library Catalog & Book Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Search over 25,000+ technical volumes, check shelf location, track your borrowed textbooks, and renew online.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'catalog'
                  ? 'bg-[#0f2942] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Browse Catalog ({books.length})
            </button>
            <button
              onClick={() => setActiveTab('issued')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'issued'
                  ? 'bg-[#0f2942] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>My Issued Books ({borrowed.length})</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500">Currently Issued</span>
            <div className="text-base font-black text-slate-900 mt-0.5">{borrowed.length} Books</div>
            <span className="text-[10px] text-slate-400">Max limit: 4 books</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500">Overdue Fines</span>
            <div className="text-base font-black text-amber-700 mt-0.5">
              ₹{borrowed.reduce((acc, b) => acc + b.fine_amount, 0)}
            </div>
            <span className="text-[10px] text-slate-400">₹5 / day post-due date</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500">Digital Library & IEEE</span>
            <div className="text-base font-black text-emerald-700 mt-0.5">Active</div>
            <span className="text-[10px] text-slate-400">Campus Wi-Fi login</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500">Library Timings</span>
            <div className="text-base font-black text-slate-900 mt-0.5">08:30 AM - 08:00 PM</div>
            <span className="text-[10px] text-slate-400">Open 6 days a week</span>
          </div>
        </div>
      </div>

      {/* 2. My Issued Books View */}
      {activeTab === 'issued' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-[#0f2942]" />
            <span>My Borrowed Volumes</span>
          </h2>

          {borrowed.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">You do not have any issued books at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {borrowed.map(item => {
                const isOverdue = item.status === 'overdue' || new Date(item.due_date) < new Date();
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                          {item.accession_no}
                        </span>
                        {isOverdue ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-[10px] rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Overdue (Fine: ₹{item.fine_amount})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                            Active Issue
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.book_title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span>Issued: {item.issue_date}</span>
                        <span>•</span>
                        <span className={isOverdue ? 'font-bold text-rose-700' : 'font-semibold text-slate-700'}>
                          Due Date: {item.due_date}
                        </span>
                        <span>•</span>
                        <span>Renewed: {item.renew_count} times</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRenewBook(item.id, item.book_title)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0f2942] text-[#0f2942] font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition self-start sm:self-auto cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Renew 14 Days</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Catalog Browse & Search View */}
      {activeTab === 'catalog' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, author, subject, or accession code..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#0f2942]"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
            >
              <option value="All">All Departments</option>
              <option value="Computer">Computer Science</option>
              <option value="Electronics">Electronics & Comm.</option>
              <option value="Applied">Applied Sciences</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            {filteredBooks.map(book => {
              const isAvailable = book.available_copies > 0;
              return (
                <div
                  key={book.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs transition space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                        {book.accession_no}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isAvailable ? `${book.available_copies} Copies Available` : 'All Issued'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      By {book.author}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {book.publisher} • {book.edition}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>{book.shelf_location}</span>
                    </span>

                    <button
                      onClick={() => handleRequestIssue(book)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                        isAvailable
                          ? 'bg-[#0f2942] hover:bg-[#0a1c2e] text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isAvailable ? 'Request Issue' : 'Reserve Book'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
